# Mission Control — 設計書

> AI エージェントの運用を「見える化」し「人間が前に進める」ための司令塔アプリケーション。
> 最終更新: 2026-02-23

---

## 1. プロダクト概要

### 1.1 ミッション

AI エージェントが自律的にタスクを実行する世界で、人間がオーナーシップを保つための **承認ファースト（Approval-first）** な運用基盤を提供する。

### 1.2 コア原則

| 原則 | 説明 |
|------|------|
| **承認ファースト** | エージェントの重要アクションは必ず人間が承認してから実行される |
| **透明性** | 全変更がリアルタイムで可視化され、Activity として記録される |
| **最小摩擦** | 朝 10 分で全状況を把握し、意思決定できる UX を目指す |

### 1.3 想定ユーザーフロー（朝 10 分ルーティン）

```
1. /dashboard を開く
2. 「保留中の判断 Top5」から最も緊急な Decision をクリック
3. /decisions/[id] で内容確認 → 「承認」クリック
4. サーバ側で Decision → approved、Task → in_progress に自動遷移
5. Toast: "承認しました" → /decisions に戻る
6. Dashboard の「期限超過タスク Top5」から超過タスクをクリック
7. /tasks/[id] で詳細確認（ステータス、関連 Decision、成果物）
8. 「+ 成果物を登録」ボタンをクリック
9. /outputs/new?taskId=xxx&goalId=xxx で成果物を登録
10. 登録完了 → /outputs に戻る
```

---

## 2. 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| フロントエンド | Next.js (App Router) | 15.5.12 |
| UI ライブラリ | React | 19.1.0 |
| スタイル | Tailwind CSS | 4.x |
| コンポーネント | shadcn/ui + Radix UI | - |
| アイコン | lucide-react | - |
| トースト | sonner | - |
| 日付 | date-fns | - |
| バックエンド | Convex (リアクティブ BaaS) | ^1.32.0 |
| 言語 | TypeScript | 5.x |
| パッケージマネージャ | pnpm | - |

---

## 3. アーキテクチャ

### 3.1 全体構成

```
┌──────────────┐     リアクティブ       ┌──────────────┐
│  Next.js     │  ←──────────────────→  │  Convex      │
│  App Router  │   useQuery / useMutation│  (Cloud DB)  │
│  (Client)    │                         │  (Serverless)│
└──────────────┘                         └──────────────┘
      │                                        │
      ├─ src/app/         … ページ              ├─ convex/schema.ts   … スキーマ定義
      ├─ src/components/  … UI コンポーネント    ├─ convex/*.ts        … query / mutation
      ├─ src/lib/         … ユーティリティ       └─ convex/helpers.ts  … 共通ヘルパー
      └─ src/providers/   … Context プロバイダー
```

### 3.2 データフロー

```
[User Action]
    ↓
useMutation(api.xxx.yyy)
    ↓
Convex Mutation Handler
    ├── バリデーション
    ├── DB 操作 (ctx.db.insert / patch)
    ├── 副作用 (appendActivity, auto-create Decision, etc.)
    └── return
    ↓
useQuery が自動で再評価 → UI リアクティブ更新
```

### 3.3 ディレクトリ構成

