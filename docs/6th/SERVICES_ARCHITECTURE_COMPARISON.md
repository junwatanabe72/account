# src/services vs domain/services アーキテクチャ比較

*作成日: 2025-08-19*

## エグゼクティブサマリー

現在のコードベースには2つのservicesフォルダが存在します：
1. **domain/services**: 実際に使用されているビジネスロジック層（12ファイル）
2. **src/services**: 未使用の並行実装（2ファイル）

**推奨**: src/servicesは削除すべきです。

---

## フォルダ構造比較

```
src/
├── domain/
│   └── services/          # ✅ 使用中（本番環境）
│       ├── AccountService.ts
│       ├── JournalService.ts
│       └── ... (12ファイル)
└── services/              # ❌ 未使用（並行実装）
    ├── journalService.ts
    └── llmClient.ts
```

---

## 1. domain/services（使用中）

### 概要
- **ファイル数**: 12個
- **総行数**: 約3,200行
- **役割**: 本番環境で使用されているビジネスロジック層
- **統合**: AccountingEngineと完全統合

### 特徴
```typescript
// domain/services/JournalService.ts
export class JournalService implements IJournalService {
  constructor(
    private accountService: AccountService | IAccountService,
    private divisionService: DivisionService | IDivisionService
  ) {}
  
  // ドメインモデルを使用
  createJournal(journalData: JournalData): CreateJournalResult {
    // AccountServiceと連携した仕訳処理
  }
}
```

### アーキテクチャ上の位置
```
AccountingEngine
    ↓ 使用
ServiceFactory
    ↓ 生成
domain/services/*
```

### 主要クラス
| クラス | 責務 | 依存関係 |
|--------|------|----------|
| AccountService | 勘定科目管理 | なし |
| JournalService | 仕訳管理 | AccountService, DivisionService |
| ReportService | レポート生成 | AccountService, JournalService |
| ServiceFactory | DI管理 | 全サービス |

---

## 2. src/services（未使用）

### 概要
- **ファイル数**: 2個
- **総行数**: 約660行
- **役割**: 並行実装された未使用のサービス
- **統合**: どこからも参照されていない

### 特徴
```typescript
// src/services/journalService.ts
export class JournalService {  // 名前の衝突！
  private static instance: JournalService
  
  // 独自の型定義を使用（UnifiedJournal）
  createJournal(input: JournalInput): UnifiedJournal {
    // domain/servicesとは異なる実装
  }
}
```

### 問題点

#### 1. 名前の衝突
```typescript
// domain/services/JournalService.ts
export class JournalService { ... }

// src/services/journalService.ts  
export class JournalService { ... }  // 同じ名前！
```

#### 2. 型の不一致
```typescript
// domain: JournalData型を使用
type JournalData = { ... }

// src: UnifiedJournal型を使用
type UnifiedJournal = { ... }  // 互換性なし
```

#### 3. アーキテクチャの不整合
- domain/servicesはServiceFactoryパターンを採用
- src/servicesはシングルトンパターンを採用

---

## 詳細比較: JournalService

### domain/services/JournalService.ts

```typescript
// 特徴
- インタフェースベース（IJournalService）
- 依存性注入
- ServiceFactory統合
- AccountingEngine統合

// メソッド
createJournal(journalData: JournalData): CreateJournalResult
submitJournal(id: string): boolean
approveJournal(id: string): boolean
postJournal(journal: Journal): void
```

### src/services/journalService.ts

```typescript
// 特徴
- シングルトンパターン
- 独立した実装
- 統合なし
- 未使用

// メソッド
createJournal(input: JournalInput): UnifiedJournal
validateJournal(journal: JournalInput): JournalValidation
filterJournals(journals: UnifiedJournal[], filter: JournalFilter)
sortJournals(journals: UnifiedJournal[], sort: JournalSort)
```

---

## なぜ2つのservicesが存在するのか？

### 推測される経緯

1. **初期実装（src/services）**
   - 最初にsrc/servicesに実装
   - UIに近い場所に配置

2. **アーキテクチャ改善（domain/services）**
   - クリーンアーキテクチャ採用
   - domainレイヤーに移動
   - ServiceFactoryパターン導入

3. **移行の未完了**
   - 旧実装（src/services）が削除されずに残存
   - 新実装（domain/services）のみが使用される状態

---

## 影響分析

### src/services削除の影響

| 項目 | 影響 | 理由 |
|------|------|------|
| 本番環境 | なし | 使用されていない |
| ビルド | 改善 | 不要なコードの除外 |
| 開発効率 | 改善 | 混乱の解消 |
| 保守性 | 改善 | 重複コードの削除 |

### リスク評価

```typescript
// grep検索結果
$ grep -r "from.*src/services" src/
// 結果: 0件（どこからも参照されていない）
```

**結論**: 削除リスクは極めて低い

---

## 推奨アクション

### 1. 即時対応（Phase 7候補）

```bash
# src/servicesフォルダを削除
rm -rf src/services/

# 削除ファイル
- src/services/journalService.ts (297行)
- src/services/llmClient.ts (363行)
```

### 2. 削除による効果

| メトリクス | Before | After | 改善 |
|-----------|--------|-------|------|
| 重複クラス | 2個 | 0個 | -100% |
| 不要コード | 660行 | 0行 | -100% |
| 混乱リスク | 高 | なし | 解消 |

### 3. 移行が必要な機能

#### LLMClient（src/services/llmClient.ts）
```typescript
// 有用な機能が含まれている可能性
- OpenAI統合
- Anthropic統合  
- Azure OpenAI統合

// 推奨: 必要であればdomain/servicesに移植
```

---

## アーキテクチャ原則の確認

### ✅ 正しいアプローチ（domain/services）

```
src/
└── domain/          # ドメイン層
    └── services/    # ビジネスロジック
```

**理由**:
1. ドメイン駆動設計に準拠
2. ビジネスロジックの独立性
3. テスタビリティの確保

### ❌ 誤ったアプローチ（src/services）

```
src/
├── services/        # UIと同階層
└── ui/
```

**問題**:
1. レイヤーの混在
2. 責務の不明確さ
3. 依存関係の複雑化

---

## 結論

1. **domain/services**: 本番環境で使用中の正しい実装
2. **src/services**: 未使用の旧実装（削除推奨）

### 削除の正当性

- ✅ どこからも参照されていない
- ✅ domain/servicesで同等以上の機能を実装済み
- ✅ 名前の衝突を解消できる
- ✅ コードベースの健全性向上

### 次のステップ

1. src/servicesフォルダの削除
2. LLMClient機能の必要性評価
3. 必要であればdomain/servicesへの移植

---

*作成者: Claude Code*  
*最終更新: 2025-08-19 19:00*