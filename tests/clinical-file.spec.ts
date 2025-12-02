
import { test, expect } from '@playwright/test';

test.describe('Clinical File', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('http://localhost:3000/login');
        await page.fill('[data-testid="login-email-input"]', 'doctor@medflow.ai');
        await page.fill('[data-testid="login-password-input"]', 'password123');
        await page.click('[data-testid="login-submit-button"]');
        await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 10000 });

        // Wait for patients to load and click on one
        const patientCard = page.locator('[data-testid^="patient-card-"]').first();
        await expect(patientCard).toBeVisible({ timeout: 20000 });
        await patientCard.click();

        // Click Clinical File tab
        await page.click('text=Clinical File');
    });

    test('loads all clinical sections with view mode', async ({ page }) => {
        await expect(page.locator('text=HISTORY OF PRESENT ILLNESS')).toBeVisible();
        await expect(page.locator('text=PAST MEDICAL HISTORY')).toBeVisible();
        // Check for Edit buttons
        await expect(page.locator('button:has-text("Edit Section")').first()).toBeVisible();
    });

    test('Editing Workflow', async ({ page }) => {
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        // Click Edit for HOPI (first section usually)
        await page.click('button:has-text("Edit Section") >> nth=0');

        // Check for textarea
        const textarea = page.locator('textarea');
        await expect(textarea).toBeVisible();

        // Type text
        const testText = `Patient has fever ${Date.now()}`;
        await textarea.fill(testText);

        // Save
        await page.click('text=Save Changes');

        // Debug localStorage
        const stored = await page.evaluate(() => localStorage.getItem('medflow_patients'));
        console.log("LocalStorage after save:", stored ? "Found data" : "Empty");
        if (stored) {
            const patients = JSON.parse(stored);
            const p = patients.find((p: any) => JSON.stringify(p).includes(testText));
            console.log("Found text in localStorage:", !!p);
        }

        // Verify text persists
        await expect(page.locator(`text=${testText}`)).toBeVisible();

        // Reload
        await page.reload();
        await page.waitForSelector('text=Clinical File');
        await page.click('text=Clinical File'); // Navigate back to tab
        await expect(page.locator(`text=${testText}`)).toBeVisible();
    });

    test('AI Clean-Up UI', async ({ page }) => {
        await page.click('button:has-text("Edit Section") >> nth=0');
        await page.locator('textarea').fill('fever high temp');

        const cleanBtn = page.locator('text=Clean & Structure (AI)');
        await expect(cleanBtn).toBeVisible();
    });
});
