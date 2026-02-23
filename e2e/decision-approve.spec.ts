import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

const E2E_DECISION_TITLE_MARKER = "E2E: 判断ループテスト用タスク（自動生成）";

test("in_progress → waiting_decision (UI) → decisions 一覧 inline approve → in_progress", async ({ page }) => {
  const testData = JSON.parse(readFileSync(join(__dirname, ".e2e-testdata.json"), "utf-8")) as {
    goalId: string;
    overdueTaskId: string;
    cardTaskId: string;
    e2e3TaskId: string;
  };

  // Step 1: タスク詳細へ移動し waiting_decision に遷移
  await page.goto(`/tasks/${testData.e2e3TaskId}`);
  await page.waitForSelector('[data-testid="move-status-trigger"]');

  await page.click('[data-testid="move-status-trigger"]');
  await page.click('[data-testid="status-option-waiting_decision"]');

  await expect(page.getByText("判断リクエストを自動作成しました")).toBeVisible();

  // Step 2: decisions 一覧へ移動して inline approve
  await page.goto("/decisions");
  const decisionItem = page.locator('[data-testid="decision-item"]')
    .filter({ hasText: E2E_DECISION_TITLE_MARKER });
  await expect(decisionItem).toBeVisible();

  await decisionItem.locator('[data-testid="inline-approve-btn"]').click();
  await expect(page.getByText("承認しました")).toBeVisible();

  // Step 3: タスク詳細に戻りステータスを確認
  await page.goto(`/tasks/${testData.e2e3TaskId}`);
  await page.waitForSelector('[data-testid="task-status-badge"]');
  await expect(page.locator('[data-testid="task-status-badge"]')).toContainText("In Progress");
});
