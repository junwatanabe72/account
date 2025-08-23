# CSS保守性の問題点と改善提案

## 発見された問題点

### 1. ハードコードされたrgba値 🔴
**問題**: 透明度を含む色がハードコードされている
**影響**: ダークモード時に適切に変更されない

#### 影響範囲
```css
/* 例: AmountInput.module.css */
box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);  /* プライマリカラーの透明版 */
box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);   /* エラーカラーの透明版 */

/* 例: Sidebar.module.css */
background-color: rgba(0, 0, 0, 0.5);  /* オーバーレイ */
```

### 2. box-shadowの不統一 🟡
**問題**: 各ファイルで異なるシャドウ値
**影響**: 視覚的な一貫性の欠如

```css
/* 現在の状況 */
0 1px 3px rgba(0, 0, 0, 0.1)
0 2px 4px rgba(0, 0, 0, 0.05) 
0 2px 8px rgba(0, 0, 0, 0.15)
0 4px 12px rgba(0, 0, 0, 0.1)
```

### 3. フォールバック値の不統一 🟡
**問題**: 一部のCSS変数にフォールバック値がない
**影響**: CSS変数未対応ブラウザでの表示問題

## 改善提案

### Step 1: CSS変数の追加定義
```css
:root {
  /* 透明度付きカラー */
  --color-primary-alpha-10: rgba(52, 152, 219, 0.1);
  --color-primary-alpha-30: rgba(52, 152, 219, 0.3);
  --color-danger-alpha-10: rgba(220, 53, 69, 0.1);
  --color-overlay: rgba(0, 0, 0, 0.5);
  --color-overlay-light: rgba(0, 0, 0, 0.3);
  
  /* フォーカス用のシャドウ */
  --shadow-focus-primary: 0 0 0 3px var(--color-primary-alpha-10);
  --shadow-focus-danger: 0 0 0 3px var(--color-danger-alpha-10);
  
  /* 標準化されたシャドウ */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
}

/* ダークモード */
[data-theme="dark"] {
  --color-primary-alpha-10: rgba(96, 165, 250, 0.1);
  --color-primary-alpha-30: rgba(96, 165, 250, 0.3);
  --color-danger-alpha-10: rgba(239, 68, 68, 0.1);
  --color-overlay: rgba(0, 0, 0, 0.7);
  --color-overlay-light: rgba(0, 0, 0, 0.5);
  
  /* ダークモード用シャドウ（より強め） */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.3);
}
```

### Step 2: 修正例

#### Before
```css
.input:focus {
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}
```

#### After
```css
.input:focus {
  box-shadow: var(--shadow-focus-primary);
}
```

### Step 3: 優先順位

#### 🔴 高優先度（即座に修正すべき）
1. フォーカス時のbox-shadow（アクセシビリティに影響）
2. オーバーレイの背景色（モーダルの可読性）

#### 🟡 中優先度（段階的に修正）
1. 装飾的なbox-shadow
2. ホバーエフェクト

#### 🟢 低優先度（時間があれば）
1. アニメーション関連の値
2. 非表示要素のスタイル

## 実装スクリプト

```bash
#!/bin/bash
# rgba値を見つけて報告するスクリプト

echo "=== RGBA値を含むファイル ==="
find src -name "*.css" -o -name "*.module.css" | while read file; do
  count=$(grep -c "rgba(" "$file" 2>/dev/null || echo 0)
  if [ "$count" -gt 0 ]; then
    echo "$file: $count箇所"
  fi
done

echo ""
echo "=== 修正が必要な総数 ==="
find src -name "*.css" -o -name "*.module.css" | xargs grep -h "rgba(" | wc -l
```

## チェックリスト

- [ ] theme.cssに透明度付きCSS変数を追加
- [ ] フォーカス用シャドウを統一
- [ ] オーバーレイカラーを変数化
- [ ] 各ファイルのrgba値を置換
- [ ] ダークモードでの動作確認
- [ ] ドキュメント更新

## 長期的な改善

1. **StyleLint導入**
   - ハードコード値の検出
   - CSS変数の使用強制

2. **デザイントークン管理**
   - 単一ソースからCSS変数を生成
   - TypeScript型定義の自動生成

3. **コンポーネントライブラリ化**
   - スタイルの再利用性向上
   - 一貫性の自動保証