```
mission-control/
├── convex/                    # Convex バックエンド
│   ├── schema.ts              # DB スキーマ定義（15 テーブル）
│   ├── helpers.ts             # 共通ヘルパー（appendActivity, appendReasonNote 等）
│   ├── dashboard.ts           # ダッシュボード集計クエリ
│   ├── goals.ts               # Goals CRUD
│   ├── tasks.ts               # Tasks CRUD + 状態遷移
│   ├── decisions.ts           # Decisions CRUD + resolve（承認副作用込み）
│   ├── outputs.ts             # Outputs CRUD
│   ├── activityEvents.ts      # Activity ログクエリ
│   ├── agents.ts              # Agents CRUD
│   ├── agentTemplates.ts      # Agent テンプレート
│   ├── boards.ts              # Kanban ボード
│   ├── runs.ts                # 実行ログ
│   ├── gateways.ts            # Gateway 管理
│   ├── complianceEvents.ts    # コンプライアンスイベント
│   ├── users.ts               # ユーザー
│   ├── seed.ts                # 初期データ投入
│   └── clearAll.ts            # 開発用全データ削除
├── src/
│   ├── app/                   # Next.js App Router ページ
│   │   ├── dashboard/page.tsx # ダッシュボード（KPI / Top5 / Activity）
│   │   ├── decisions/
│   │   │   ├── page.tsx       # 判断一覧
│   │   │   └── [id]/page.tsx  # 判断詳細（承認/却下/修正依頼）
│   │   ├── tasks/
│   │   │   ├── page.tsx       # タスク一覧（Kanban / List）
│   │   │   ├── new/page.tsx   # タスク作成
│   │   │   └── [id]/page.tsx  # タスク詳細（Phase 2 で追加）
│   │   ├── goals/
│   │   │   ├── page.tsx       # ゴール一覧
│   │   │   ├── new/page.tsx   # ゴール作成
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # ゴール詳細
│   │   │       └── edit/page.tsx # ゴール編集
│   │   ├── outputs/
│   │   │   ├── page.tsx       # 成果物一覧
│   │   │   └── new/page.tsx   # 成果物作成（taskId セレクター付き）
│   │   ├── team/page.tsx      # チーム（Agent / User）
│   │   ├── runs/page.tsx      # 実行ログ一覧
│   │   ├── gateways/          # Gateway 管理
│   │   ├── compliance/page.tsx # コンプライアンス
│   │   └── layout.tsx         # ルートレイアウト
│   ├── components/
│   │   ├── ui/                # shadcn/ui ベースコンポーネント
│   │   ├── layout/            # Sidebar, PageHeader
│   │   ├── shared/            # StatusBadge, TimeAgo, EmptyState
│   │   ├── tasks/             # TaskCard, MoveStatusMenu, KanbanBoard, BlockedReasonDialog
│   │   ├── decisions/         # ResolveDialog, StaleBadge
│   │   ├── goals/             # GoalForm
│   │   └── dashboard/         # ActivityFeed
│   ├── lib/
│   │   ├── constants.ts       # ステータスラベル / カラーマッピング
│   │   ├── utils.ts           # cn, formatDate, timeAgo, formatAge
│   │   └── feature-flags.ts   # フィーチャーフラグ
│   └── providers/
│       ├── convex-provider.tsx     # ConvexProvider ラッパー
│       └── default-user-provider.tsx # デフォルトユーザー Context
└── scripts/
    └── test-blocked-reason.ts # appendReasonNote 回帰テスト
```

---

## 4. データモデル

### 4.1 ER 概要

```
User ─────────────────────────────────────────────────────────────
  │                                                                │
  └──owns──→ Goal (1:N)                                            │
               │                                                    │
               ├──has──→ Board (1:N)                                │
               │            │                                       │
               │            └──contains──→ Task (N, via boardId)    │
               │                                                    │
               ├──has──→ Task (1:N, via goalId) [required]          │
               │            │                                       │
               │            ├──latest──→ Decision (0..1)            │
               │            ├──has──→ Output (0:N)                  │
               │            ├──has──→ ActivityEvent (0:N)            │
               │            └──has──→ Run (0:N)                     │
               │                                                    │
               ├──has──→ Decision (0:N, via goalId)                 │
               └──has──→ Output (0:N, via goalId)                   │
                                                                    │
Agent ──→ AgentTemplate ──→ Skill                                   │
  │                                                                 │
  ├──runs──→ Run ──→ Task/Decision                                  │
  └──connects──→ Gateway                                            │
                                                                    │
Decision ──resolvedBy──→ User ──────────────────────────────────────┘

ComplianceEvent ──→ Agent/Gateway/Task/Run
ActivityEvent ──→ Goal/Task/Decision/Run/Output/Agent/Gateway
```

### 4.2 テーブル一覧（15 テーブル）

