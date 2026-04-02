import { test, expect } from '@playwright/test';
import { loginViaAPI, USERS } from './helpers/auth';

/**
 * System admin panel tests.
 *
 * The system_admin account must be seeded in the DB manually or via
 * the backend seed script (role cannot be self-assigned via registration).
 */
test.describe('System Admin Panel', () => {

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, USERS.systemAdmin.email, USERS.systemAdmin.password);
  });

  /* ── Dashboard ──────────────────────────────────────────────────────── */
  test('admin dashboard page loads with stat cards', async ({ page }) => {
    await page.goto('/admin/dashboard');
    // StatCards: Users, Restaurants, Orders
    await expect(page.getByText(/dashboard/i).first()).toBeVisible({ timeout: 8_000 });
    // At least one numeric stat is visible
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 5_000 });
  });

  test('nav shows admin-specific links', async ({ page }) => {
    await page.goto('/admin/dashboard');
    // Use .first() — the dashboard content area also has "Manage Users" / "Manage Restaurants" /
    // "All Orders" links that match the same patterns as the nav links.
    await expect(page.getByRole('link', { name: /users/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /restaurants/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /orders/i }).first()).toBeVisible();
  });

  /* ── Users ──────────────────────────────────────────────────────────── */
  test('admin users page loads and shows user list', async ({ page }) => {
    await page.goto('/admin/users');
    // Heading is "User Management" — use /user/i (no 's') to match it
    await expect(page.getByRole('heading', { name: /user/i })).toBeVisible({ timeout: 8_000 });
    // At least one user row (the admin themselves)
    await expect(page.locator('table tbody tr, [class*="user-row"]').first()).toBeVisible({ timeout: 8_000 });
  });

  /* ── Restaurants ────────────────────────────────────────────────────── */
  test('admin restaurants page loads', async ({ page }) => {
    await page.goto('/admin/restaurants');
    await expect(page.getByRole('heading', { name: /restaurant/i })).toBeVisible({ timeout: 8_000 });
  });

  /* ── Orders ─────────────────────────────────────────────────────────── */
  test('admin orders page loads', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page.getByRole('heading', { name: /order/i })).toBeVisible({ timeout: 8_000 });
  });

  /* ── Access control ─────────────────────────────────────────────────── */
  test('non-admin cannot access admin dashboard', async ({ page }) => {
    // Log out first
    await page.evaluate(() => localStorage.clear());
    // Log in as customer
    await loginViaAPI(page, USERS.customer.email, USERS.customer.password);
    await page.goto('/admin/dashboard');
    // Should redirect away or show access denied
    await page.waitForTimeout(2_000);
    expect(page.url()).not.toContain('/admin/dashboard');
  });
});
