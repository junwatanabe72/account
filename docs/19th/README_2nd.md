# 19th Project - 2nd Phase: CSS保守性改善

## 実装内容

### 問題点の解決
保守性の観点から発見された以下の問題を解決：

1. **ハードコードされたrgba値** ✅
   - 28箇所のrgba値をCSS変数化
   - ダークモード対応を改善

2. **box-shadowの不統一** ✅
   - 標準化されたシャドウ変数を定義
   - 一貫性のある視覚効果を実現

3. **フォーカス状態の標準化** ✅
   - アクセシビリティを考慮した統一フォーカススタイル

## 追加されたCSS変数

### シャドウの標準化
```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
```

### 透明度付きカラー
```css
--color-primary-alpha-10: rgba(52, 152, 219, 0.1);
--color-primary-alpha-30: rgba(52, 152, 219, 0.3);
--color-primary-alpha-40: rgba(52, 152, 219, 0.4);
--color-danger-alpha-10: rgba(220, 53, 69, 0.1);
--color-overlay: rgba(0, 0, 0, 0.5);
```

### フォーカス用シャドウ
```css
--shadow-focus-primary: 0 0 0 3px var(--color-primary-alpha-10);
--shadow-focus-danger: 0 0 0 3px var(--color-danger-alpha-10);
--shadow-inset: inset 0 1px 3px rgba(0, 0, 0, 0.1);
```

## 更新されたファイル（14ファイル）

1. `theme.css` - CSS変数定義の拡張
2. `Sidebar.module.css` - オーバーレイカラー
3. `AmountInput.module.css` - フォーカスシャドウ
4. `DateInput.module.css` - フォーカスシャドウ
5. `TagManager.module.css` - フォーカスシャドウ
6. `TransferForm.module.css` - フォーカスシャドウ
7. `DescriptionInput.module.css` - フォーカスシャドウと通常シャドウ
8. `AccountSelector.module.css` - フォーカスシャドウとドロップダウンシャドウ
9. `AccountModal.module.css` - オーバーレイカラー
10. `DivisionSelector.module.css` - アクティブ状態のシャドウ
11. `TransactionTypeSelector.module.css` - インセットシャドウ
12. `JournalPreview.module.css` - テーブルシャドウ
13. `FreeeStyleJournalForm.module.css` - フォームとボタンのシャドウ
14. `master.module.css` - 基本シャドウ

## 改善効果

### 1. 保守性の向上
- rgba値の一元管理
- ダークモード時の自動調整
- 変更時の影響範囲が明確

### 2. 一貫性の確保
- 統一されたフォーカス状態
- 標準化されたシャドウ効果
- 予測可能な視覚的フィードバック

### 3. アクセシビリティの改善
- フォーカス状態が明確
- コントラスト比の維持
- キーボード操作時の視認性向上

## 今後の推奨事項

1. **新規コンポーネント作成時**
   - 必ずCSS変数を使用
   - rgba値の直接記述を避ける

2. **StyleLintの導入検討**
   ```json
   {
     "rules": {
       "color-no-hex": true,
       "color-function-notation": "modern"
     }
   }
   ```

3. **デザイントークン管理**
   - 単一ソースからの変数生成
   - TypeScript型定義の自動生成

## テスト確認項目

- [x] ライトモードでのフォーカス表示
- [x] ダークモードでのフォーカス表示
- [x] モーダルオーバーレイの表示
- [x] ボタンホバー時のシャドウ
- [x] フォーム入力時のフォーカスリング

## 成果

✅ 28箇所のrgba値をCSS変数化
✅ 6種類の標準シャドウを定義
✅ フォーカス状態の統一
✅ ダークモード対応の改善
✅ 保守性の大幅向上