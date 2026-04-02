import { Page } from '@playwright/test';

/* ── Shared test credentials ────────────────────────────────────────── */
export const USERS = {
  customer: {
    name: 'E2E Customer',
    email: 'e2e.customer@hungryhub.test',
    password: 'E2eTest1!',
    role: 'customer' as const,
  },
  customer2: {
    name: 'E2E Customer Two',
    email: 'e2e.customer2@hungryhub.test',
    password: 'E2eTest1!',
    role: 'customer' as const,
  },
  restaurantAdmin: {
    name: 'E2E Restaurant Owner',
    email: 'e2e.restaurant@hungryhub.test',
    password: 'E2eTest1!',
    role: 'restaurant_admin' as const,
  },
  // system_admin cannot be self-registered via the API; use the seeded demo account.
  systemAdmin: {
    name: 'System Admin',
    email: 'admin@demo.com',
    password: 'password123',
    role: 'system_admin' as const,
  },
};

/**
 * Register a user via API. Ignores 409 (already exists).
 * Returns true if newly created, false if already existed.
 */
export async function registerViaAPI(
  page: Page,
  user: { name: string; email: string; password: string; role: string }
): Promise<boolean> {
  const res = await page.request.post('/api/auth/register', {
    data: {
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
    },
  });
  return res.status() === 201;
}

/**
 * Log in via API and inject the token directly into localStorage.
 * Much faster than filling the login form (no page render needed).
 * Call after navigating to any page so localStorage is available.
 */
export async function loginViaAPI(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Ensure we have a page context for localStorage
  if (page.url() === 'about:blank') {
    await page.goto('/');
  }

  const res = await page.request.post('/api/auth/login', {
    data: { email, password },
  });
  const json = await res.json();
  const { user, token } = json.data;

  await page.evaluate(
    ({ u, t }) => {
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify(u));
    },
    { u: user, t: token }
  );

  // Reload so React picks up the stored token
  await page.reload();
}

/**
 * Log in by filling the login form (UI path).
 */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

/**
 * Click the desktop nav logout button (icon-only, hover:text-red-400).
 */
export async function logout(page: Page): Promise<void> {
  await page.locator('nav button[class*="hover:text-red-400"]').click();
  await page.waitForURL('**/login');
}

/**
 * Clear localStorage and reload (fast hard logout for test setup).
 */
export async function clearSession(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
}
