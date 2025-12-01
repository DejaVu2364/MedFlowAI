import { test, expect } from '@playwright/test';

test.describe('Visual Readiness Audit', () => {
    test.setTimeout(90000);

    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/');
    });

    test('capture screenshots of critical workflows', async ({ page }) => {
        // 1. Login Page or Dashboard
        // Check if we are already logged in (redirected to dashboard) or need login
        const dashboardTitle = page.getByTestId('dashboard-title').first();
        const loginInput = page.locator('[data-testid="login-email-input"]');

        try {
            // Wait for either dashboard or login input
            await Promise.race([
                dashboardTitle.waitFor({ state: 'visible', timeout: 10000 }),
                loginInput.waitFor({ state: 'visible', timeout: 10000 })
            ]);
        } catch (e) {
            console.log("Waiting for initial state timed out, checking visibility...");
        }

        if (await loginInput.isVisible()) {
            await page.screenshot({ path: 'screenshots/1_login_page.png' });
            await loginInput.fill('doctor@medflow.ai');
            await page.fill('[data-testid="login-password-input"]', 'password123');
            await page.click('[data-testid="login-submit-button"]');
        }

        // Wait for dashboard title explicitly
        await expect(dashboardTitle).toBeVisible({ timeout: 20000 });

        // 2. Dashboard
        await page.screenshot({ path: 'screenshots/2_dashboard.png' });

        // 3. Reception (Registration)
        await page.click('[data-testid="nav-reception"]');
        await expect(page.locator('[data-testid="register-patient-button"]')).toBeVisible();
        await page.fill('[data-testid="patient-name-input"]', 'VisualTest Patient');
        await page.fill('[data-testid="patient-age-input"]', '50');
        await page.selectOption('select[name="gender"]', 'Female');
        await page.fill('input[name="contact"]', '555-0000');
        await page.fill('[data-testid="complaint-input"]', 'Visual verification test');
        await page.fill('[data-testid="duration-value-input"]', '1');
        await page.selectOption('[data-testid="duration-unit-select"]', 'days');
        await page.click('[data-testid="add-complaint-button"]');

        await page.screenshot({ path: 'screenshots/3_reception_form.png' });

        await page.$eval('form[data-testid="registration-form"]', (form: HTMLFormElement) => form.requestSubmit());
        await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 20000 });

        // 4. Patient Detail
        const patientCard = page.locator('h4', { hasText: 'VisualTest Patient' }).first();
        await expect(patientCard).toBeVisible();
        await patientCard.click({ force: true });

        // Wait for Patient Detail to load
        await expect(page.getByRole('button', { name: 'MedView' }).first()).toBeVisible({ timeout: 15000 });

        await page.screenshot({ path: 'screenshots/4_patient_detail_summary.png' });

        // 5. Rounds Tab
        const roundsTab = page.getByRole('button', { name: 'Rounds' }).first();
        await roundsTab.click({ force: true });
        // Check for specific content in Rounds tab to ensure it loaded
        await expect(page.getByText('Ambient Scribe')).toBeVisible({ timeout: 15000 });

        await page.screenshot({ path: 'screenshots/5_rounds_tab.png' });

        // 6. Discharge Summary
        // Navigate using button
        await page.locator('button', { hasText: 'Discharge' }).first().click();
        await expect(page).toHaveURL(/\/discharge/, { timeout: 15000 });

        // Wait for Discharge Summary header
        await expect(page.locator('h1', { hasText: 'Discharge Summary' })).toBeVisible({ timeout: 20000 });

        // Wait for content to settle
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/6_discharge_summary.png' });
    });
});
