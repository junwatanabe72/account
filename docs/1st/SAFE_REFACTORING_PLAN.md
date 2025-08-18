# 安全なリファクタリング実行計画

*作成日: 2025-08-19*  
*目的: コードを壊さずに段階的にアーキテクチャを改善する*

## 🎯 基本方針

1. **一度に1つの変更のみ**
2. **各変更後に必ず動作確認**
3. **全ての変更をコミット**
4. **問題発生時は即座にロールバック**
5. **既存の機能を維持しながら改善**

---

## 📝 Phase 0: 準備段階（必須）

### Step 0.1: 現状の動作確認とベースライン確立
```bash
# 1. 現在のブランチを保護
git checkout -b refactor/architecture-improvement
git push -u origin refactor/architecture-improvement

# 2. 現在の動作を記録
npm run dev
# → 主要機能の動作確認とスクリーンショット取得
# - 仕訳入力
# - 帳票表示
# - データ保存/読込

# 3. 初期コミット
git add .
git commit -m "feat: リファクタリング開始前のベースライン"
```

### Step 0.2: テスト環境の準備
```bash
# 1. テストフレームワークのインストール（未導入の場合）
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# 2. 基本的なスモークテストの作成
```

```typescript
// src/__tests__/smoke.test.ts
import { describe, it, expect } from 'vitest'
import { AccountingEngine } from '../domain/accountingEngine'

describe('Smoke Tests', () => {
  it('AccountingEngineが初期化できる', () => {
    const engine = new AccountingEngine()
    expect(engine).toBeDefined()
    expect(engine.accounts).toBeDefined()
  })
  
  it('仕訳が作成できる', () => {
    const engine = new AccountingEngine()
    const result = engine.createJournal({
      date: '2024-01-01',
      description: 'テスト仕訳',
      details: [
        { accountCode: '101', debitAmount: 1000, creditAmount: 0 },
        { accountCode: '201', debitAmount: 0, creditAmount: 1000 }
      ]
    })
    expect(result.success).toBe(true)
  })
})
```

```bash
# 3. テスト実行確認
npm test

# 4. コミット
git add .
git commit -m "test: 基本的なスモークテストを追加"
```

---

## 🔄 Phase 1: 循環依存の解消（最優先）

### Step 1.1: 依存関係の可視化
```bash
# 1. 依存関係分析ツールのインストール
npm install --save-dev madge

# 2. 循環依存の検出
npx madge --circular src/

# 3. 依存関係グラフの生成
npx madge --image graph.svg src/domain/services/

# 4. 結果をドキュメント化
```

```markdown
# docs/DEPENDENCY_MAP.md
## 循環依存リスト
1. AccountService ↔ JournalService
2. TransactionService → JournalService → AccountService → TransactionService
```

```bash
# 5. コミット
git add docs/DEPENDENCY_MAP.md graph.svg
git commit -m "docs: 依存関係マップを作成"
```

### Step 1.2: 最小の循環依存を1つ解消

#### 1.2.1: インタフェースの作成（既存コードは変更しない）
```typescript
// src/domain/interfaces/IAccountService.ts
export interface IAccountService {
  getAccount(code: string): HierarchicalAccount | undefined
  getAccounts(): HierarchicalAccount[]
  // 必要最小限のメソッドのみ定義
}

// src/domain/interfaces/IJournalService.ts  
export interface IJournalService {
  createJournal(data: any, options?: any): CreateJournalResult
  getJournals(): Journal[]
  // 必要最小限のメソッドのみ定義
}
```

```bash
# コミット
git add src/domain/interfaces/
git commit -m "feat: サービスインタフェースを追加（既存コード変更なし）"

# 動作確認
npm run dev
# → 画面が正常に表示されることを確認
```

#### 1.2.2: AccountServiceの依存を段階的に変更
```typescript
// src/domain/services/AccountService.ts
// 変更前をコメントで残す
export class AccountService implements IAccountService {
  // private journalService: JournalService // 削除前
  private journalService?: IJournalService // 段階的に変更
  
  constructor(journalService?: IJournalService) {
    this.journalService = journalService
  }
  
  // メソッドは変更しない
}
```

```bash
# コミット
git add src/domain/services/AccountService.ts
git commit -m "refactor: AccountServiceの依存をインタフェースに変更"

# 動作確認
npm run dev
npm test
# → 全機能が正常動作することを確認
```

### Step 1.3: 変更の検証

```typescript
// src/__tests__/refactoring/phase1.test.ts
describe('Phase 1: 循環依存解消の検証', () => {
  it('AccountServiceが独立して初期化できる', () => {
    const accountService = new AccountService()
    expect(accountService).toBeDefined()
  })
  
  it('AccountingEngineが正常に動作する', () => {
    const engine = new AccountingEngine()
    const accounts = engine.getAccounts()
    expect(accounts).toBeDefined()
  })
})
```

