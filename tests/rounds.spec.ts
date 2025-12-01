import { test, expect } from '@playwright/test';

test.describe('Rounds and AI', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('[data-testid="login-email-input"]', 'doctor@medflow.ai');
        await page.fill('[data-testid="login-password-input"]', 'password123');
        await page.click('[data-testid="login-submit-button"]');
        await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 20000 });
    });

    test('should load rounds tab and simulate AI interaction', async ({ page }) => {
        // Need a patient to test rounds.
        await page.click('[data-testid="nav-reception"]');
        const timestamp = Date.now();
        const patientName = `RoundsPatient${timestamp}`;
        await page.fill('[data-testid="patient-name-input"]', patientName);
        await page.fill('[data-testid="patient-age-input"]', '60');
        await page.selectOption('select[name="gender"]', 'Male');
        await page.fill('input[name="contact"]', '555-1111');
        await page.fill('[data-testid="complaint-input"]', 'Fever');

        // Fix: Fill duration and unit to enable Add Complaint button
        await page.fill('[data-testid="duration-value-input"]', '1');
        await page.selectOption('[data-testid="duration-unit-select"]', 'days');

        await page.click('[data-testid="add-complaint-button"]');
        await page.$eval('form[data-testid="registration-form"]', (form: HTMLFormElement) => form.requestSubmit());
        await expect(page.getByTestId('dashboard-title')).toBeVisible({ timeout: 20000 });

        const patientCard = page.locator('h4', { hasText: patientName }).first();
        await expect(patientCard).toBeVisible();
        await patientCard.click({ force: true });

        // Wait for Patient Detail Page
        await expect(page.getByRole('button', { name: 'MedView' }).first()).toBeVisible({ timeout: 10000 });

        // Find Rounds tab button
        const roundsTab = page.getByRole('button', { name: 'Rounds' }).first();
        await expect(roundsTab).toBeVisible();
        await roundsTab.click({ force: true });

        // Wait for content
        await expect(page.getByText('Daily Progress Note (SOAP)')).toBeVisible({ timeout: 15000 });

        // Check for AI Scribe text
        await expect(page.getByText('Ambient Scribe')).toBeVisible();

        // Test AI Suggestion
        const suggestButton = page.getByText('Suggest Topics');
        if (await suggestButton.isVisible()) {
             await suggestButton.click();
             await expect(page.getByText('Thinking...')).toBeVisible();
             // The component uses hardcoded suggestions in setTimeout, not the API.
             // We verify one of the hardcoded suggestions appears.
             await expect(page.getByText('Consider repeating CRP')).toBeVisible({ timeout: 10000 });
        }

        // Test Scribe Simulation
        const scribeButton = page.getByText('Ambient Scribe');
        await scribeButton.click();

        await expect(page.getByText('Stop Recording')).toBeVisible();
        await page.click('text=Stop Recording');

        // Check if SOAP notes are filled
        await expect(page.getByText('Patient reports feeling better today')).toBeVisible();
    });
});
