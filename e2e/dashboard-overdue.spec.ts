import { test, expect } from "@playwright/test";

test("期限超過タスク Top5 → タスク詳細へ遷移し詳細が表示される", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForSelector('[data-testid="overdue-task-item"]');
  const firstItem = page.locator('[data-testid="overdue-task-item"]').first();
  const titleText = await firstItem.locator('[data-testid="overdue-task-title"]').innerText();

  await firstItem.click();
  await page.waitForURL(/\/tasks\/.+/);

  await expect(page.locator('[data-testid="task-detail-title"]')).toContainText(titleText);
});
