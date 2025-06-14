import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display homepage correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('SaaS Barber');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h2')).toContainText('Entre na sua conta');
  });

  test('should protect dashboard route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
}); 