import { test, expect } from '@playwright/test';
import { loginViaAPI, USERS, registerViaAPI } from './helpers/auth';
import { ensureAdminRestaurant } from './helpers/pages';

/**
 * Restaurant admin — menu management tests.
 *
 * Assumes:
 *   - USERS.restaurantAdmin account exists (or will be created)
 *   - That admin has at least one restaurant set up in the DB
 *     (create one via /restaurant/setup or the admin panel beforehand)
 */
test.describe('Restaurant Admin — Menu Management', () => {

  const ITEM_NAME = `E2E Item ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/');
    await registerViaAPI(page, USERS.restaurantAdmin);
    // Ensure the admin has a restaurant and at least one menu item set up.
    await ensureAdminRestaurant(page);
    await ctx.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, USERS.restaurantAdmin.email, USERS.restaurantAdmin.password);
  });

  /* ── Dashboard ──────────────────────────────────────────────────────── */
  test('restaurant dashboard loads', async ({ page }) => {
    await page.goto('/restaurant/dashboard');
    // Should show some dashboard content (heading or stats)
    await expect(
      page.getByRole('heading').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  /* ── Menu management ────────────────────────────────────────────────── */
  test('menu management page loads with Add Item button', async ({ page }) => {
    await page.goto('/restaurant/menu');
    // Use .first() — during the brief period while menu items load, both the header
    // "Add Item" button and the empty-state one may coexist in the DOM.
    await expect(page.getByRole('button', { name: /add item/i }).first()).toBeVisible({ timeout: 8_000 });
  });

  test('can add a new menu item', async ({ page }) => {
    await page.goto('/restaurant/menu');
    // Click the header "Add Item" button (first match — see note above)
    await page.getByRole('button', { name: /add item/i }).first().click();

    // Form should appear
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 5_000 });

    // Fill form
    await page.locator('input[name="name"]').fill(ITEM_NAME);
    await page.locator('input[name="price"]').fill('450');
    await page.locator('input[name="category"]').fill('Mains');
    await page.locator('input[name="preparation_time"]').fill('20');

    // Submit — scope to the modal form to avoid matching the header "Add Item" button
    await page.locator('form').getByRole('button', { name: /add item|save|create/i }).click();

    // Item should appear in the list
    await expect(page.getByText(ITEM_NAME)).toBeVisible({ timeout: 8_000 });
  });

  test('new item is shown as "Available" by default', async ({ page }) => {
    await page.goto('/restaurant/menu');
    await expect(page.getByText(ITEM_NAME)).toBeVisible({ timeout: 8_000 });

    // The card containing our item should show the "Available" toggle button
    const itemCard = page.locator('.card').filter({ hasText: ITEM_NAME }).first();
    await expect(itemCard.getByRole('button', { name: 'Available' })).toBeVisible();
  });

  test('can toggle item availability to Hidden', async ({ page }) => {
    await page.goto('/restaurant/menu');
    await page.waitForSelector(`text=${ITEM_NAME}`);

    // Click the "Available" toggle button on our item's card
    // Use getByRole to distinguish the button from the "Hidden" overlay span
    const itemCard = page.locator('.card').filter({ hasText: ITEM_NAME }).first();
    await itemCard.getByRole('button', { name: 'Available' }).click();

    await expect(itemCard.getByRole('button', { name: 'Hidden' })).toBeVisible({ timeout: 5_000 });
  });

  test('can toggle item back to Available', async ({ page }) => {
    await page.goto('/restaurant/menu');
    await page.waitForSelector(`text=${ITEM_NAME}`);

    const itemCard = page.locator('.card').filter({ hasText: ITEM_NAME }).first();
    // May be "Hidden" from previous test — use button role to avoid matching the image overlay span
    const hiddenBtn = itemCard.getByRole('button', { name: 'Hidden' });
    if (await hiddenBtn.isVisible()) {
      await hiddenBtn.click();
      await expect(itemCard.getByRole('button', { name: 'Available' })).toBeVisible({ timeout: 5_000 });
    }
  });

  test('can edit a menu item', async ({ page }) => {
    await page.goto('/restaurant/menu');
    await page.waitForSelector(`text=${ITEM_NAME}`);

    const itemCard = page.locator('.card').filter({ hasText: ITEM_NAME }).first();
    // Click the pencil/edit button (Pencil icon inside the card)
    await itemCard.locator('button').filter({ has: page.locator('.lucide-pencil') }).click();

    // Edit form appears — change the price
    const priceInput = page.locator('input[name="price"]');
    await expect(priceInput).toBeVisible({ timeout: 5_000 });
    await priceInput.clear();
    await priceInput.fill('500');
    // Scope to the modal form to avoid matching the header "Add Item" button
    await page.locator('form').getByRole('button', { name: /save|update/i }).click();

    await expect(page.getByText('Item updated.')).toBeVisible({ timeout: 5_000 });
  });

  test('can delete a menu item', async ({ page }) => {
    await page.goto('/restaurant/menu');
    await page.waitForSelector(`text=${ITEM_NAME}`);

    const itemCard = page.locator('.card').filter({ hasText: ITEM_NAME }).first();
    // Register dialog handler BEFORE the click that triggers window.confirm
    page.once('dialog', (dialog) => dialog.accept());
    await itemCard.locator('button').filter({ has: page.locator('.lucide-trash-2') }).click();

    // Soft-delete shows toast and marks item as Hidden (still in DOM)
    await expect(page.getByText('Item removed.')).toBeVisible({ timeout: 8_000 });
  });

  /* ── Restaurant orders ──────────────────────────────────────────────── */
  test('restaurant orders page loads', async ({ page }) => {
    await page.goto('/restaurant/orders');
    await expect(page.getByRole('heading', { name: /orders/i })).toBeVisible({ timeout: 8_000 });
  });

  test('orders page shows status filter chips', async ({ page }) => {
    await page.goto('/restaurant/orders');
    // Both the counter chip and the filter <option> contain "Pending"/"Confirmed";
    // use .first() to avoid strict-mode violation.
    await expect(page.getByText('Pending').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Confirmed').first()).toBeVisible();
  });
});
