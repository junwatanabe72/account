# カラースキーム統一設計書

## 1. 現状分析

### 1.1 問題点
現在のコードベースでは、カラー定義が複数の場所に分散しており、以下の問題が発生しています：

- **一貫性の欠如**: 同じ目的の色が異なる値で定義されている
- **保守性の低下**: 色を変更する際に複数箇所の修正が必要
- **重複と冗長性**: 類似した色が複数定義されている
- **型安全性の欠如**: TypeScriptでの色の管理が不十分

### 1.2 現在のカラー定義箇所

#### A. Board Management System (ダークテーマ)
**ファイル**: `/mockup/src/board_minutes/Board Management/styles.css`

```css
:root {
  --bg: #0f172a        /* ダークスレート背景 */
  --panel: #111827     /* パネル背景 */  
  --muted: #94a3b8     /* ミュートグレーテキスト */
  --text: #e5e7eb      /* プライマリライトテキスト */
  --accent: #22c55e    /* グリーンアクセント */
  --danger: #ef4444    /* エラー/危険 */
  --warn: #f59e0b      /* 警告 */
  --link: #38bdf8      /* リンク */
}
```

#### B. Account Management System (Bootstrap基盤)
**ファイル**: `/mockup/account/src/ui/styles/theme.css`

```css
:root {
  --primary: #0056b3
  --primary-light: #4d94ff  
  --primary-dark: #003d82
  --secondary: #6c757d
  --success: #28a745
  --danger: #dc3545
  --warning: #ffc107
  --info: #17a2b8
}
```

#### C. Building Owner SaaS (Material-UI)
**ファイル**: `/mockup/kunishio/building-owner-saas/src/App.tsx`

```typescript
palette: {
  primary: { main: '#1976d2' },
  secondary: { main: '#dc004e' },
}
```

#### D. HTMLモックアップ (インラインスタイル)
複数のHTMLファイルに散在：
- 背景色: `#f0f0f0`, `#e9e9e9`, `#f9f9f9`
- ボーダー: `#ccc`, `#ddd`, `#eee`
- テキスト: `#333`, `#888`

### 1.3 主要な不整合

1. **プライマリブルーの複数バリエーション**
   - `#0056b3` (Account system)
   - `#1976d2` (Material-UI)
   - `#007bff` (Bootstrap default)
   - `#38bdf8` (Board system)

2. **エラー/危険色の不一致**
   - `#dc3545` (Account system)
   - `#ef4444` (Board system)
   - `#dc004e` (Material-UI secondary)

3. **成功/グリーン色の不一致**
   - `#28a745` (Account system)
   - `#22c55e` (Board system)
   - `#16a34a` (Board system buttons)

## 2. 統一アーキテクチャ設計

### 2.1 設計方針

1. **単一の信頼できる情報源 (Single Source of Truth)**
   - すべてのカラー定義を一箇所で管理

2. **型安全性**
   - TypeScriptによる型定義でコンパイル時チェック

3. **パフォーマンス重視**
   - CSS変数によるブラウザネイティブのパフォーマンス
   - JavaScriptのオーバーヘッドなし

4. **段階的移行**
   - 既存コードとの互換性を保ちながら段階的に移行

5. **テーマ対応**
   - ライトテーマ、ダークテーマの切り替え対応
   - ランタイムでのテーマ変更

### 2.2 ファイル構造

```
/accounting-system/src/styles/theme/
├── colors.ts              # コアカラー定義とユーティリティ
├── cssVariables.ts        # CSS変数の生成と管理
├── ThemeProvider.tsx      # Reactコンテキストによるテーマ管理
├── bootstrapOverrides.ts  # Bootstrap統合レイヤー
├── index.ts              # パブリックAPIとエクスポート
└── examples.tsx          # 使用例とパターン
```

### 2.3 カラーシステム構造

#### A. ブランドカラー
```typescript
const brandColors = {
  primary: {
    50: '#e6f0ff',
    100: '#b3d1ff',
    200: '#80b3ff',
    300: '#4d94ff',
    400: '#1a75ff',
    500: '#0056b3',  // メインカラー
    600: '#004590',
    700: '#003d82',
    800: '#002d61',
    900: '#001d41'
  },
  secondary: {
    // 同様の構造
  }
}
```

#### B. セマンティックカラー（業務ロジック用）
```typescript
const semanticColors = {
  income: '#28a745',      // 収入（緑）
  expense: '#dc3545',     // 支出（赤）
  transfer: '#007bff',    // 振替（青）
  balance: '#6c757d',     // 残高（グレー）
  
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8'
}
```

#### C. システムカラー（UI用）
```typescript
const systemColors = {
  background: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    tertiary: '#e9ecef'
  },
  text: {
    primary: '#212529',
    secondary: '#495057',
    muted: '#6c757d',
    light: '#adb5bd'
  },
  border: {
    light: '#dee2e6',
    default: '#ced4da',
    dark: '#adb5bd'
  }
}
```

### 2.4 CSS変数の生成

```typescript
// cssVariables.ts
export function generateCSSVariables(theme: ThemeConfig): string {
  return `
    :root {
      /* ブランドカラー */
      --color-primary: ${theme.brand.primary[500]};
      --color-primary-light: ${theme.brand.primary[300]};
      --color-primary-dark: ${theme.brand.primary[700]};
      
      /* セマンティックカラー */
      --color-semantic-income: ${theme.semantic.income};
      --color-semantic-expense: ${theme.semantic.expense};
      --color-semantic-transfer: ${theme.semantic.transfer};
      --color-semantic-balance: ${theme.semantic.balance};
      
      /* システムカラー */
      --color-bg-primary: ${theme.system.background.primary};
      --color-text-primary: ${theme.system.text.primary};
      --color-border-default: ${theme.system.border.default};
    }
  `;
}
```

