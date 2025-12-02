
import { test, expect } from '@playwright/test';

test.describe('Bed Manager Forensic Audit', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('medflow_force_local', 'true');
        });
        await page.goto('http://localhost:3000/login');
        await page.fill('[data-testid="login-email-input"]', 'doctor@medflow.ai');
        await page.fill('[data-testid="login-password-input"]', 'password123');
        await page.click('[data-testid="login-submit-button"]');
        await expect(page.getByTestId('dashboard-title')).toBeVisible();
        await page.goto('http://localhost:3000/bed-manager');
    });

    test('capture bed manager screenshots', async ({ page }) => {
        // 1. Ward Overview
        await expect(page.getByText('Bed Manager')).toBeVisible();
        await page.waitForTimeout(1000); // Wait for animations
        await page.screenshot({ path: 'screenshots/bedmanager/1_ward_overview.png', fullPage: true });

        // 2. Room Grid (General Medicine 1)
        await page.getByText('General Medicine 1').click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/bedmanager/2_room_grid.png', fullPage: true });

        // 3. Bed Detail (Vacant)
        await page.locator('.cursor-pointer').filter({ hasText: 'A' }).first().click();
        await expect(page.getByText('Manage bed status')).toBeVisible();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/bedmanager/3_bed_detail_vacant.png' });

        // Close sheet
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        // 4. Cleaning Queue
        await page.getByText('Cleaning Queue').click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/bedmanager/4_cleaning_queue.png' });

        // 5. AI Drawer (Empty state if no patient)
        await page.getByRole('button', { name: 'AI Bed Assignment' }).click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/bedmanager/5_ai_drawer.png' });
    });
});
