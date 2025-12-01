import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('should allow a user to login with valid credentials', async ({ page }) => {
        await page.fill('[data-testid="login-email-input"]', 'doctor@medflow.ai');
        await page.fill('[data-testid="login-password-input"]', 'password123');
        await page.click('[data-testid="login-submit-button"]');

        await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 10000 });
    });

    test('should handle invalid credentials', async ({ page }) => {
        await page.fill('[data-testid="login-email-input"]', 'doctor@medflow.ai');
        await page.fill('[data-testid="login-password-input"]', 'wrongpassword');
        await page.click('[data-testid="login-submit-button"]');

        // Verify that we are NOT redirected to dashboard
        await expect(page.getByTestId('dashboard-title')).toBeHidden();

        // Verify that the submit button returns to "Sign in" state (from "Processing...")
        await expect(page.getByTestId('login-submit-button')).toHaveText('Sign in');
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible();
    });

    test('should allow logout', async ({ page }) => {
        // First login
        await page.fill('[data-testid="login-email-input"]', 'doctor@medflow.ai');
        await page.fill('[data-testid="login-password-input"]', 'password123');
        await page.click('[data-testid="login-submit-button"]');
        await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 10000 });

        // Click user menu icon
        await page.locator('header button.rounded-full').click();

        // Wait for dropdown
        await expect(page.getByText('Sign out')).toBeVisible();

        await page.click('text=Sign out');

        await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible();
    });
});