| テーブル | 概要 | 主要フィールド |
|---------|------|---------------|
| `users` | ユーザー | displayName, email |
| `goals` | ゴール（目標） | title, domain, area, status, priority, timeframe, successMetrics |
| `boards` | Kanban ボード | name, goalId, columns |
| `tasks` | タスク | title, goalId, boardId, status, priority, dueAt, assignee, latestDecisionId |
| `agents` | AI エージェント | name, templateId, status, gatewayId, currentTaskId |
| `agentTemplates` | エージェントテンプレート | name, policy, allowedSkillIds |
| `skills` | エージェントスキル | key, name, category, risk |
| `gateways` | 実行環境 Gateway | name, kind, endpoint, isOnline |
| `runs` | エージェント実行ログ | agentId, taskId, status, objective, summary |
| `decisions` | 承認/判断事項 | type, status, title, taskId, options, recommendation, executionPreview |
| `outputs` | 成果物 | title, type, goalId, taskId, summary, artifacts |
| `complianceEvents` | コンプライアンスイベント | severity, message, attemptedAction, policyRule, resolved |
| `activityEvents` | 全アクティビティログ | type, message, goalId, taskId, decisionId, ... |
| `sources` | 外部データソース | key, name, enabled |
| `contextPacks` | コンテキストパック | items (sourceKey, ref, snippet) |

### 4.3 Task ステータス遷移図

```
                   ┌──────────────────────────┐
                   ↓                          │
  ┌──────┐    ┌─────────────┐    ┌─────────┐ │
  │ todo │───→│ in_progress │───→│  done   │ │
  └──┬───┘    └──┬──────┬───┘    └─────────┘ │
     │           │      │                     │
     │           │      └───→ ┌────────────────────────┐
     │           │            │ waiting_decision        │
     │           │            │ (auto-creates Decision) │
     │           │            └────────┬───────────────┘
     │           │                     │
     │           ↓                     ↓
     │      ┌─────────┐          ┌─────────┐
     └─────→│ blocked │          │ (resolve)│
             └────┬────┘          └────┬────┘
                  │                    │
                  ↓                    ↓
             ┌──────────┐     approve → in_progress
             │ canceled │     reject  → blocked
             └──────────┘     request_changes → (不変)
```

**遷移テーブル（ALLOWED マップ）:**

| From | To |
|------|----|
| `todo` | `in_progress`, `blocked`, `canceled` |
| `in_progress` | `todo`, `blocked`, `waiting_decision`, `done`, `canceled` |
| `blocked` | `todo`, `in_progress`, `canceled` |
| `waiting_decision` | `in_progress`, `blocked`, `done`, `canceled` |
| `done` | `todo` |
| `canceled` | `todo` |

### 4.4 Decision ステータス

```
pending → approved | rejected | changes_requested | canceled
```

### 4.5 主要インデックス

| テーブル | インデックス | 用途 |
|---------|-------------|------|
| tasks | `by_goal_status` | Goal 別ステータスフィルタ |
| tasks | `by_board_createdAt` | Kanban ボード内表示 |
| tasks | `by_dueAt` | 期限超過タスク取得 |
| tasks | `by_updatedAt` | 最近更新順 |
| decisions | `by_status_createdAt` | ステータス別リスト（Dashboard Top5） |
| outputs | `by_task_createdAt` | Task 別成果物取得 |
| outputs | `by_goal_createdAt` | Goal 別成果物取得 |
| activityEvents | `by_task_createdAt` | Task 別アクティビティ |
| activityEvents | `by_goal_createdAt` | Goal 別アクティビティ |

---

## 5. バックエンド設計（Convex）

### 5.1 設計方針

- **リアクティブクエリ**: `useQuery` でサブスクライブし、DB 変更が即座に UI に反映
- **Activity ログの一貫性**: 全 mutation で `appendActivity()` を呼び、変更履歴を追跡
- **バリデーション統一**: `validateString` / `validateOptionalString` で入力チェック
- **遷移不変条件**: `transitionTaskStatus` で許可された遷移のみ実行
- **CAS ガード**: 副作用実行前に現在のステータスを読み取り、条件一致時のみ操作

