
import { test, expect } from '@playwright/test';

test.describe('Investigations Module', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
        page.on('pageerror', exception => console.log(`PAGE ERROR: ${exception}`));

        // Force local mode
        await page.addInitScript(() => {
            window.localStorage.setItem('medflow_force_local', 'true');
        });

        // Login
        await page.goto('http://localhost:3000/login');
        await page.fill('[data-testid="login-email-input"]', 'doctor@medflow.ai');
        await page.fill('[data-testid="login-password-input"]', 'password123');
        await page.click('[data-testid="login-submit-button"]');
        await expect(page.getByTestId('dashboard-title')).toBeVisible();

        // Navigate to a patient detail page (assuming we have one)
        // We need to ensure we are on a patient page that has the Investigations tab.
        // Let's assume the first patient in the dashboard list.
        await page.locator('[data-testid^="patient-card-"]').first().click();

        // Click Investigations Tab (we need to ensure it exists in PatientDetailPage)
        // Note: We haven't integrated InvestigationTab into PatientDetailPage yet in the code!
        // We should do that BEFORE running this test.
        // But I will write the test assuming it's there, or I should pause and integrate it first.
        // I'll write the test now, then integrate.
        await page.getByText('Investigations').click();
    });

    test('should create a new investigation order', async ({ page }) => {
        await page.getByRole('button', { name: 'New Order' }).click();
        await page.fill('input[placeholder*="e.g., CBC"]', 'Chest X-Ray');
        // Select Radiology
        // Select Priority
        await page.getByRole('button', { name: 'Place Order' }).click();

        await expect(page.getByText('Chest X-Ray')).toBeVisible();
        await expect(page.getByText('ordered')).toBeVisible();
    });

    test('should upload report and view summary', async ({ page }) => {
        // Assuming 'Chest X-Ray' exists from previous test or seed
        // In isolated test, we might need to create it again or rely on seed.
        // Let's create one quickly to be safe.
        await page.getByRole('button', { name: 'New Order' }).click();
        await page.fill('input[placeholder*="e.g., CBC"]', 'MRI Brain');
        await page.getByRole('button', { name: 'Place Order' }).click();

        // Click Upload
        // We need to handle file upload.
        // Note: The UploadReportModal uses <Input type="file">
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.locator('button:has-text("Upload")').first().click();

        const fileChooser = await fileChooserPromise;
        // Create a dummy PDF or image
        await fileChooser.setFiles({
            name: 'report.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('dummy content')
        });

        await page.getByRole('button', { name: 'Upload & Complete' }).click();

        // Check status changed to completed
        await expect(page.getByText('completed')).toBeVisible();

        // View Report
        await page.getByRole('button', { name: 'View Report' }).click();
        await expect(page.getByText('Investigation Report')).toBeVisible();

        // Check AI Summary (mocked response)
        await expect(page.getByText('AI Analysis')).toBeVisible();
        // The mock service returns "Findings consistent with..."
        await expect(page.getByText('Findings consistent with')).toBeVisible({ timeout: 10000 });
    });
});
