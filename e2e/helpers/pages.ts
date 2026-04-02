import { Page, expect } from '@playwright/test';
import { USERS } from './auth';

/**
 * Navigate to a restaurant detail page.
 */
export async function goToRestaurant(page: Page, restaurantId: number | string): Promise<void> {
  await page.goto(`/restaurants/${restaurantId}`);
}

/**
 * Click the first visible "+ Add" button on the restaurant detail page.
 * Returns the name of the item that was added (taken from the preceding heading).
 */
export async function addFirstItemToCart(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^\+ Add$/i }).first().click();
}

/**
 * Fill in delivery address and click Place Order on the cart page.
 */
export async function placeOrder(
  page: Page,
  address = '45 Galle Road, Colombo 3'
): Promise<void> {
  await page.goto('/cart');
  const textarea = page.locator('textarea').first();
  await textarea.clear();
  await textarea.fill(address);
  await page.getByRole('button', { name: /place order/i }).click();
}

/**
 * Wait for a React Hot Toast notification containing the given text.
 */
export async function waitForToast(page: Page, text: string | RegExp): Promise<void> {
  await expect(page.getByText(text)).toBeVisible({ timeout: 6_000 });
}

/**
 * Get the first restaurant ID from the restaurants list page by reading the href.
 */
export async function getFirstRestaurantId(page: Page): Promise<string> {
  await page.goto('/restaurants');
  await page.waitForSelector('a[href^="/restaurants/"]');
  const href = await page.locator('a[href^="/restaurants/"]').first().getAttribute('href');
  const match = href?.match(/\/restaurants\/(\d+)/);
  if (!match) throw new Error('No restaurant found on /restaurants');
  return match[1];
}

/**
 * Expand an order row in the restaurant orders panel (click on row to toggle).
 */
export async function expandOrder(page: Page, orderId: number | string): Promise<void> {
  await page.locator(`text=#${orderId}`).first().click();
}

/**
 * Ensure the E2E restaurant admin has at least one restaurant with one available
 * menu item.  Creates them via the API if they don't exist yet.
 * Returns the restaurant ID (string).
 */
export async function ensureAdminRestaurant(page: Page): Promise<string> {
  // Log in as the restaurant admin to obtain a token.
  const loginRes = await page.request.post('/api/auth/login', {
    data: { email: USERS.restaurantAdmin.email, password: USERS.restaurantAdmin.password },
  });
  const loginJson = await loginRes.json();
  const token: string = loginJson.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  // Find existing restaurant or create one.
  const myRes = await page.request.get('/api/restaurants/my/restaurants', { headers });
  const myJson = await myRes.json();

  let rid: string;
  if (myJson.data && myJson.data.length > 0) {
    rid = String(myJson.data[0].id);
  } else {
    const createRes = await page.request.post('/api/restaurants', {
      headers,
      data: {
        name: 'E2E Test Restaurant',
        address: '1 Test Street, Colombo 1',
        phone: '0771234567',
        cuisine_type: 'Various',
        opening_time: '08:00:00',
        closing_time: '22:00:00',
      },
    });
    const createJson = await createRes.json();
    rid = String(createJson.data.id);
  }

  // Ensure the restaurant has at least one available menu item.
  const menuRes = await page.request.get(`/api/restaurants/${rid}/menu/manage`, { headers });
  const menuJson = await menuRes.json();
  const hasItem = menuJson.data?.some((i: any) => i.is_available !== false);
  if (!hasItem) {
    await page.request.post(`/api/restaurants/${rid}/menu`, {
      headers,
      data: { name: 'E2E Test Item', price: 500, category: 'Mains', preparation_time: 15 },
    });
  }

  return rid;
}