### 5.2 主要エントリポイント

#### tasks.ts

| Export | 種別 | 概要 |
|--------|------|------|
| `get` | query | ID で Task 1件取得 |
| `list` | query | goalId / status / boardId でフィルタ |
| `listRecent` | query | 最近更新順で取得（limit 付き） |
| `listUnassigned` | query | boardId = null のタスク |
| `listOverdue` | query | 期限超過タスク |
| `create` | mutation | タスク作成 + Activity |
| `update` | mutation | タスク更新 + Activity |
| `moveStatus` | mutation | Kanban 列移動（簡易） |
| `transitionTaskStatus` | mutation | **状態遷移の唯一のエントリポイント** |

**`transitionTaskStatus` の副作用:**
- `→ waiting_decision`: Decision レコードを自動生成、`task.latestDecisionId` に紐付け
- `→ blocked` (with reason): `appendReasonNote` で description に理由を追記

#### decisions.ts

| Export | 種別 | 概要 |
|--------|------|------|
| `get` | query | ID で Decision 1件取得 |
| `list` | query | status でフィルタ（デフォルト: pending） |
| `create` | mutation | Decision 作成 + Activity |
| `resolve` | mutation | **承認/却下/修正依頼 + Task 自動遷移** |

**`resolve` の Task 副作用（Phase 2）:**
- `approve` → Task が `waiting_decision` なら `in_progress` に自動遷移
- `reject` → Task が `waiting_decision` なら `blocked` に自動遷移 + description に却下理由追記
- `request_changes` → Task 不変
- CAS ガード: `task.status === "waiting_decision"` の場合のみ遷移実行
- 二重 resolve 防止: `decision.status !== "pending"` で先にガード

#### outputs.ts

| Export | 種別 | 概要 |
|--------|------|------|
| `list` | query | goalId / taskId / type でフィルタ |
| `create` | mutation | Output 作成 + Activity |

#### helpers.ts

| Export | 種別 | 概要 |
|--------|------|------|
| `appendActivity` | async function | activityEvents テーブルにログ追加 |
| `appendReasonNote` | function | Task description に構造化された理由メモを追記 |
| `validateString` | function | 必須文字列バリデーション |
| `validateOptionalString` | function | オプション文字列バリデーション |
| `LANGUAGE_POLICY` | const | AI エージェント向け日本語出力ポリシー |
| `OUTPUT_FORMAT` | const | 出力タイプ別フォーマットテンプレート |
| `buildSystemPrompt` | function | System prompt 組み立て |

### 5.3 appendReasonNote フォーマット

```
[<LABEL> YYYY-MM-DD HH:MM] (ref:<refId>)
<reason text>
```

- description が既にある場合は `\n---\n` で区切って追記
- `refId` 指定時は同一 refId の二重追記を防止
- reason が空の場合は追記しない

---

## 6. フロントエンド設計

### 6.1 ページ一覧

| ルート | ファイル | 概要 |
|--------|----------|------|
| `/` | `page.tsx` | `/dashboard` へリダイレクト |
| `/dashboard` | `dashboard/page.tsx` | KPI カード + Top5 + ActivityFeed |
| `/decisions` | `decisions/page.tsx` | Decision 一覧（ステータス別タブ） |
| `/decisions/[id]` | `decisions/[id]/page.tsx` | Decision 詳細 + 承認/却下ボタン |
| `/tasks` | `tasks/page.tsx` | Kanban / List ビュー + ボード切り替え |
| `/tasks/new` | `tasks/new/page.tsx` | タスク作成フォーム |
| `/tasks/[id]` | `tasks/[id]/page.tsx` | タスク詳細（5 セクション構成） |
| `/goals` | `goals/page.tsx` | ゴール一覧 |
| `/goals/new` | `goals/new/page.tsx` | ゴール作成フォーム |
| `/goals/[id]` | `goals/[id]/page.tsx` | ゴール詳細（KPI / ボード / 成果物 / 判断） |
| `/goals/[id]/edit` | `goals/[id]/edit/page.tsx` | ゴール編集フォーム |
| `/outputs` | `outputs/page.tsx` | 成果物一覧 |
| `/outputs/new` | `outputs/new/page.tsx` | 成果物作成（taskId セレクター付き） |
| `/team` | `team/page.tsx` | Agent / User 管理 |
| `/runs` | `runs/page.tsx` | 実行ログ一覧 |
| `/gateways` | `gateways/page.tsx` | Gateway 一覧 |
| `/gateways/new` | `gateways/new/page.tsx` | Gateway 作成 |
| `/compliance` | `compliance/page.tsx` | コンプライアンスイベント |

