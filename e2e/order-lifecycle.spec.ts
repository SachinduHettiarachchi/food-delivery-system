import { test, expect } from '@playwright/test';
import { loginViaAPI, USERS, registerViaAPI } from './helpers/auth';
import { ensureAdminRestaurant } from './helpers/pages';

/**
 * Tests the full order status lifecycle:
 *   Customer places order → Restaurant admin progresses status → Customer sees updates
 *
 * Runs serially because the tests share a single order.
 */
test.describe.configure({ mode: 'serial' });

let orderId: string;
let restaurantId: string;

test.describe('Order lifecycle', () => {

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/');
    await registerViaAPI(page, USERS.customer);
    await registerViaAPI(page, USERS.restaurantAdmin);
    // Ensure the admin owns a restaurant with menu items so they can see the order.
    restaurantId = await ensureAdminRestaurant(page);
    await ctx.close();
  });

  /* ── Step 1: Customer places an order ──────────────────────────────── */
  test('customer places an order and it appears on My Orders', async ({ page }) => {
    await loginViaAPI(page, USERS.customer.email, USERS.customer.password);

    // Clear cart first
    await page.evaluate(() => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) localStorage.removeItem(`cart_${user.id}`);
    });

    await page.goto(`/restaurants/${restaurantId}`);
    await page.waitForSelector('button:has-text("Add")');
    await page.getByRole('button', { name: /^Add$/i }).first().click();
    await page.waitForTimeout(300);

    await page.goto('/cart');
    const textarea = page.locator('textarea').first();
    await textarea.clear();
    await textarea.fill('10 Test Street, Colombo 1');

    await page.getByRole('button', { name: /place order/i }).click();
    await expect(page.getByText(/order placed successfully/i)).toBeVisible({ timeout: 10_000 });
    await page.waitForURL('**/orders/**', { timeout: 10_000 });

    // Capture the order ID from the URL
    const match = page.url().match(/\/orders\/(\d+)/);
    expect(match).not.toBeNull();
    orderId = match![1];

    // Check order appears on My Orders list
    await page.goto('/orders');
    await expect(page.getByText(`Order #${orderId}`)).toBeVisible({ timeout: 8_000 });
  });

  /* ── Step 2: Order starts as "pending" ─────────────────────────────── */
  test('new order shows "pending" status on customer detail page', async ({ page }) => {
    await loginViaAPI(page, USERS.customer.email, USERS.customer.password);
    await page.goto(`/orders/${orderId}`);
    await expect(page.getByText(/pending/i).first()).toBeVisible({ timeout: 8_000 });
  });

  /* ── Step 3: Restaurant admin confirms the order ────────────────────── */
  test('restaurant admin can see the order and confirm it', async ({ page }) => {
    await loginViaAPI(page, USERS.restaurantAdmin.email, USERS.restaurantAdmin.password);
    await page.goto('/restaurant/orders');

    // Find and expand the order row
    await expect(page.getByText(`#${orderId}`)).toBeVisible({ timeout: 8_000 });
    await page.getByText(`#${orderId}`).first().click();

    // Click "✅ Confirm" — use filter to avoid matching the "0 Confirmed" counter chip
    await page.locator('button').filter({ hasText: /✅ Confirm/ }).click();
    await expect(page.getByText(/confirmed/i).first()).toBeVisible({ timeout: 6_000 });
  });

  /* ── Step 4: Status progresses to "preparing" ──────────────────────── */
  test('restaurant admin marks order as preparing', async ({ page }) => {
    await loginViaAPI(page, USERS.restaurantAdmin.email, USERS.restaurantAdmin.password);
    await page.goto('/restaurant/orders');

    await expect(page.getByText(`#${orderId}`)).toBeVisible({ timeout: 8_000 });
    await page.getByText(`#${orderId}`).first().click();

    // Use filter to avoid matching the "0 Preparing" counter chip button
    await page.locator('button').filter({ hasText: /👨‍🍳 Preparing/ }).click();
    await expect(page.getByText(/preparing/i).first()).toBeVisible({ timeout: 6_000 });
  });

  /* ── Step 5: Mark out for delivery ─────────────────────────────────── */
  test('restaurant admin marks order as out for delivery', async ({ page }) => {
    await loginViaAPI(page, USERS.restaurantAdmin.email, USERS.restaurantAdmin.password);
    await page.goto('/restaurant/orders');

    await expect(page.getByText(`#${orderId}`)).toBeVisible({ timeout: 8_000 });
    await page.getByText(`#${orderId}`).first().click();

    await page.getByRole('button', { name: /out for delivery/i }).click();
    await expect(page.getByText(/updated to/i)).toBeVisible({ timeout: 6_000 });
  });

  /* ── Step 6: Mark delivered ─────────────────────────────────────────── */
  test('restaurant admin marks order as delivered', async ({ page }) => {
    await loginViaAPI(page, USERS.restaurantAdmin.email, USERS.restaurantAdmin.password);
    await page.goto('/restaurant/orders');

    await expect(page.getByText(`#${orderId}`)).toBeVisible({ timeout: 8_000 });
    await page.getByText(`#${orderId}`).first().click();

    await page.getByRole('button', { name: /delivered/i }).click();
    await expect(page.getByText(/updated to/i)).toBeVisible({ timeout: 6_000 });
  });

  /* ── Step 7: Customer sees delivered status ─────────────────────────── */
  test('customer sees delivered status and "Rate your order" prompt', async ({ page }) => {
    await loginViaAPI(page, USERS.customer.email, USERS.customer.password);
    await page.goto('/orders');
    // Delivered order shows "Rate your order" badge
    await expect(page.getByText(/rate your order/i).first()).toBeVisible({ timeout: 8_000 });
  });
});
