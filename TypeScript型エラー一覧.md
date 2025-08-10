# TypeScript型エラー一覧

## 概要
このドキュメントは、マンション管理組合会計エンジンのTypeScript型チェックで検出されているエラーの一覧です。アプリケーションは正常に動作し、ビルドも成功していますが、より厳密な型安全性を求める場合は、以下のエラーを修正することを推奨します。

## エラー統計
- 総エラー数: 26個
- 影響ファイル数: 9個

## エラー分類

### 1. TrialBalance型の不整合 (7件)
**影響ファイル**: `src/ui/TrialBalanceView.tsx`, `src/ui/ExportPanel.tsx`

**問題**: TrialBalance型の定義と実際の使用が一致していない
- `accounts`プロパティが型定義に存在しない
- `isBalanced`プロパティが型定義に存在しない

**影響度**: 中
**解決方法**: 
- TrialBalance型の定義を実装に合わせて拡張する
- または、実装側を型定義に合わせて修正する

### 2. 暗黙的any型 (7件)
**影響ファイル**: `src/ui/TrialBalanceView.tsx`, `src/ui/ExportPanel.tsx`, `src/ui/DivisionAccountingView.tsx`

**問題**: パラメータの型が明示的に定義されていない
```typescript
// 例: Parameter 'a' implicitly has an 'any' type
.sort((a, b) => ...)  // aとbの型が未定義
```

**影響度**: 低
**解決方法**: パラメータに適切な型注釈を追加

### 3. Map型とArray型の不整合 (2件)
**影響ファイル**: `src/ui/UnitOwnersEditor.tsx`, `src/ui/SampleDataPanel.tsx`

**問題**: `Map<string, any>`型を`UnitOwner[]`型に代入しようとしている

**影響度**: 高
**解決方法**: 
- Map型をArray型に変換する処理を追加
- または、データ構造を統一する

### 4. ERROR_MESSAGESの未定義プロパティ (2件)
**影響ファイル**: `src/utils/errorHandler.ts`

**問題**: `VALIDATION_ERROR`がERROR_MESSAGES定数に存在しない

**影響度**: 低
**解決方法**: ERROR_MESSAGES定数に`VALIDATION_ERROR`を追加

### 5. その他の型定義問題 (8件)
- `HierarchicalAccount`型に`level`プロパティが存在しない
- `ClosingPanel`での戻り値の型不整合
- `ChartOfAccountsPanel`での`null`と`undefined`の扱い
- `DivisionAccountingView`での関数呼び出しの型エラー

## 推奨される対応

### 優先度: 高
1. Map型とArray型の不整合を修正
2. TrialBalance型の定義を実装に合わせて拡張

### 優先度: 中
3. ERROR_MESSAGES定数の更新
4. null/undefinedの扱いを統一

### 優先度: 低
5. 暗黙的any型への型注釈追加
6. その他の細かい型定義の調整

## 型チェックの実行方法
```bash
# 型チェックのみ実行
npm run typecheck

# ビルド（型チェックはスキップ）
npm run build
```

## 注意事項
- これらのエラーは、TypeScriptの`strict`モードと`noUncheckedIndexedAccess`オプションが有効になっているために検出されています
- アプリケーションの動作には影響しません
- 段階的に修正することを推奨します

## 今後の改善提案
1. 型定義ファイル（types.ts）の整理と統一
2. 既存コードベースの型定義を実装に合わせて更新
3. 新規開発時は型安全性を意識したコーディング
4. 型チェックをCIに組み込み、段階的に改善