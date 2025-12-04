import { test, expect } from '@playwright/test';

test('Debug App Load', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.type() + ': ' + msg.text()));
    page.on('pageerror', err => logs.push('ERROR: ' + err.message));

    console.log("Navigating to / ...");
    await page.goto('/');

    console.log("Waiting for 5 seconds...");
    await page.waitForTimeout(5000);

    console.log("Taking screenshot...");
    await page.screenshot({ path: 'debug_screenshot.png' });

    console.log("Browser Console Logs:");
    logs.forEach(log => console.log(log));

    // Check for critical elements
    const dashboardTitle = await page.getByTestId('dashboard-title').isVisible();
    console.log(`Dashboard Title Visible: ${dashboardTitle}`);

    const loginInput = await page.locator('[data-testid="login-email-input"]').isVisible();
    console.log(`Login Input Visible: ${loginInput}`);

    if (!dashboardTitle && !loginInput) {
        console.log("⚠️ neither dashboard nor login is visible. App might be blank.");
    }
});
