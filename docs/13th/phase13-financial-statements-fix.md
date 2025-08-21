# Phase 13: 財務諸表の正常残高対応と表示修正

## 概要
会計原則に基づいた正常残高（Normal Balance）の概念を導入し、試算表、損益計算書、貸借対照表の計算ロジックを修正しました。これにより、すべての財務諸表が正しい借方・貸方の配置で表示されるようになりました。

## 背景と問題点

### 発見された問題
1. **試算表の借方・貸方配置の誤り**
   - 費用が貸方に表示される
   - 収益、負債、純資産が借方に表示される
   - すべての科目が借方に偏る不正確な表示

2. **損益計算書の収益が表示されない**
   - 収益残高の計算ロジックの誤り
   - 「収益なし」と表示される問題

3. **貸借対照表の不一致**
   - 資産 = 負債 + 純資産の等式が成立しない
   - 残高計算の不整合

4. **前期繰越金の未表示**
   - 収支報告書に前期繰越金が表示されない
   - 繰越金勘定科目の不足（駐車場、その他）

5. **サンプルデータの問題**
   - 期首残高が区分別に分かれていない
   - 管理会計に修繕会計の科目が混在

## 実装内容

### 1. 正常残高に基づく残高計算の実装

```typescript
// 勘定科目の正常残高に基づいて残高を計算
if (account.normalBalance === 'DEBIT') {
  // 借方残高科目（資産・費用）
  newBalance += detail.debitAmount || 0
  newBalance -= detail.creditAmount || 0
} else {
  // 貸方残高科目（負債・純資産・収益）
  newBalance -= detail.debitAmount || 0
  newBalance += detail.creditAmount || 0
}
```

### 2. 試算表の借方・貸方判定ロジック

```typescript
// 勘定科目の種類に基づいて借方・貸方を決定
if (a.type === 'ASSET' || a.type === 'EXPENSE') {
  // 資産・費用：正の残高は借方
  if (a.calculatedBalance > 0) {
    debit = bal
  } else {
    credit = bal
  }
} else {
  // 負債・純資産・収益：正の残高は貸方
  if (a.calculatedBalance > 0) {
    credit = bal
  } else {
    debit = bal
  }
}
```

### 3. 前期繰越金の実装

#### 勘定科目の追加
- `4103`: 駐車場会計繰越金
- `4104`: その他会計繰越金

#### 収支報告書への表示
```typescript
// 前期繰越金を収入の部の最初に表示
<tr>
  <td style={cellStyle}>前期繰越金</td>
  <td style={{ ...cellStyle, textAlign: 'right' }}>{yen(previousBalance)}</td>
</tr>
```

### 4. サンプルデータの修正

#### 期首残高を区分別に作成
```typescript
// 管理会計の期首残高
const openingJournalKanri = this.journalService.createJournal({
  date: `${currentYear}-04-01`,
  description: '期首残高（管理会計）',
  division: 'KANRI',
  details: [
    { accountCode: '1102', debitAmount: 5000000, creditAmount: 0 },  // 普通預金（管理）
    { accountCode: '4101', debitAmount: 0, creditAmount: 5000000 }   // 管理費繰越金
  ]
})

// 修繕会計、駐車場会計も同様に区分別に作成
```

## 会計原則の正しい適用

### 借方残高科目（Normal Balance = DEBIT）
- **資産（ASSET）**：増加は借方、減少は貸方
- **費用（EXPENSE）**：発生は借方

### 貸方残高科目（Normal Balance = CREDIT）
- **負債（LIABILITY）**：増加は貸方、減少は借方
- **純資産（EQUITY）**：増加は貸方、減少は借方
- **収益（REVENUE）**：発生は貸方

## テスト結果

### 試算表
- ✅ 資産（普通預金等）→ 借方に表示
- ✅ 負債 → 貸方に表示
- ✅ 純資産（繰越金等）→ 貸方に表示
- ✅ 収益（管理費収入等）→ 貸方に表示
- ✅ 費用（管理委託費等）→ 借方に表示
- ✅ 借方合計 = 貸方合計

### 損益計算書
- ✅ 収益が正しく表示
- ✅ 費用が正しく表示
- ✅ 当期純利益の計算が正確

### 貸借対照表
- ✅ 資産の部が正しく集計
- ✅ 負債の部が正しく集計
- ✅ 純資産の部が正しく集計
- ✅ 資産 = 負債 + 純資産の等式が成立

### 収支報告書
- ✅ 前期繰越金が表示
- ✅ 収入合計に前期繰越金を含む
- ✅ 次期繰越金の計算が正確

## 影響範囲

### 修正されたファイル
1. `/src/ui/statements/DivisionStatementsPanel.tsx`
   - 残高計算ロジックの修正（3箇所）
   - 借方・貸方判定ロジックの修正
   - 損益計算書・貸借対照表の表示ロジック修正

2. `/src/ui/statements/IncomeExpenseReport.tsx`
   - 前期繰越金の取得と表示
   - 区分別繰越金への対応

3. `/src/domain/services/io/SampleDataService.ts`
   - 期首残高を区分別に作成
   - 正しい繰越金勘定科目の使用

4. `/src/data/defaultAccounts.ts`
   - 駐車場会計繰越金、その他会計繰越金の追加

## まとめ

Phase 13では、会計の基本原則である正常残高の概念を正しく実装し、すべての財務諸表が会計原則に従った表示となりました。これにより：

1. 試算表の借方・貸方が正しく配置
2. 損益計算書に収益・費用が適切に表示
3. 貸借対照表の貸借一致が実現
4. 前期繰越金が各報告書に反映
5. 区分経理が正確に機能

マンション管理組合会計システムとして、正確で信頼性の高い財務報告が可能になりました。