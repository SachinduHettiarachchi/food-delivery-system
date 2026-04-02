import { test, expect } from '@playwright/test';
import { loginViaAPI, USERS, registerViaAPI } from './helpers/auth';
import { getFirstRestaurantId } from './helpers/pages';

test.describe('Cart & Order placement', () => {

  let restaurantId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/');
    await registerViaAPI(page, USERS.customer);
    await loginViaAPI(page, USERS.customer.email, USERS.customer.password);
    restaurantId = await getFirstRestaurantId(page);
    await ctx.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, USERS.customer.email, USERS.customer.password);
    // Clear saved cart for this user
    await page.evaluate(() => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) localStorage.removeItem(`cart_${user.id}`);
    });
  });

  /* ── Helper: add first available item on restaurant page ──────────── */
  async function addItemAndWait(page: Parameters<typeof test>[1], rid: string) {
    await page.goto(`/restaurants/${rid}`);
    await page.waitForSelector('button:has-text("Add")');
    // Find and click first "Add" button (shows when cartQty === 0)
    await page.getByRole('button', { name: /^Add$/i }).first().click();
    await expect(page.getByText(/added!/i)).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(300); // let cart localStorage write settle
  }

  /* ── Adding items ───────────────────────────────────────────────────── */
  test('adding an item shows toast and updates cart badge', async ({ page }) => {
    await addItemAndWait(page, restaurantId);
    // Cart badge shows 1 — both desktop and mobile badges exist in DOM; use first()
    await expect(page.locator('nav').getByText('1').first()).toBeVisible();
  });

  test('adding same item again increments quantity via qty control', async ({ page }) => {
    await addItemAndWait(page, restaurantId);
    // After first add, "Add" button turns into qty control with a small + button
    // This + button is inside the menu item card (bg-primary-500 circle button)
    const qtyPlusBtn = page.locator('.bg-primary-500').filter({ has: page.locator('svg') }).first();
    await qtyPlusBtn.click();
    // Cart badge now shows 2
    await expect(page.locator('nav').getByText('2').first()).toBeVisible({ timeout: 5_000 });
  });

  /* ── Cart page ──────────────────────────────────────────────────────── */
  test('cart page shows added items', async ({ page }) => {
    await addItemAndWait(page, restaurantId);
    await page.goto('/cart');
    // h1 is only rendered when cart has items
    await expect(page.locator('h1').filter({ hasText: 'Your Cart' })).toBeVisible({ timeout: 6_000 });
    // Item rows contain price text with "LKR"
    await expect(page.getByText(/LKR/i).first()).toBeVisible({ timeout: 6_000 });
  });

  test('increase / decrease quantity controls work on cart page', async ({ page }) => {
    await addItemAndWait(page, restaurantId);
    await page.goto('/cart');
    await expect(page.locator('h1').filter({ hasText: 'Your Cart' })).toBeVisible({ timeout: 6_000 });

    // Quantity should start at 1 — the + button adds 1
    // CartItem renders: <Minus> button, qty span, <Plus> button
    // The + button has bg-primary-500/15 class and contains a Plus SVG
    const plusBtns = page.locator('button[class*="bg-primary-500"]');
    await expect(plusBtns.first()).toBeVisible({ timeout: 5_000 });
    await plusBtns.first().click();
    // Check quantity jumped to 2
    await expect(page.getByText('2', { exact: true }).first()).toBeVisible({ timeout: 5_000 });

    // Decrease back to 1 — scope to the cart item row to avoid matching hidden mobile nav buttons
    // CartItem row has .flex.items-center.gap-3.py-4; minus is the first button inside it
    const minusBtn = page.locator('.flex.items-center.gap-3.py-4').first().locator('button').first();
    await minusBtn.click();
    await expect(page.getByText('1', { exact: true }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('"Clear all" empties the cart', async ({ page }) => {
    await addItemAndWait(page, restaurantId);
    await page.goto('/cart');
    await expect(page.locator('h1').filter({ hasText: 'Your Cart' })).toBeVisible({ timeout: 6_000 });
    await page.getByText('Clear all').click();
    await expect(page.getByText('Your cart is empty')).toBeVisible({ timeout: 5_000 });
  });

  /* ── Restaurant-switch modal ────────────────────────────────────────── */
  test('adding item from different restaurant shows switch modal', async ({ page }) => {
    await page.goto('/restaurants');
    await page.waitForSelector('a[href^="/restaurants/"]');
    const links = await page.locator('a[href^="/restaurants/"]').all();
    if (links.length < 2) { test.skip(); return; }

    const href1 = await links[0].getAttribute('href');
    const href2 = await links[1].getAttribute('href');
    if (!href1 || !href2 || href1 === href2) { test.skip(); return; }

    // Add from restaurant 1
    await page.goto(href1);
    await page.waitForSelector('button:has-text("Add")');
    await page.getByRole('button', { name: /^Add$/i }).first().click();
    await expect(page.getByText(/added!/i)).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(300);

    // Try to add from restaurant 2
    await page.goto(href2);
    await page.waitForSelector('button:has-text("Add")');
    await page.getByRole('button', { name: /^Add$/i }).first().click();

    // Switch modal should appear
    await expect(page.getByRole('button', { name: /keep current/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /start new cart/i })).toBeVisible();
  });

  test('"Keep current" dismisses modal and leaves cart count unchanged', async ({ page }) => {
    await page.goto('/restaurants');
    await page.waitForSelector('a[href^="/restaurants/"]');
    const links = await page.locator('a[href^="/restaurants/"]').all();
    if (links.length < 2) { test.skip(); return; }

    const href1 = await links[0].getAttribute('href');
    const href2 = await links[1].getAttribute('href');
    if (!href1 || !href2 || href1 === href2) { test.skip(); return; }

    await page.goto(href1);
    await page.waitForSelector('button:has-text("Add")');
    await page.getByRole('button', { name: /^Add$/i }).first().click();
    await expect(page.getByText(/added!/i)).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(300);

    await page.goto(href2);
    await page.waitForSelector('button:has-text("Add")');
    await page.getByRole('button', { name: /^Add$/i }).first().click();

    await page.getByRole('button', { name: /keep current/i }).click();
    // Modal dismissed
    await expect(page.getByRole('button', { name: /keep current/i })).not.toBeVisible({ timeout: 5_000 });
    // Cart badge still shows 1
    await expect(page.locator('nav').getByText('1').first()).toBeVisible();
  });

  test('"Start new cart" replaces cart with item from new restaurant', async ({ page }) => {
    await page.goto('/restaurants');
    await page.waitForSelector('a[href^="/restaurants/"]');
    const links = await page.locator('a[href^="/restaurants/"]').all();
    if (links.length < 2) { test.skip(); return; }

    const href1 = await links[0].getAttribute('href');
    const href2 = await links[1].getAttribute('href');
    if (!href1 || !href2 || href1 === href2) { test.skip(); return; }

    await page.goto(href1);
    await page.waitForSelector('button:has-text("Add")');
    await page.getByRole('button', { name: /^Add$/i }).first().click();
    await expect(page.getByText(/added!/i)).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(300);

    await page.goto(href2);
    await page.waitForSelector('button:has-text("Add")');
    await page.getByRole('button', { name: /^Add$/i }).first().click();

    await page.getByRole('button', { name: /start new cart/i }).click();
    // Cart resets to 1 item (from new restaurant)
    await expect(page.locator('nav').getByText('1').first()).toBeVisible({ timeout: 5_000 });
  });

  /* ── Cart persistence ───────────────────────────────────────────────── */
  test('cart persists after logout and re-login', async ({ page }) => {
    await addItemAndWait(page, restaurantId);
    await page.waitForTimeout(500); // ensure localStorage write completes

    // Log out via nav button
    await page.locator('nav button[class*="hover:text-red-400"]').click();
    await page.waitForURL('**/login');

    // Log back in via API
    await loginViaAPI(page, USERS.customer.email, USERS.customer.password);
    await page.goto('/restaurants');

    // Cart badge should show 1 (restored from localStorage)
    await expect(page.locator('nav').getByText('1').first()).toBeVisible({ timeout: 6_000 });
  });

  /* ── Order placement ────────────────────────────────────────────────── */
  test('placing an order navigates to order detail', async ({ page }) => {
    await addItemAndWait(page, restaurantId);
    await page.goto('/cart');
    await expect(page.locator('h1').filter({ hasText: 'Your Cart' })).toBeVisible({ timeout: 6_000 });

    // Fill delivery address
    const textarea = page.locator('textarea').first();
    await textarea.click();
    await textarea.fill('45 Galle Road, Colombo 3');

    await page.getByRole('button', { name: /place order/i }).click();

    await expect(page.getByText(/order placed successfully/i)).toBeVisible({ timeout: 10_000 });
    await page.waitForURL('**/orders/**', { timeout: 10_000 });
    expect(page.url()).toMatch(/\/orders\/\d+/);
  });

  test('placing order without delivery address shows error', async ({ page }) => {
    await addItemAndWait(page, restaurantId);
    await page.goto('/cart');
    await expect(page.locator('h1').filter({ hasText: 'Your Cart' })).toBeVisible({ timeout: 6_000 });

    // Clear address (it may be pre-filled from user profile)
    const textarea = page.locator('textarea').first();
    await textarea.click();
    await textarea.fill('');

    await page.getByRole('button', { name: /place order/i }).click();
    // Toast error is "Please enter a delivery address." — more specific than the label
    await expect(page.getByText('Please enter a delivery address.')).toBeVisible({ timeout: 5_000 });
    expect(page.url()).toContain('/cart');
  });

  test('empty cart shows "Your cart is empty" state', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await expect(page.getByRole('button', { name: /browse restaurants/i })).toBeVisible();
  });
});