### 6.2 共通コンポーネント

| コンポーネント | ファイル | 概要 |
|---------------|----------|------|
| `PageHeader` | `layout/page-header.tsx` | タイトル + description + action スロット |
| `Sidebar` | `layout/sidebar.tsx` | ナビゲーションサイドバー |
| `StatusBadge` | `shared/status-badge.tsx` | ステータス/優先度バッジ（label + colorClass） |
| `TimeAgo` | `shared/time-ago.tsx` | 相対時間表示（title に絶対時間） |
| `EmptyState` | `shared/empty-state.tsx` | 空状態表示（title + description + action） |
| `ActivityFeed` | `dashboard/activity-feed.tsx` | アクティビティイベント一覧 |
| `TaskCard` | `tasks/task-card.tsx` | タスクカード（クリックで詳細遷移） |
| `MoveStatusMenu` | `tasks/move-status-menu.tsx` | ステータス変更ドロップダウン |
| `BlockedReasonDialog` | `tasks/blocked-reason-dialog.tsx` | ブロック理由入力ダイアログ |
| `KanbanBoard` | `tasks/kanban-board.tsx` | Kanban ボード表示 |
| `ResolveDialog` | `decisions/resolve-dialog.tsx` | Decision 承認/却下ダイアログ |
| `GoalForm` | `goals/goal-form.tsx` | ゴール作成/編集フォーム |

### 6.3 Task 詳細ページ（`/tasks/[id]`）

**データ取得:**
```typescript
const task = useQuery(api.tasks.get, { id: taskId });
const goal = useQuery(api.goals.get, task ? { id: task.goalId } : "skip");
const outputs = useQuery(api.outputs.list, task ? { taskId: task._id, limit: 10 } : "skip");
const activities = useQuery(api.activityEvents.list, task ? { taskId: task._id, limit: 20 } : "skip");
const linkedDecision = useQuery(api.decisions.get,
  task?.latestDecisionId ? { id: task.latestDecisionId } : "skip"
);
```

**レイアウト（5 セクション）:**

```
┌─────────────────────────────────────────────────┐
│ PageHeader: task.title     [MoveStatusMenu][戻る]│
├─────────────────────────────────────────────────┤
│ Section 1: 基本情報 Card                         │
│   StatusBadge(status) + StatusBadge(priority)    │
│   Goal: リンク → /goals/[goalId]                 │
│   期限: formatDate(dueAt) or "N日 超過"          │
│   担当: type + ID or "未割当"                     │
│   作成: TimeAgo  更新: TimeAgo                    │
├─────────────────────────────────────────────────┤
│ Section 2: 説明 (whitespace-pre-wrap)            │
├─────────────────────────────────────────────────┤
│ Section 3: 関連判断 (latestDecisionId がある場合)  │
│   StatusBadge(decision.status) + title           │
│   [判断を表示 →]                                  │
├─────────────────────────────────────────────────┤
│ Section 4: 成果物                                 │
│   ヘッダー: "成果物" + [+ 成果物を登録]            │
│   Output リスト or EmptyState                     │
├─────────────────────────────────────────────────┤
│ Section 5: アクティビティ                         │
│   イベント一覧 (type icon + message + TimeAgo)   │
│   or EmptyState                                  │
└─────────────────────────────────────────────────┘
```

**エラー/空状態の方針:**
- 個別セクションのデータ取得失敗はそのセクション内にメッセージ表示
- ページ全体をクラッシュさせない
- `undefined` = ローディング（Skeleton）、`null` = Not Found

