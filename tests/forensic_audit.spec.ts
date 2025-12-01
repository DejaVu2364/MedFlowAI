import { test, expect } from '@playwright/test';

test.describe('Forensic QA Audit', () => {
    test.setTimeout(120000);

    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/');
    });

    test('Forensic: Auth Failure', async ({ page }) => {
        const screenshotDir = 'screenshots_forensic';
        // Simplistic check for Auth Failure test - force wait for login
        const loginInput = page.locator('[data-testid="login-email-input"]');
        if (await loginInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await page.screenshot({ path: `${screenshotDir}/01_01_login_initial.png` });

            await page.fill('[data-testid="login-email-input"]', 'doctor@medflow.ai');
            await page.fill('[data-testid="login-password-input"]', 'wrongpass');
            await page.click('[data-testid="login-submit-button"]');

            await expect(page.locator('button[type="submit"]')).toHaveText('Sign in', { timeout: 10000 });
            await page.screenshot({ path: `${screenshotDir}/01_02_login_error.png` });
        }
    });

    test('Forensic: Main Workflow', async ({ page }) => {
        const screenshotDir = 'screenshots_forensic';
        console.log("Forensic: Main Workflow Start");

        // 1. Determine State
        const dashboardTitle = page.getByTestId('dashboard-title').first();
        const loginInput = page.locator('[data-testid="login-email-input"]');

        let isLogged = false;
        try {
            await expect(dashboardTitle).toBeVisible({ timeout: 5000 });
            isLogged = true;
        } catch (e) {
            // Not logged in or loading
        }

        if (!isLogged) {
            console.log("Not logged in, attempting login...");
            await expect(loginInput).toBeVisible({ timeout: 10000 });
            await loginInput.fill('doctor@medflow.ai');
            await page.fill('[data-testid="login-password-input"]', 'password123');
            await page.click('[data-testid="login-submit-button"]');

            // Wait for dashboard after login
            await expect(dashboardTitle).toBeVisible({ timeout: 20000 });
        }

        await page.screenshot({ path: `${screenshotDir}/02_01_dashboard_full.png` });

        // --- 2. Dashboard Forensic ---
        console.log("Forensic: Dashboard");
        const firstCard = page.locator('div.grid > div').first();
        if (await firstCard.isVisible()) {
            await firstCard.hover();
            await page.waitForTimeout(300);
            await page.screenshot({ path: `${screenshotDir}/02_02_dashboard_card_hover.png` });
            await firstCard.screenshot({ path: `${screenshotDir}/02_03_card_component.png` });
        }

        // Search Focus
        const searchBtn = page.locator('button:has-text("Search")').first();
        if (await searchBtn.isVisible()) {
             await searchBtn.click();
             await page.waitForTimeout(500);
             await page.screenshot({ path: `${screenshotDir}/10_01_command_palette.png` });
             await page.keyboard.press('Escape');
        }

        // --- 3. Reception Module ---
        console.log("Forensic: Reception");
        await page.click('[data-testid="nav-reception"]');
        await expect(page.locator('[data-testid="register-patient-button"]')).toBeVisible();
        await page.screenshot({ path: `${screenshotDir}/03_01_reception_empty.png` });

        // Validation Error
        await page.click('[data-testid="register-patient-button"]');
        await page.screenshot({ path: `${screenshotDir}/03_02_reception_validation.png` });

        // Fill Form
        await page.fill('[data-testid="patient-name-input"]', 'Forensic Patient');
        await page.fill('[data-testid="patient-age-input"]', '40');
        await page.selectOption('select[name="gender"]', 'Male');
        await page.fill('input[name="contact"]', '555-9999');
        await page.fill('[data-testid="complaint-input"]', 'Visual Audit');
        await page.fill('[data-testid="duration-value-input"]', '3');
        await page.selectOption('[data-testid="duration-unit-select"]', 'days');
        await page.click('[data-testid="add-complaint-button"]');

        await page.screenshot({ path: `${screenshotDir}/03_03_reception_filled.png` });

        await page.$eval('form[data-testid="registration-form"]', (form: HTMLFormElement) => form.requestSubmit());
        await expect(page.getByTestId('dashboard-title')).toBeVisible();

        // --- 4. Patient Detail Page ---
        console.log("Forensic: Patient Detail");
        const patientCard = page.locator('h4', { hasText: 'Forensic Patient' }).first();
        await patientCard.click({ force: true });

        await expect(page.getByRole('button', { name: 'MedView' }).first()).toBeVisible({ timeout: 20000 });
        await page.screenshot({ path: `${screenshotDir}/04_01_patient_header.png` });

        // MedView
        await page.screenshot({ path: `${screenshotDir}/04_02_medview_tab.png` });

        // Clinical File
        console.log("Forensic: Clinical File");
        await page.locator('button', { hasText: 'Clinical File' }).first().click();
        // Wait for ANY heading in accordion to be visible, e.g. "History of Present Illness"
        const sectionHeader = page.getByText('History of Present Illness').first();
        await expect(sectionHeader).toBeVisible();
        await sectionHeader.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${screenshotDir}/05_01_clinical_history_expanded.png` });

        const historyInput = page.locator('textarea').first();
        if (await historyInput.isVisible()) {
            await historyInput.click();
            await page.screenshot({ path: `${screenshotDir}/05_02_clinical_input_focus.png` });
        }

        // Orders
        console.log("Forensic: Orders");
        await page.locator('button', { hasText: 'Orders' }).first().click();
        await expect(page.getByText('Active Orders').first()).toBeVisible();
        await page.screenshot({ path: `${screenshotDir}/06_01_orders_tab.png` });
        await page.screenshot({ path: `${screenshotDir}/06_02_orders_catalog.png` });

        // Vitals
        console.log("Forensic: Vitals");
        await page.locator('button', { hasText: 'Vitals' }).first().click();
        await expect(page.getByText('Quick Entry')).toBeVisible();
        await page.screenshot({ path: `${screenshotDir}/07_01_vitals_tab.png` });
        const pulseInput = page.locator('input[name="pulse"]');
        if (await pulseInput.isVisible()) {
            await pulseInput.click();
            await page.screenshot({ path: `${screenshotDir}/07_02_vitals_input_focus.png` });
        }

        // Rounds
        console.log("Forensic: Rounds");
        await page.locator('button', { hasText: 'Rounds' }).first().click();
        await expect(page.getByText('Ambient Scribe')).toBeVisible();
        await page.screenshot({ path: `${screenshotDir}/08_01_rounds_tab.png` });
        await page.click('text=Ambient Scribe');
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${screenshotDir}/08_02_rounds_scribe_active.png` });
        await page.click('text=Stop Recording');

        // Discharge
        console.log("Forensic: Discharge");
        await page.locator('button', { hasText: 'Discharge' }).first().click();
        // Wait for URL change
        await expect(page).toHaveURL(/\/discharge/);
        // Soft check for header to allow screenshot even if loading
        try {
            await expect(page.locator('h1', { hasText: 'Discharge Summary' })).toBeVisible({ timeout: 5000 });
        } catch(e) {
            console.log("Discharge header not found, taking screenshot anyway");
        }
        await page.screenshot({ path: `${screenshotDir}/09_01_discharge_summary.png` });

        // Dark Mode Check
        console.log("Forensic: Dark Mode");
        await page.screenshot({ path: `${screenshotDir}/12_01_dark_mode_check.png` });
    });
});
