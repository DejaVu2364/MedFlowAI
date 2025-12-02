
import { test, expect } from '@playwright/test';

test('Forensic Screenshots', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="login-email-input"]', 'doctor@medflow.ai');
    await page.fill('[data-testid="login-password-input"]', 'password123');
    await page.click('[data-testid="login-submit-button"]');
    await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 10000 });

    const patientCard = page.locator('[data-testid^="patient-card-"]').first();
    await expect(patientCard).toBeVisible({ timeout: 20000 });
    await patientCard.click();

    await page.click('text=Clinical File');

    // Wait for content
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'artifacts/clinical_full.png', fullPage: true });

    // Expand a section
    await page.click('button:has-text("Edit Section") >> nth=0');
    await page.waitForSelector('textarea');
    await page.screenshot({ path: 'artifacts/clinical_edit_mode.png' });

    await page.locator('textarea').fill('Forensic Test Content ' + Date.now());
    await page.click('text=Save Changes');
    await page.waitForTimeout(1000); // Wait for toast/save
    await page.screenshot({ path: 'artifacts/clinical_saved.png' });
});