### 6.4 認証モデル（暫定）

Phase 1-2 では認証なし。`DefaultUserProvider` で DB 上の最初のユーザーをデフォルトとして使用。
`ResolveDialog` は `useDefaultUser()` で `resolvedByUserId` を取得。

---

## 7. 実装フェーズ

### Phase 1: 見える化基盤（完了）

| 要件 | 概要 | 状態 |
|------|------|------|
| ダッシュボード | KPI カード + Top5 + ActivityFeed | 完了 |
| Decision 承認 | `/decisions/[id]` で承認/却下/修正依頼 | 完了 |
| Task 状態遷移 | `transitionTaskStatus` で不変条件付き遷移 | 完了 |
| Kanban ビュー | ボード切り替え + ステータス列表示 | 完了 |
| 全 CRUD | Goals / Tasks / Outputs / Agents 等 | 完了 |
| Seed データ | 開発用初期データ投入 | 完了 |

### Phase 2: 導線・承認副作用・Task 詳細・Output 紐づけ（完了）

| ID | 要件 | 概要 | 状態 |
|----|------|------|------|
| R1 | 導線修正 | Dashboard Top5 → `/tasks/[id]` 直行 | 完了 |
| R2 | 承認副作用 | `decisions.resolve()` → Task 自動遷移 | 完了 |
| R3 | Task 詳細ページ | `/tasks/[id]` 新設（5 セクション構成） | 完了 |
| R4 | Output 紐づけ | `/outputs/new` に taskId セレクター | 完了 |

**変更ファイル:**

| ファイル | 種別 | 変更内容 |
|---------|------|---------|
| `convex/tasks.ts` | 変更 | `get` クエリ追加 |
| `convex/outputs.ts` | 変更 | `list` に `taskId` フィルター追加 |
| `convex/decisions.ts` | 変更 | `resolve` に Task 遷移副作用 + import 追加 |
| `src/app/tasks/[id]/page.tsx` | **新規** | Task 詳細ページ |
| `src/app/dashboard/page.tsx` | 変更 | Overdue Top5 リンクを `/tasks/${t._id}` に修正 |
| `src/components/tasks/task-card.tsx` | 変更 | クリック遷移 + stopPropagation |
| `src/app/outputs/new/page.tsx` | 変更 | taskId セレクター + searchParams + Suspense |

**設計判断:**

1. **`transitionTaskStatus` バイパス**: `decisions.resolve` 内で `ctx.db.patch` を直接使用。循環依存（resolve → transition → 新 Decision 生成）を防止
2. **CAS ガード**: `task.status === "waiting_decision"` を事前チェック。手動遷移済み/レース条件でも安全にスキップ
3. **`appendReasonNote` 統一**: reject 時の description 追記を `transitionTaskStatus` と同じヘルパーで統一。`refId` で重複追記防止

### Phase 2 受け入れテスト結果（2026-02-23）

| テスト | 内容 | 結果 |
|--------|------|------|
| A | Dashboard Overdue Top5 → `/tasks/<id>` 遷移 | PASS |
| B | TaskCard クリック → Task 詳細遷移 + MoveStatusMenu 非干渉 | PASS |
| C | Task 詳細「+ 成果物」→ `/outputs/new?taskId=&goalId=` プリフィル＆作成 | PASS |
| D | `in_progress → waiting_decision` で Decision 自動生成 | PASS |
| E-1 | Approve → Task `waiting_decision → in_progress` + Activity 2件 | PASS |
| E-2 | Reject → Task `waiting_decision → blocked` + description 追記 | PASS |
| F-1 | 二重 resolve 防止（`"Decision is not pending"` エラー） | PASS |
| F-2 | CAS ガード: Task が非 `waiting_decision` の場合 resolve しても Task 不変 | PASS |

---

## 8. 横断的関心事

### 8.1 Activity ログ

全 mutation で `appendActivity(ctx, { type, message, ...refs })` を呼び出し、`activityEvents` テーブルに記録。
Dashboard の ActivityFeed と Task/Goal 詳細のアクティビティセクションで表示。

