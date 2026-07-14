import { expect, test } from '@playwright/test';

test('redirects a signed-out portal visit to login', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'SPECs 비교과 통합행정 포탈' })).toBeVisible();
});

test('serves the Workflow Lab and legacy bookmark redirect', async ({ page }) => {
  await page.goto('/workflow-lab/');
  await expect(page.locator('[data-workflow-lab-root="true"]')).toBeVisible();

  await page.goto('/workflow-lab/dept.html?source=bookmark');
  await expect(page).toHaveURL(/\/workflow-lab\/dept\?source=bookmark$/);
  await expect(page.locator('[data-workflow-lab-root="true"]')).toBeVisible();
});
