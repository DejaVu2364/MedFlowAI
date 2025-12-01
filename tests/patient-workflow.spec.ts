import { test, expect } from '@playwright/test';

test.describe('Patient Workflow', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('[data-testid="login-email-input"]', 'doctor@medflow.ai');
        await page.fill('[data-testid="login-password-input"]', 'password123');
        await page.click('[data-testid="login-submit-button"]');
        await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 20000 });
    });

    test('should register a patient and add vitals', async ({ page }) => {
        // 1. Register Patient
        await page.click('[data-testid="nav-reception"]');

        const timestamp = Date.now();
        const patientName = `WorkflowPatient${timestamp}`;
        await page.fill('[data-testid="patient-name-input"]', patientName);
        await page.fill('[data-testid="patient-age-input"]', '45');
        await page.selectOption('select[name="gender"]', 'Female');
        await page.fill('input[name="contact"]', '555-9999');
        await page.fill('[data-testid="complaint-input"]', 'Chest pain');
        await page.fill('[data-testid="duration-value-input"]', '2');
        await page.selectOption('[data-testid="duration-unit-select"]', 'hours');
        await page.click('[data-testid="add-complaint-button"]');

        // Force submit
        await page.$eval('form[data-testid="registration-form"]', (form: HTMLFormElement) => form.requestSubmit());

        // Wait for dashboard and patient card
        await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 20000 });

        // Find and click patient
        const patientCard = page.locator('h4', { hasText: patientName }).first();
        await expect(patientCard).toBeVisible({ timeout: 10000 });
        await patientCard.click({ force: true });

        // Wait for Patient Detail page to load
        // Use button selector instead of tab role because they are implemented as buttons
        const vitalsTab = page.getByRole('button', { name: 'Vitals' }).first();
        await expect(vitalsTab).toBeVisible({ timeout: 15000 });

        // 2. Add Vitals
        await vitalsTab.click();

        // Check if we are on Vitals tab
        await expect(page.getByText('Quick Entry')).toBeVisible();

        // Fill Vitals Input Card
        await page.fill('input[name="pulse"]', '88');
        await page.fill('input[name="spo2"]', '98');
        await page.fill('input[name="bp_sys"]', '125');
        await page.fill('input[name="bp_dia"]', '82');
        await page.fill('input[name="rr"]', '18');
        await page.fill('input[name="temp_c"]', '37.1');
        await page.fill('input[name="pain_score"]', '2');

        await page.click('button:has-text("Save")');

        // Verify Vitals added in the list/table
        await expect(page.getByText('125/82').first()).toBeVisible();
    });
});