**Activity タイプ一覧:**
`goal_created` | `goal_updated` | `task_created` | `task_updated` | `task_moved` |
`decision_created` | `decision_resolved` | `agent_created` | `agent_status_changed` |
`run_created` | `run_status_changed` | `output_created` | `compliance_created` |
`gateway_heartbeat` | `system_seed`

### 8.2 言語ポリシー

`LANGUAGE_POLICY` 定数で日本語出力を統一。UI ラベル・ステータス名・固有名詞は英語のまま。
AI エージェントの system prompt に必ず prepend する設計。

### 8.3 エラーハンドリング方針

- **Mutation エラー**: `try/catch` で捕捉し `toast.error()` で表示
- **Query null**: `useQuery` が `undefined`（ロード中）と `null`（存在しない）を区別
- **セクション独立**: 詳細ページの各セクションは個別にエラー/ローディングを処理。ページ全体をクラッシュさせない

### 8.4 スキーマ変更方針

Phase 1-2 ではスキーマ変更なし。既存インデックスのみで運用。
スキーマ変更が必要な場合は Phase 3 以降で検討。

---

## 9. 既知の制約と技術的負債

| 項目 | 説明 | 対応予定 |
|------|------|---------|
| Dashboard 全件集計 | `allTasks` を collect → メモリ集計。スケール時ボトルネック | Phase 3: materialized count |
| description 肥大化 | reject 繰り返しで appendReasonNote が蓄積 | Phase 3: blocked 理由の構造化（専用テーブル） |
| Assignee 名前解決 | Task 詳細で type + ID のみ表示。User/Agent 名は未解決 | Phase 3: `tasks.getWithRelations` |
| 認証なし | DefaultUserProvider で最初のユーザーを使用 | Phase 3+: 認証・認可 |
| E2E テストなし | 手動テスト + Convex CLI で検証 | Phase 3: Playwright 導入 |
| Kanban D&D | 現在はドロップダウンでの移動のみ | Phase 3+: ドラッグ&ドロップ |

---

## 10. Phase 3 候補

| 優先度 | 項目 | 概要 |
|--------|------|------|
| 高 | E2E テスト基盤 | Playwright 導入。Phase 2 の A〜F シナリオを自動化 |
| 高 | blocked 理由の構造化 | 専用テーブル `taskBlockReasons` への移行。タイムライン表示 |
| 中 | Task Assignee 名前解決 | User/Agent join で displayName を表示 |
| 中 | Output 詳細ページ | `/outputs/[id]` 新設 |
| 中 | Task 編集ページ | `/tasks/[id]/edit` で title/description/priority/dueAt 編集 |
| 低 | Materialized counts | Dashboard 集計をインクリメンタルカウンターに置換 |
| 低 | 外部連携 | Slack/Email 通知（Feature Flag 制御） |
| 低 | 認証・認可 | ユーザー認証と Role ベースアクセス制御 |

---

## 11. ロールバック計画

### Phase 2 個別ロールバック

| 要件 | 手順 |
|------|------|
| R1 (Dashboard リンク) | `dashboard/page.tsx` の `router.push` を `/tasks` に戻す |
| R2 (承認副作用) | `decisions.ts` の副作用ブロック削除 + import 復元 |
| R3 (Task 詳細) | `src/app/tasks/[id]/` ディレクトリ削除 + TaskCard/Dashboard リンク復元 |
| R4 (Output 紐づけ) | `outputs/new` から taskId 関連コード削除 + `outputs.list` から taskId 引数削除 |

### 全体ロールバック

1. Phase 2 コミットを `git revert`
2. `npx convex dev` で型再生成
3. 既存ページの動作確認

**データへの影響:**
- スキーマ変更なし → マイグレーション不要
- 承認副作用で遷移済みの Task はロールバック後も新ステータスのまま（手動遷移と等価で問題なし）
- taskId 付きで作成された Output も既存スキーマに存在するフィールドのため問題なし
