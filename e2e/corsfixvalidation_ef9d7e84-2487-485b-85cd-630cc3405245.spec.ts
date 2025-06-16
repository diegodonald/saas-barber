
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('CorsFixValidation_2025-06-16', async ({ page, context }) => {
  
    // Navigate to URL
    await page.goto('http://localhost:3000');

    // Take screenshot
    await page.screenshot({ path: 'homepage-cors-fix-test.png' });

    // Click element
    await page.click('a[href="/register"]');

    // Take screenshot
    await page.screenshot({ path: 'register-page-cors-fix-test.png' });

    // Fill input field
    await page.fill('input[name="name"]', 'Teste CORS Fix');

    // Fill input field
    await page.fill('input[name="email"]', 'teste-cors@saasbarber.com');

    // Fill input field
    await page.fill('input[name="password"]', '123456789');

    // Fill input field
    await page.fill('input[name="confirmPassword"]', '123456789');

    // Click element
    await page.click('button[type="submit"]');

    // Take screenshot
    await page.screenshot({ path: 'after-register-submit-cors-fix.png' });
});