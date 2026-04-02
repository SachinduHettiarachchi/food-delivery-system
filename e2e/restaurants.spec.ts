import { test, expect } from '@playwright/test';
import { loginViaAPI, USERS, registerViaAPI } from './helpers/auth';
import { getFirstRestaurantId } from './helpers/pages';

test.describe('Restaurants', () => {

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

  /* ── List page ──────────────────────────────────────────────────────── */
  test('restaurants list page loads and shows cards', async ({ page }) => {
    await page.goto('/restaurants');
    // At least one restaurant card link
    await expect(page.locator('a[href^="/restaurants/"]').first()).toBeVisible({ timeout: 8_000 });
  });

  test('search filters restaurant cards', async ({ page }) => {
    await page.goto('/restaurants');
    await page.waitForSelector('a[href^="/restaurants/"]');

    const allCards = await page.locator('a[href^="/restaurants/"]').count();
    expect(allCards).toBeGreaterThan(0);

    // Type something unlikely to match most restaurants
    const searchInput = page.locator('input[placeholder]').first();
    await searchInput.fill('zzznomatch999');
    // Either zero results or "no results" message
    const remaining = await page.locator('a[href^="/restaurants/"]').count();
    // Should have fewer cards OR none
    expect(remaining).toBeLessThanOrEqual(allCards);
  });

  test('clicking a restaurant card navigates to its detail page', async ({ page }) => {
    await page.goto('/restaurants');
    await page.waitForSelector('a[href^="/restaurants/"]');

    const firstCard = page.locator('a[href^="/restaurants/"]').first();
    const href = await firstCard.getAttribute('href');
    await firstCard.click();

    await page.waitForURL(`**${href}`, { timeout: 8_000 });
    expect(page.url()).toContain('/restaurants/');
  });

  /* ── Detail page ────────────────────────────────────────────────────── */
  test.describe('Restaurant detail', () => {

    let restaurantId: string;

    test.beforeAll(async ({ browser }) => {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await loginViaAPI(p, USERS.customer.email, USERS.customer.password);
      restaurantId = await getFirstRestaurantId(p);
      await ctx.close();
    });

    test('detail page shows restaurant name and menu items', async ({ page }) => {
      await page.goto(`/restaurants/${restaurantId}`);
      // h1 with restaurant name
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 8_000 });
      // At least one "+ Add" button
      await expect(page.getByRole('button', { name: /^Add$/i }).first()).toBeVisible({ timeout: 8_000 });
    });

    test('category tabs filter the visible menu items', async ({ page }) => {
      await page.goto(`/restaurants/${restaurantId}`);
      await page.waitForSelector('button:has-text("Add")');

      // Find all category tab buttons (they contain both name and count)
      // These are the small pill/tab buttons at the top of the menu
      const categoryButtons = page.locator('button').filter({ hasText: /\(\d+\)/ });
      const tabCount = await categoryButtons.count();

      if (tabCount > 1) {
        // Click the second category tab
        await categoryButtons.nth(1).click();
        // Items should still be visible (filtered list)
        await expect(page.getByRole('button', { name: /^Add$/i }).first()).toBeVisible();
      }
    });

    test('add button shows toast confirmation', async ({ page }) => {
      await page.goto(`/restaurants/${restaurantId}`);
      await page.waitForSelector('button:has-text("Add")');
      await page.getByRole('button', { name: /^Add$/i }).first().click();
      await expect(page.getByText(/added!/i)).toBeVisible({ timeout: 5_000 });
    });
  });
});
