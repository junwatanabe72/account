# Phase 12: 仕訳ベースフィルタリングへの統一

## 概要
会計の正しい原則に基づき、すべての報告書を仕訳の区分（journal.division）でフィルタリングするように統一しました。これまで試算表は勘定科目の区分でフィルタリングしていましたが、これは会計的に不適切でした。

## 背景と問題点

### 従来の実装の問題
1. **試算表（DivisionStatementsPanel）**
   - 勘定科目のdivisionプロパティでフィルタリング
   - 勘定科目マスタに設定された区分を使用

2. **収支報告書（IncomeExpenseReport）**
   - 仕訳のdivisionプロパティでフィルタリング
   - 仕訳データに設定された区分を使用

この不整合により、同じ区分でも異なる結果が表示される問題がありました。

### 会計の正しい原則
- **取引（仕訳）が区分を決定する**：どの区分の取引かは仕訳作成時に決まる
- **勘定科目は複数区分で使用可能**：同じ勘定科目が複数の区分で使われることがある
- **一貫性のあるフィルタリング**：すべての報告書で同じロジックを使用すべき

## 実装内容

### 1. 勘定科目マスタの変更
```typescript
// 変更前
type AccountDef = {
  division?: string  // 単一の区分
}

// 変更後
type AccountDef = {
  availableDivisions?: string[]  // 使用可能な区分の配列
  divisionCode?: string  // 旧フォーマット互換用（deprecated）
}
```

### 2. AccountServiceの修正
- `getDivisionsFromLegacyDivisionCode`メソッドを追加
- 旧フォーマットとの互換性を保持
- COMMON区分は全区分で使用可能

### 3. DivisionStatementsPanelの修正
```typescript
// 変更前：勘定科目の区分でフィルタリング
accounts.filter(acc => acc.division === division)

// 変更後：仕訳の区分でフィルタリング
engine.journals.forEach(journal => {
  if (journal.division === division && journal.status === 'POSTED') {
    // 仕訳明細を処理
  }
})
```

### 4. 報告書の一貫性確保
すべての報告書が同じフィルタリングロジックを使用：
- 試算表
- 貸借対照表
- 損益計算書
- 収支報告書
- 収入明細書
- 支出明細書

## 影響範囲

### 修正されたファイル
1. `/src/domain/services/core/AccountService.ts`
   - availableDivisionsプロパティの追加
   - 互換性メソッドの実装

2. `/src/ui/statements/DivisionStatementsPanel.tsx`
   - 仕訳ベースのフィルタリングに変更
   - 集計ロジックの修正

3. `/src/data/defaultAccounts.ts`
   - divisionCodeからavailableDivisionsへの移行

4. `/src/domain/services/io/SampleDataService.ts`
   - 新しいプロパティ形式への対応

## 移行ガイド

### 既存データの移行
旧フォーマット（divisionCode）から新フォーマット（availableDivisions）への自動変換：
```typescript
if (def.divisionCode && !def.availableDivisions) {
  def.availableDivisions = this.getDivisionsFromLegacyDivisionCode(def.divisionCode)
}
```

### COMMON区分の扱い
- COMMON区分の勘定科目は全区分で使用可能
- 自動的に['KANRI', 'SHUZEN', 'PARKING', 'OTHER']が設定される

## テスト結果
- ✅ 試算表：仕訳ベースでデータ表示
- ✅ 貸借対照表：仕訳ベースでデータ表示
- ✅ 損益計算書：仕訳ベースでデータ表示
- ✅ 収支報告書：正常に表示（従来通り）
- ✅ 収入・支出明細書：正常に表示（従来通り）

## 今後の課題
1. UIでの勘定科目の区分表示方法の検討
2. 勘定科目マスタ編集画面の更新
3. インポート/エクスポート機能の新フォーマット対応

## まとめ
Phase 12では、会計の正しい原則に基づいて、すべての報告書を仕訳の区分でフィルタリングするように統一しました。これにより、区分経理の一貫性が保たれ、正確な財務報告が可能になりました。