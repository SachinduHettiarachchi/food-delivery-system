import { test, expect } from '@playwright/test';
import { loginViaAPI, loginViaUI, logout, clearSession, USERS } from './helpers/auth';

/**
 * Auth tests run serially to avoid parallel DB writes on the same accounts.
 */
test.describe('Authentication', () => {

  /* ── Registration ──────────────────────────────────────────────────── */
  test.describe('Registration', () => {

    test('customer can register with valid details', async ({ page }) => {
      const unique = Date.now();
      await page.goto('/register');

      // Default role is "customer"
      await page.locator('input[name="name"]').fill(`Test User ${unique}`);
      await page.locator('input[name="email"]').fill(`user.${unique}@test.com`);
      await page.locator('input[name="password"]').fill('Password1!');
      await page.locator('input[name="confirmPassword"]').fill('Password1!');
      await page.getByRole('button', { name: /create account/i }).click();

      // Redirects to /restaurants on success
      await page.waitForURL('**/restaurants', { timeout: 10_000 });
      expect(page.url()).toContain('/restaurants');
    });

    test('restaurant admin can register and lands on dashboard', async ({ page }) => {
      const unique = Date.now();
      await page.goto('/register');

      // Switch to Restaurant role
      await page.getByRole('button', { name: /restaurant/i }).click();

      await page.locator('input[name="name"]').fill(`Owner ${unique}`);
      await page.locator('input[name="email"]').fill(`owner.${unique}@test.com`);
      await page.locator('input[name="password"]').fill('Password1!');
      await page.locator('input[name="confirmPassword"]').fill('Password1!');
      await page.getByRole('button', { name: /create account/i }).click();

      await page.waitForURL('**/restaurant/dashboard', { timeout: 10_000 });
      expect(page.url()).toContain('/restaurant/dashboard');
    });

    test('mismatched passwords shows error', async ({ page }) => {
      await page.goto('/register');
      await page.locator('input[name="name"]').fill('Test User');
      await page.locator('input[name="email"]').fill('mismatch@test.com');
      await page.locator('input[name="password"]').fill('Password1!');
      await page.locator('input[name="confirmPassword"]').fill('Different1!');
      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
      // Should NOT navigate away
      expect(page.url()).toContain('/register');
    });

    test('duplicate email shows error', async ({ page }) => {
      const unique = Date.now();
      const email = `dup.${unique}@test.com`;
      // Register once via API
      await page.goto('/');
      await page.request.post('/api/auth/register', {
        data: { name: 'First', email, password: 'Password1!', role: 'customer' },
      });

      // Try again via UI
      await page.goto('/register');
      await page.locator('input[name="name"]').fill('Second');
      await page.locator('input[name="email"]').fill(email);
      await page.locator('input[name="password"]').fill('Password1!');
      await page.locator('input[name="confirmPassword"]').fill('Password1!');
      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.locator('[role="status"]').getByText(/already|registered/i)).toBeVisible({ timeout: 6_000 });
    });
  });

  /* ── Login ─────────────────────────────────────────────────────────── */
  test.describe('Login', () => {

    test.beforeAll(async ({ browser }) => {
      // Ensure test accounts exist
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto('/');
      for (const u of [USERS.customer, USERS.restaurantAdmin]) {
        await page.request.post('/api/auth/register', {
          data: { name: u.name, email: u.email, password: u.password, role: u.role },
        }).catch(() => { /* ignore 409 */ });
      }
      await ctx.close();
    });

    test('customer logs in via UI and lands on /restaurants', async ({ page }) => {
      await loginViaUI(page, USERS.customer.email, USERS.customer.password);
      await page.waitForURL('**/restaurants', { timeout: 10_000 });
      expect(page.url()).toContain('/restaurants');
    });

    test('restaurant admin logs in via UI and lands on /restaurant/dashboard', async ({ page }) => {
      await loginViaUI(page, USERS.restaurantAdmin.email, USERS.restaurantAdmin.password);
      await page.waitForURL('**/restaurant/dashboard', { timeout: 10_000 });
      expect(page.url()).toContain('/restaurant/dashboard');
    });

    test('wrong password does not grant access', async ({ page }) => {
      // BUG: The global axios 401 interceptor in api.js calls window.location.href="/login"
      // for ALL 401 responses, including failed login attempts. This causes a hard page reload
      // before the inline errorMsg (setErrorMsg) can render. The user never sees the error
      // banner — they just get reloaded back to /login silently. The fix would be to exclude
      // the /auth/login endpoint from the global 401 redirect in the interceptor.
      // We test here that wrong credentials do NOT grant access to authenticated routes.

      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      await page.locator('input[name="email"]').click();
      await page.locator('input[name="email"]').pressSequentially(USERS.customer.email);
      await page.locator('input[name="password"]').click();
      await page.locator('input[name="password"]').pressSequentially('WrongPassword9!');

      await page.locator('input[name="password"]').press('Enter');

      // The 401 interceptor reloads /login — user is NOT authenticated
      await page.waitForURL('**/login', { timeout: 8_000 });
      expect(page.url()).toContain('/login');

      // No auth token was stored
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    });

    test('token persists after page reload', async ({ page }) => {
      await loginViaAPI(page, USERS.customer.email, USERS.customer.password);
      await page.goto('/restaurants');
      await page.reload();
      // Nav shows customer links (Restaurants, My Orders etc.) — not Sign In
      await expect(page.getByRole('link', { name: /my orders/i })).toBeVisible();
    });
  });

  /* ── Logout ─────────────────────────────────────────────────────────── */
  test.describe('Logout', () => {

    test('logout redirects to /login', async ({ page }) => {
      await loginViaAPI(page, USERS.customer.email, USERS.customer.password);
      await page.goto('/restaurants');
      await logout(page);
      expect(page.url()).toContain('/login');
    });

    test('after logout, protected routes redirect to /login', async ({ page }) => {
      await loginViaAPI(page, USERS.customer.email, USERS.customer.password);
      await logout(page);
      await page.goto('/orders');
      // Should redirect away or show login page
      await page.waitForURL('**/login', { timeout: 5_000 });
      expect(page.url()).toContain('/login');
    });
  });
});