### 2.5 React Theme Provider

```typescript
// ThemeProvider.tsx
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('light');
  
  useEffect(() => {
    const cssVariables = generateCSSVariables(getThemeConfig(theme));
    injectCSSVariables(cssVariables);
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: getThemeConfig(theme) }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

## 3. 移行戦略

### 3.1 段階的移行計画

#### フェーズ1: 準備（即時実施、破壊的変更なし）
1. テーマシステムファイルの追加
2. ThemeProviderでアプリをラップ
3. Bootstrapオーバーライドの適用

#### フェーズ2: コア移行（1-2日）
1. ハードコードされた色をCSS変数に置換
2. 重要なコンポーネントをテーマフックを使用するよう更新

#### フェーズ3: 完全移行（1週間）
1. すべてのコンポーネントを移行
2. ダークモードサポートの追加
3. 包括的なテスト

#### フェーズ4: 拡張（オプション）
1. テーマカスタマイズUI
2. 追加のテーマプリセット

### 3.2 移行チェックリスト

```markdown
## 移行前の準備
- [ ] 現在のカラー使用箇所の完全なリスト作成
- [ ] テストケースの準備
- [ ] ロールバックプランの策定

## フェーズ1: セットアップ
- [ ] theme/フォルダの作成
- [ ] colors.tsの実装
- [ ] cssVariables.tsの実装
- [ ] ThemeProvider.tsxの実装
- [ ] App.tsxでThemeProviderを適用

## フェーズ2: コア移行
- [ ] theme.cssの更新
- [ ] forms.cssの更新
- [ ] 主要コンポーネントの更新

## フェーズ3: 完全移行
- [ ] すべてのCSSファイルの更新
- [ ] インラインスタイルの除去
- [ ] ダークモードの実装
- [ ] E2Eテストの実施

## 検証
- [ ] すべてのページの視覚的確認
- [ ] カラーコントラストのアクセシビリティチェック
- [ ] パフォーマンステスト
```

## 4. 使用方法

### 4.1 基本的な使用パターン

#### A. CSS変数の使用
```css
.custom-class {
  color: var(--color-text-primary);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-default);
}
```

#### B. React Hookの使用
```typescript
function MyComponent() {
  const { colors } = useTheme();
  
  return (
    <div style={{ color: colors.semantic.income }}>
      収入: ¥10,000
    </div>
  );
}
```

#### C. セマンティッククラスの使用
```jsx
<div className="text-semantic-income">収入</div>
<div className="text-semantic-expense">支出</div>
<button className="btn btn-semantic-transfer">振替</button>
```

### 4.2 Bootstrap統合

既存のBootstrapコンポーネントはそのまま動作：
```jsx
<Button variant="primary">プライマリボタン</Button>
<Alert variant="danger">エラーメッセージ</Alert>
```

新しいセマンティックバリアントも利用可能：
```jsx
<Button variant="income">収入を記録</Button>
<Alert variant="expense">支出警告</Alert>
```

## 5. パフォーマンスとメンテナンス

### 5.1 パフォーマンス最適化

1. **CSS変数によるネイティブパフォーマンス**
   - JavaScriptランタイムのオーバーヘッドなし
   - ブラウザの最適化された描画パイプライン

2. **遅延読み込み対応**
   - テーマの分割と必要に応じた読み込み

3. **最小限の再レンダリング**
   - テーマコンテキストコンシューマーのみ更新

### 5.2 メンテナンスガイドライン

1. **新しい色の追加**
   ```typescript
   // colors.tsに追加
   export const Colors = {
     ...existing,
     newFeature: {
       primary: '#hexvalue',
       secondary: '#hexvalue'
     }
   };
   ```

2. **テーマの追加**
   ```typescript
   // themes/にファイルを追加
   export const customTheme: ThemeConfig = {
     // テーマ定義
   };
   ```

3. **カラーの更新**
   - colors.tsの値を変更
   - 自動的にすべての箇所に反映

## 6. リスク管理

### 6.1 潜在的リスク
1. **既存コードの破損**: 低リスク（後方互換性維持）
2. **パフォーマンス低下**: 極低リスク（CSS変数はネイティブ）
3. **ブラウザ互換性**: 低リスク（IE11以外は対応）

### 6.2 ロールバック計画
1. ThemeProviderのラップを削除
2. CSS変数定義を削除
3. 元のカラー定義に戻す

## 7. 期待される成果

1. **一貫性の向上**: すべてのアプリケーションで統一されたカラー
2. **保守性の向上**: 単一箇所での色管理
3. **開発効率の向上**: 型安全性とオートコンプリート
4. **ユーザー体験の向上**: 一貫したビジュアル体験
5. **将来の拡張性**: テーマやカスタマイズの容易な追加

## 8. 実装スケジュール

| フェーズ | 期間 | 内容 |
|---------|------|------|
| 準備 | 1日 | 分析と計画 |
| フェーズ1 | 1日 | 基盤構築 |
| フェーズ2 | 2日 | コア移行 |
| フェーズ3 | 5日 | 完全移行とテスト |
| フェーズ4 | 3日 | 拡張機能（オプション） |

合計: 約2週間（拡張機能を含む）

## 9. まとめ

この統一カラースキーム設計により、現在の分散したカラー定義の問題を解決し、保守性、一貫性、パフォーマンスを大幅に向上させることができます。段階的な移行戦略により、既存システムへの影響を最小限に抑えながら、確実に新しいシステムへ移行できます。