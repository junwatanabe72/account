# TypeScript型定義リファクタリングガイド

## 概要
このドキュメントは、アカウンティングシステムのTypeScript型定義を整理し、循環参照を解消するためのガイドラインです。

## アーキテクチャ原則

### 1. レイヤー構造の維持
```
types/          # 共通型定義
  ├── accounting.ts    # 会計ドメインの基本型
  ├── services.ts      # サービス層の共通型（新規追加）
  └── index.ts         # エクスポート集約

domain/
  ├── interfaces/      # 抽象インターフェース
  │   ├── IAccountService.ts
  │   ├── IJournalService.ts
  │   ├── IDivisionService.ts
  │   └── adapters.ts  # 新旧インターフェース変換
  └── services/        # 具象実装
```

### 2. 依存関係の方向
- インターフェースは型定義のみに依存
- 実装クラスはインターフェースに依存
- 循環参照を避ける

## 型定義の分類

### 基本型（types/accounting.ts）
- `AccountType`, `NormalBalance`, `JournalStatus`, `DivisionCode`
- `AccountDefinition`, `JournalData`, `CreateJournalResult`

### サービス層共通型（types/services.ts）
- `HierarchicalAccountInterface`
- `JournalInterface`
- `AccountingDivisionInterface`
- `OperationResult<T>`
- `JournalOperationResult`
- `StatusChangeResult`

## 段階的移行戦略

### Phase 1: 型定義の整理（完了）
- [x] 共通型定義ファイルの作成
- [x] インターフェースの循環参照解消
- [x] 新インターフェース（V2）の作成
- [x] アダプターパターンの実装

### Phase 2: 実装の調整（進行中）
- [ ] Mockクラスの型修正
- [ ] ServiceFactoryの型安全性向上
- [ ] テストコードの修正

### Phase 3: 完全移行（計画）
- [ ] レガシーインターフェースの廃止
- [ ] V2インターフェースへの統一
- [ ] 型定義の最適化

## 型エラー解決方法

### 1. CreateJournalResult型の不整合
**問題**: `data`と`journal`プロパティの混在

**解決策**:
```typescript
// 統一された型定義
export interface CreateJournalResult {
  success: boolean
  errors?: string[]
  journal?: Journal  // 'data'ではなく'journal'を使用
}
```

### 2. インターフェースと実装の不一致
**問題**: 戻り値型の不整合（boolean vs CreateJournalResult）

**解決策**:
```typescript
// インターフェースで柔軟な型定義
submitJournal?(id: string): CreateJournalResult | boolean

// 実装では一貫した型を返す
submitJournal(id: string): CreateJournalResult {
  // ...
  return { success: true, journal: journal }
}
```

### 3. 具象型への依存
**問題**: インターフェース型では不十分な場合

**解決策**:
```typescript
// instanceof チェックで安全に具象型を使用
if (this.services.accountService instanceof AccountService) {
  // AccountService特有のメソッドを使用
  this.services.accountService.rebuildAccountsFrom(defs)
} else {
  throw new Error('Operation requires AccountService implementation')
}
```

## コーディング規約

### 1. インターフェース命名
- 基本インターフェース: `I[Service]Service`
- 拡張インターフェース: `I[Service]ServiceExtended`
- 新バージョン: `I[Service]ServiceV2`

### 2. 型定義の配置
- ドメイン固有の型: `types/accounting.ts`
- サービス共通の型: `types/services.ts`
- UI関連の型: `types/ui.ts`

### 3. import/export
```typescript
// 循環参照を避ける
// ✗ 悪い例
import { Journal } from '../services/JournalService'

// ✓ 良い例
import { JournalInterface } from '../../types/services'
```

## トラブルシューティング

### 型チェックの実行
```bash
npm run typecheck
```

### よくあるエラーと対処法

1. **"Object is possibly 'undefined'"**
   - オプショナルチェイニング（`?.`）を使用
   - null チェックを追加

2. **"Type 'X' is not assignable to type 'Y'"**
   - 型定義の不一致を確認
   - 必要に応じて型アサーション（`as`）を使用

3. **"Module has no exported member"**
   - エクスポート漏れを確認
   - index.ts での再エクスポートを追加

## ベストプラクティス

### 1. 高可用性の維持
- 破壊的変更を避ける
- 段階的な移行パスを提供
- 後方互換性を維持

### 2. 型安全性の向上
- any型の使用を最小限に
- ジェネリクスを活用
- 厳密な型チェックを有効化

### 3. 保守性の確保
- 型定義にコメントを追加
- 一貫した命名規則
- 適切なディレクトリ構造

## 今後の改善計画

1. **型定義の自動生成**
   - JSON Schemaからの型生成
   - OpenAPI仕様からの型生成

2. **実行時型チェック**
   - io-ts または zod の導入
   - バリデーションの強化

3. **テストカバレッジ**
   - 型定義のテスト追加
   - 型の整合性チェック

## 参考資料

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Design Patterns in TypeScript](https://refactoring.guru/design-patterns/typescript)