```bash
# テスト実行
npm test

# 全て成功したらコミット
git commit -m "test: Phase 1の検証テストを追加"
```

---

## 🔨 Phase 2: AccountingEngineの責務分離

### Step 2.1: 責務の分析とグルーピング

```typescript
// docs/RESPONSIBILITY_ANALYSIS.md
/*
AccountingEngineの責務分析:
1. 勘定科目管理 → AccountManagement
2. 仕訳管理 → JournalManagement  
3. レポート生成 → ReportGeneration
4. データ入出力 → DataPorting
5. 補助元帳 → AuxiliaryManagement
*/
```

### Step 2.2: 最小の責務から分離（データを壊さない）

#### 2.2.1: レポート機能を別クラスに（Facadeパターン）
```typescript
// src/domain/facades/ReportFacade.ts
export class ReportFacade {
  constructor(private engine: AccountingEngine) {}
  
  getTrialBalance() {
    return this.engine.getTrialBalance()
  }
  
  getBalanceSheet() {
    return this.engine.getBalanceSheet()
  }
  
  getIncomeStatement() {
    return this.engine.getIncomeStatement()
  }
}
```

```bash
# コミット
git add src/domain/facades/ReportFacade.ts
git commit -m "feat: ReportFacadeを追加（既存機能の委譲）"

# 動作確認
npm run dev
# → レポート機能が正常動作
```

#### 2.2.2: UIコンポーネントで新Facadeを使用（段階的移行）
```typescript
// src/ui/statements/BalanceSheetView.tsx
import { ReportFacade } from '../../domain/facades/ReportFacade'

export const BalanceSheetView: React.FC<{ engine: AccountingEngine }> = ({ engine }) => {
  // 段階的に移行
  const reportFacade = new ReportFacade(engine)
  const bs = reportFacade.getBalanceSheet() // 新しい方法
  // const bs = engine.getBalanceSheet() // 古い方法（コメントで残す）
  
  // 以下変更なし
}
```

```bash
# コミット
git add src/ui/statements/BalanceSheetView.tsx
git commit -m "refactor: BalanceSheetViewでReportFacadeを使用"

# 動作確認
npm run dev
# → 貸借対照表が正常表示
```

---

## ✅ チェックリスト（各ステップで確認）

### 変更前チェック
- [ ] 現在の動作を確認した
- [ ] gitでクリーンな状態である
- [ ] テストが全て通っている

### 変更実施チェック
- [ ] 1つの小さな変更のみ行った
- [ ] 古いコードをコメントで残した
- [ ] 変更内容が明確である

### 変更後チェック
- [ ] アプリケーションが起動する
- [ ] 主要機能が動作する
- [ ] テストが全て通る
- [ ] コミットメッセージが明確

### 問題発生時の対処
```bash
# 直前のコミットに戻る
git reset --hard HEAD~1

# または特定のコミットに戻る
git log --oneline -10  # 履歴確認
git reset --hard <commit-hash>

# リモートも戻す場合（慎重に）
git push --force-with-lease
```

---

## 📊 進捗管理

### Phase 1: 循環依存解消
- [x] Step 1.1: 依存関係の可視化
- [ ] Step 1.2: AccountService ↔ JournalService
- [ ] Step 1.3: その他の循環依存
- [ ] Step 1.4: 全体テスト

### Phase 2: 責務分離
- [ ] Step 2.1: 責務分析
- [ ] Step 2.2: ReportFacade分離
- [ ] Step 2.3: DataPortingFacade分離
- [ ] Step 2.4: 全体整合性確認

### Phase 3: レイヤー分離
- [ ] Step 3.1: インタフェース層の準備
- [ ] Step 3.2: ドメイン層の整理
- [ ] Step 3.3: インフラ層の分離
- [ ] Step 3.4: 統合テスト

---

## 🚀 次のアクション

1. **まずPhase 0を完全に実施**
   - 現在の動作を記録
   - テスト環境を準備
   - ベースラインをコミット

2. **Phase 1から順番に実施**
   - 各ステップは30分以内で完了できる大きさに
   - 必ず動作確認してからコミット

3. **週次でレビュー**
   - 進捗確認
   - 問題点の洗い出し
   - 計画の調整

---

## 🛡️ リスク管理

### リスク軽減策
1. **Feature Flagの活用**
```typescript
// src/config/features.ts
export const FEATURES = {
  USE_NEW_REPORT_FACADE: false,  // 段階的に true に
  USE_INTERFACE_INJECTION: false,
}
```

2. **並行実装パターン**
```typescript
// 新旧両方を維持
if (FEATURES.USE_NEW_REPORT_FACADE) {
  // 新しい実装
} else {
  // 既存の実装
}
```

3. **ロールバック手順書**
- 各Phaseごとにロールバック手順を文書化
- データベックアップの取得
- ユーザーへの通知準備

---

*このドキュメントは生きたドキュメントとして、進捗に応じて更新してください*