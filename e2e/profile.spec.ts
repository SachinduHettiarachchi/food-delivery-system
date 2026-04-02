import { test, expect } from '@playwright/test';
import { loginViaAPI, USERS, registerViaAPI } from './helpers/auth';

test.describe('Profile', () => {

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/');
    await registerViaAPI(page, USERS.customer);
    await ctx.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, USERS.customer.email, USERS.customer.password);
  });

  /* ── Profile page loads ─────────────────────────────────────────────── */
  test('profile page loads with Edit Profile and Change Password tabs', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('button', { name: /edit profile/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: /change password/i })).toBeVisible();
  });

  /* ── Edit Profile tab ───────────────────────────────────────────────── */
  test('Edit Profile tab shows name, phone, and address fields', async ({ page }) => {
    await page.goto('/profile');
    // "Edit Profile" is the default active tab
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('textarea[name="address"]')).toBeVisible();
  });

  test('can update display name and sees success toast', async ({ page }) => {
    await page.goto('/profile');
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });

    await nameInput.clear();
    await nameInput.fill('Updated E2E Customer');

    await page.getByRole('button', { name: /save|update profile/i }).click();
    await expect(page.getByText(/profile updated/i)).toBeVisible({ timeout: 6_000 });
  });

  test('can update phone number', async ({ page }) => {
    await page.goto('/profile');
    const phoneInput = page.locator('input[name="phone"]');
    await expect(phoneInput).toBeVisible({ timeout: 5_000 });

    await phoneInput.clear();
    await phoneInput.fill('+94 77 999 0000');

    await page.getByRole('button', { name: /save|update profile/i }).click();
    await expect(page.getByText(/profile updated/i)).toBeVisible({ timeout: 6_000 });
  });

  test('can update delivery address', async ({ page }) => {
    await page.goto('/profile');
    const addressInput = page.locator('textarea[name="address"]');
    await expect(addressInput).toBeVisible({ timeout: 5_000 });

    await addressInput.clear();
    await addressInput.fill('42 Test Avenue, Colombo 5');

    await page.getByRole('button', { name: /save|update profile/i }).click();
    await expect(page.getByText(/profile updated/i)).toBeVisible({ timeout: 6_000 });
  });

  /* ── Change Password tab ────────────────────────────────────────────── */
  test('Change Password tab shows password fields', async ({ page }) => {
    await page.goto('/profile');
    await page.getByRole('button', { name: /change password/i }).click();

    await expect(page.locator('input[name="currentPassword"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('input[name="newPassword"]')).toBeVisible();
  });

  test('wrong current password shows error', async ({ page }) => {
    await page.goto('/profile');
    await page.getByRole('button', { name: /change password/i }).click();

    const currentPassInput = page.locator('input[name="currentPassword"]');
    const newPassInput = page.locator('input[name="newPassword"]');
    const confirmPassInput = page.locator('input[name="confirmPassword"]');

    await currentPassInput.fill('WrongOldPassword1!');
    await newPassInput.fill('NewPassword1!');
    if (await confirmPassInput.isVisible()) {
      await confirmPassInput.fill('NewPassword1!');
    }

    // Use form-scoped locator to avoid matching the "Change Password" tab button
    await page.locator('form').getByRole('button', { name: /change|update password/i }).click();
    await expect(page.getByText(/incorrect|wrong|invalid|current password/i)).toBeVisible({ timeout: 6_000 });
  });

  test('successful password change shows success toast', async ({ page }) => {
    await page.goto('/profile');
    await page.getByRole('button', { name: /change password/i }).click();

    const currentPassInput = page.locator('input[name="currentPassword"]');
    const newPassInput = page.locator('input[name="newPassword"]');
    const confirmPassInput = page.locator('input[name="confirmPassword"]');

    await currentPassInput.fill(USERS.customer.password);
    await newPassInput.fill(USERS.customer.password); // Change to same — keeps test idempotent
    if (await confirmPassInput.isVisible()) {
      await confirmPassInput.fill(USERS.customer.password);
    }

    // Use form-scoped locator to avoid matching the "Change Password" tab button
    await page.locator('form').getByRole('button', { name: /change|update password/i }).click();
    await expect(page.getByText(/password changed|updated|success/i)).toBeVisible({ timeout: 6_000 });
  });
});
