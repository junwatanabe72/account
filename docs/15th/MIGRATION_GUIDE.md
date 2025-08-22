# カラースキーム統一 - 移行ガイド

## 概要
このドキュメントは、既存のコードベースを新しい統一カラースキームシステムに移行するためのガイドです。

## 移行完了状況

### ✅ 完了済み
1. **テーマシステムの実装**
   - `/src/styles/theme/` ディレクトリ構造の作成
   - カラー定義、CSS変数、ThemeProvider、Bootstrap統合の実装

2. **App.tsxへの統合**
   - ThemeProviderの適用
   - Bootstrap overridesの適用
   - テーマスイッチャーの追加

3. **コンポーネントの更新**
   - ✅ UnifiedInputForm - 収入・支出・振替ボタンにセマンティックカラー適用
   - ✅ LedgerView - ステータスバッジにセマンティックカラー適用
   - ✅ IncomeExpenseReport - 収入・支出合計にセマンティックカラー適用

4. **CSSファイルの更新**
   - ✅ App.css - CSS変数使用に更新
   - ✅ index.css - CSS変数使用に更新

### ⏳ 残作業
- DivisionStatementsPanel コンポーネントの更新
- DetailViews コンポーネントの更新
- AuxiliaryLedgerView コンポーネントの更新

## 移行手順

### 1. 新規コンポーネントの場合

#### TypeScript/React
```typescript
import { useSemanticColor, useTheme } from '@/styles/theme';

function MyComponent() {
  // セマンティックカラーの使用
  const incomeColor = useSemanticColor('income');
  const expenseColor = useSemanticColor('expense');
  
  // テーマコンテキストの使用
  const { colors, isDark } = useTheme();
  
  return (
    <div style={{ 
      color: colors.system.text.primary,
      backgroundColor: colors.system.background.primary 
    }}>
      <span style={{ color: incomeColor }}>収入</span>
      <span style={{ color: expenseColor }}>支出</span>
    </div>
  );
}
```

#### CSS/スタイル
```css
.my-component {
  /* システムカラー */
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
}

/* セマンティックカラー */
.income-text {
  color: var(--color-semantic-income);
}

.expense-text {
  color: var(--color-semantic-expense);
}
```

### 2. 既存コンポーネントの移行

#### Before（ハードコード）
```typescript
<Button variant="success">収入</Button>
<Button variant="danger">支出</Button>
<span style={{ color: '#28a745' }}>¥10,000</span>
```

#### After（テーマシステム）
```typescript
<Button className="btn-income">収入</Button>
<Button className="btn-expense">支出</Button>
<span className="text-semantic-income">¥10,000</span>
```

### 3. Bootstrapコンポーネントとの統合

#### 標準Bootstrapバリアント（変更不要）
```jsx
<Button variant="primary">プライマリ</Button>
<Alert variant="success">成功</Alert>
<Badge bg="warning">警告</Badge>
```

#### カスタムセマンティックバリアント（新規）
```jsx
<Button className="btn-income">収入追加</Button>
<Alert className="alert-expense">支出警告</Alert>
<Badge className="badge-pending">保留中</Badge>
```

## カラーマッピング表

### 旧カラー → 新カラー変数

| 旧カラー | 新CSS変数 | 用途 |
|---------|----------|------|
| `#0056b3` | `var(--color-primary)` | プライマリカラー |
| `#28a745` | `var(--color-semantic-income)` | 収入 |
| `#dc3545` | `var(--color-semantic-expense)` | 支出 |
| `#007bff` | `var(--color-semantic-transfer)` | 振替 |
| `#ffc107` | `var(--color-semantic-pending)` | 保留中 |
| `#333` | `var(--color-text-primary)` | 主要テキスト |
| `#888` | `var(--color-text-muted)` | ミュートテキスト |
| `#f8f9fa` | `var(--color-bg-secondary)` | 背景（セカンダリ） |
| `#dee2e6` | `var(--color-border-light)` | ボーダー（ライト） |

## 利用可能なセマンティックカラー

### 会計システム固有
- `income` - 収入（緑）
- `expense` - 支出（赤）
- `transfer` - 振替（青）
- `balance` - 残高（グレー）
- `pending` - 保留中（黄）
- `approved` - 承認済み（緑）
- `rejected` - 却下（赤）

### Bootstrap互換
- `primary` - プライマリ
- `secondary` - セカンダリ
- `success` - 成功
- `danger` - 危険
- `warning` - 警告
- `info` - 情報
- `light` - ライト
- `dark` - ダーク

## テーマ切り替え

アプリケーションのナビゲーションバーにテーマスイッチャーが追加されています：
- ☀️ ライトテーマ
- 🌙 ダークテーマ
- 🔄 自動（システム設定に従う）

設定はLocalStorageに保存され、リロード後も維持されます。

## トラブルシューティング

### 問題: カラーが適用されない
**解決策**: 
1. ThemeProviderがアプリのルートにあることを確認
2. CSS変数が正しく定義されているか、ブラウザのDevToolsで確認
3. クラス名のタイポをチェック

### 問題: ダークモードが機能しない
**解決策**:
1. body要素に`theme-dark`クラスが追加されているか確認
2. CSS変数が切り替わっているか確認
3. LocalStorageの`theme`キーをチェック

### 問題: Bootstrapコンポーネントの色が変わらない
**解決策**:
1. `injectBootstrapOverrides()`が呼ばれているか確認
2. カスタムクラス名（`btn-income`など）を使用しているか確認

## ベストプラクティス

1. **新規開発**: 必ずテーマシステムを使用
2. **カラーのハードコード禁止**: CSS変数またはTheme Hooksを使用
3. **セマンティックな命名**: 色の用途に基づいた名前を使用（`income`、`expense`など）
4. **一貫性の維持**: 同じ用途には同じカラー変数を使用
5. **アクセシビリティ**: コントラスト比を確保（WCAG AA基準）

## サポート

問題が発生した場合は、以下を確認してください：
1. `/src/styles/theme/examples.tsx` - 使用例
2. `/mockup/account/docs/15th/IMPLEMENTATION_DETAILS.md` - 実装詳細
3. ブラウザのコンソールエラー
4. CSS変数の定義状況（DevTools）