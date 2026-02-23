import { test, expect } from "@playwright/test";

test("TaskCard: カード本体クリックで遷移、MoveStatusMenu クリックで遷移しない", async ({ page }) => {
  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="task-card"]');
  const card = page.locator('[data-testid="task-card"]').first();
  const initialUrl = page.url();

  // MoveStatusMenu のトリガーをクリック → 遷移しない
  await card.locator('[data-testid="move-status-trigger"]').click();
  expect(page.url()).toBe(initialUrl);

  // ドロップダウンを閉じる
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);

  // カード本体（タイトル部分）をクリック → /tasks/[id] へ遷移
  await card.locator('[data-testid="task-card-title"]').click();
  await page.waitForURL(/\/tasks\/.+/);
  await expect(page).toHaveURL(/\/tasks\/.+/);
});
