import { test, expect } from '@playwright/test';

test.describe('MedFlow AI E2E', () => {
    // Increase timeout for slower environments
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/');

        // Handle Login if redirected
        try {
            // Wait for either dashboard or login page
            const loginInput = page.locator('[data-testid="login-email-input"]');
            const dashboardTitle = page.getByTestId('dashboard-title').first();

            // Short wait to see which one appears
            await Promise.race([
                loginInput.waitFor({ state: 'visible', timeout: 5000 }),
                dashboardTitle.waitFor({ state: 'visible', timeout: 5000 })
            ]);

            if (await loginInput.isVisible()) {
                console.log("Logging in...");
                await loginInput.fill('doctor@medflow.ai');
                await page.fill('[data-testid="login-password-input"]', 'password123');
                await page.click('[data-testid="login-submit-button"]');
                await expect(dashboardTitle).toBeVisible({ timeout: 10000 });
            }
        } catch (e) {
            console.log("Login check skipped or timed out, proceeding...");
        }
        // Verify Dashboard loads
        await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 20000 });
    });

    test('should register a new patient and navigate to details', async ({ page }) => {
        // Navigate to Reception
        await page.click('[data-testid="nav-reception"]');
        await expect(page.locator('[data-testid="register-patient-button"]')).toBeVisible();

        // Fill form
        const timestamp = Date.now();
        const patientName = `TestPatient${timestamp}`;
        await page.fill('[data-testid="patient-name-input"]', patientName);
        await page.fill('[data-testid="patient-age-input"]', '30');
        await page.selectOption('select[name="gender"]', 'Male');
        await page.fill('input[name="contact"]', '555-0123');
        await page.fill('[data-testid="complaint-input"]', 'Severe headache');
        await page.fill('[data-testid="duration-value-input"]', '2');
        await page.selectOption('[data-testid="duration-unit-select"]', 'days');
        await page.click('[data-testid="add-complaint-button"]');
        await expect(page.locator('[data-testid="complaint-badge-0"]')).toBeVisible();

        // Submit
        const submitButton = page.locator('[data-testid="register-patient-button"]');
        await expect(submitButton).toBeEnabled({ timeout: 10000 });

        // Force form submission to ensure handleSubmit is called
        await page.$eval('form[data-testid="registration-form"]', (form: HTMLFormElement) => form.requestSubmit());

        // 1. Wait for Reception page to unmount (zombie view fix)
        await expect(page.getByTestId('registration-form')).toBeHidden({ timeout: 15000 });

        // Debug: Check if dashboard title is attached
        const title = page.getByTestId('dashboard-title').first();
        try {
            await expect(title).toBeAttached({ timeout: 5000 });
            console.log("DEBUG: Dashboard title IS attached");
        } catch (e) {
            console.log("DEBUG: Dashboard title is NOT attached");
        }

        // 2. Wait for Dashboard page to appear
        await expect(title).toBeVisible({ timeout: 10000 });

        // Find the new patient card using text (more robust than testid if name formatting varies)
        const patientCard = page.locator('h4', { hasText: patientName });
        await expect(patientCard).toBeVisible({ timeout: 10000 });

        // Navigate to Patient Detail
        await patientCard.click({ force: true });

        // Verify Patient Detail Page loaded (using a visual anchor instead of URL)
        // Updated to use buttons instead of role="tab"
        const clinicalTab = page.getByRole('button', { name: 'Clinical File' }).first();
        await expect(clinicalTab).toBeVisible();

        // Check Tabs
        await expect(page.getByRole('button', { name: 'Clinical File' }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'Orders' }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'MedView' }).first()).toBeVisible();

        // Default tab is MedView
        await expect(page.locator('text=Doctor-to-Doctor Handover')).toBeVisible();

        // Switch to Clinical File Tab
        await clinicalTab.click();
        await expect(page.getByRole('button', { name: 'History' }).first()).toBeVisible();

        // Switch to Orders Tab
        await page.getByRole('button', { name: 'Orders' }).first().click();

        // Use first() to avoid strict mode violation if multiple elements match
        await expect(page.locator('text=Active Orders').first()).toBeVisible();
    });
});
