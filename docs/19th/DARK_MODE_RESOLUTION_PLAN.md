# ダークモード対応の問題解決方針

## 現状の問題

### 1. 問題の詳細
- **症状**: デバイスがダークモードで、アプリがライトモードの場合、文字が黒くなり読めない
- **原因**: CSS変数とインラインスタイルの競合
- **影響範囲**: 全画面のテキスト表示

### 2. 技術的課題
1. **インラインスタイルの優先度**
   - ThemeSwitcher.tsxで直接DOM操作している（line 26-62）
   - インラインスタイルがCSS変数より優先される

2. **CSS変数の不完全な定義**
   - theme.cssはライトモードのみ定義
   - ダークモード用のCSS変数が未定義

3. **コンポーネントの硬直的な色指定**
   - 多くのコンポーネントが色を直接指定
   - CSS Modulesで`color: #2c3e50`のような固定値使用

## 解決方針

### 方針1: CSS変数ベースの完全なテーマシステム構築（推奨）

#### 概要
CSS変数を使用した包括的なテーマシステムを構築し、インラインスタイルを排除

#### 実装手順
1. **CSS変数の拡張**
   ```css
   /* ライトモード（デフォルト） */
   :root {
     --color-text-primary: #212529;
     --color-text-secondary: #6c757d;
     --color-bg-primary: #ffffff;
     --color-bg-secondary: #f8f9fa;
   }
   
   /* ダークモード */
   [data-theme="dark"] {
     --color-text-primary: #e5e7eb;
     --color-text-secondary: #9ca3af;
     --color-bg-primary: #1a1a1a;
     --color-bg-secondary: #2a2a2a;
   }
   
   /* システム設定に従う */
   @media (prefers-color-scheme: dark) {
     :root:not([data-theme="light"]) {
       --color-text-primary: #e5e7eb;
       /* ... */
     }
   }
   ```

2. **ThemeSwitcherのリファクタリング**
   - DOM操作を削除
   - data-theme属性のみを制御
   - CSS変数で自動的に色が変わる仕組み

3. **CSS Modulesの更新**
   - 固定色値をCSS変数に置き換え
   - 例: `color: #2c3e50` → `color: var(--color-text-primary)`

#### メリット
- ✅ 保守性が高い
- ✅ パフォーマンスが良い
- ✅ システム設定との連携が簡単
- ✅ 拡張性がある

#### デメリット
- ⚠️ 全CSSファイルの修正が必要
- ⚠️ 初期実装コストが高い

---

### 方針2: Context APIとCSS-in-JSの併用

#### 概要
React ContextでテーマをグローバルステートとしCSS-in-JSで動的にスタイル適用

#### 実装手順
1. **ThemeContextの作成**
   ```typescript
   const ThemeContext = createContext({
     theme: 'light',
     colors: lightColors,
     setTheme: () => {}
   })
   ```

2. **styled-componentsまたはemotionの導入**
   ```typescript
   const StyledContainer = styled.div`
     color: ${props => props.theme.colors.textPrimary};
     background: ${props => props.theme.colors.bgPrimary};
   `
   ```

#### メリット
- ✅ TypeScript型安全
- ✅ 動的なテーマ切り替えが容易

#### デメリット
- ⚠️ 新しいライブラリの導入が必要
- ⚠️ バンドルサイズが増加
- ⚠️ 既存のCSS Modulesとの併用が複雑

---

### 方針3: PostCSSプラグインによる自動変換

#### 概要
PostCSSプラグインで固定色値を自動的にCSS変数に変換

#### 実装手順
1. **postcss-theme-colorsプラグインの設定**
2. **ビルド時に自動変換**
3. **テーマ定義ファイルの作成**

#### メリット
- ✅ 既存コードの変更が最小限
- ✅ 自動化による工数削減

#### デメリット
- ⚠️ ビルドプロセスが複雑化
- ⚠️ デバッグが困難

---

## 推奨実装計画

### Phase 1: 基盤構築（1日）
1. CSS変数システムの設計
2. theme.cssの拡張
3. ThemeSwitcherのリファクタリング

### Phase 2: 段階的移行（3日）
1. 共通コンポーネントから順次移行
2. 新規作成したコンポーネント（18th）を優先
3. 重要な画面から対応

### Phase 3: 検証と調整（1日）
1. ライト/ダーク/自動モードのテスト
2. コントラスト比の確認（WCAG準拠）
3. ユーザビリティテスト

## 技術選定の判断基準

| 基準 | 方針1（CSS変数） | 方針2（CSS-in-JS） | 方針3（PostCSS） |
|-----|-----------------|-------------------|------------------|
| 実装コスト | 中 | 高 | 低 |
| 保守性 | 高 | 中 | 低 |
| パフォーマンス | 高 | 中 | 高 |
| 型安全性 | 低 | 高 | 低 |
| 既存コードとの親和性 | 高 | 低 | 高 |

## 結論

**方針1（CSS変数ベース）を推奨**

理由：
1. 既存のCSS Modulesアーキテクチャと親和性が高い
2. 追加ライブラリ不要でバンドルサイズを維持
3. ブラウザネイティブの機能で高パフォーマンス
4. システム設定（prefers-color-scheme）との連携が容易
5. 将来的な拡張（テーマのカスタマイズ等）が容易

## 次のステップ

1. この方針について承認を得る
2. 詳細な実装仕様書の作成
3. プロトタイプの実装（1画面）
4. レビューと調整
5. 全画面への展開