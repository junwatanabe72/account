# Phase 9: 会計区分設計書

## 現状分析

### 問題点
1. **仕訳データの区分が不完全**
   - 仕訳の`Division`型: `'KANRI' | 'SHUZEN'` のみ
   - 実際には`PARKING`（駐車場）や`OTHER`（その他）も必要
   
2. **勘定科目の区分と仕訳データの区分の混同**
   - 勘定科目マスタ: `divisionCode`に`COMMON`を含む
   - 仕訳データ: 実際の会計区分を指定すべき

3. **区分判定ロジックの問題**
   - 現在は勘定科目の`division`から自動判定
   - 明示的な区分指定が必要

## 正しい設計

### 1. 区分の定義

#### 勘定科目マスタの区分（divisionCode）
```typescript
type AccountDivisionCode = 
  | 'COMMON'   // 共通（複数区分で使用可能）
  | 'KANRI'    // 管理費会計専用
  | 'SHUZEN'   // 修繕積立金会計専用
  | 'PARKING'  // 駐車場会計専用
  | 'OTHER'    // その他特別会計専用
```

#### 仕訳データの区分（division）
```typescript
type JournalDivision = 
  | 'KANRI'    // 管理費会計
  | 'SHUZEN'   // 修繕積立金会計
  | 'PARKING'  // 駐車場会計
  | 'OTHER'    // その他特別会計
// ※COMMONは仕訳データには存在しない
```

### 2. 区分の運用ルール

#### 勘定科目マスタ
- **COMMON**: 現金、普通預金、未収金など、複数の会計区分で使用される勘定科目
- **KANRI**: 管理費収入、管理委託費など、管理費会計専用の勘定科目
- **SHUZEN**: 修繕積立金収入、大規模修繕費など、修繕積立金会計専用の勘定科目
- **PARKING**: 駐車場使用料収入、駐車場管理費など、駐車場会計専用の勘定科目
- **OTHER**: その他特別会計専用の勘定科目

#### 仕訳データ
- 必ず具体的な会計区分（KANRI/SHUZEN/PARKING/OTHER）を指定
- COMMONは指定不可（エラーとする）
- 仕訳入力時に明示的に区分を選択

### 3. バリデーションルール

#### 仕訳作成時のバリデーション
```typescript
function validateJournalDivision(journal: Journal): ValidationResult {
  // 1. 仕訳の区分がCOMMONでないことを確認
  if (journal.division === 'COMMON') {
    return { 
      valid: false, 
      error: '仕訳には具体的な会計区分を指定してください' 
    }
  }
  
  // 2. 使用する勘定科目が指定区分で使用可能か確認
  for (const detail of journal.details) {
    const account = getAccount(detail.accountCode)
    if (account.divisionCode !== 'COMMON' && 
        account.divisionCode !== journal.division) {
      return { 
        valid: false, 
        error: `勘定科目${account.name}は${journal.division}で使用できません` 
      }
    }
  }
  
  return { valid: true }
}
```

### 4. 区分間振替のルール

#### 振替可能なパターン
1. **管理費 → 修繕積立金**: 余剰金の積立
2. **修繕積立金 → 管理費**: 緊急時の一時借入
3. **駐車場 → 管理費**: 収益の振替
4. **駐車場 → 修繕積立金**: 収益の積立

#### 振替時の仕訳区分
- 振替元の区分を使用
- 振替先は補助情報として記録

## 実装変更内容

### 1. 型定義の修正

#### src/types/journal.ts
```typescript
// 修正前
export type Division = 'KANRI' | 'SHUZEN'

// 修正後
export type JournalDivision = 'KANRI' | 'SHUZEN' | 'PARKING' | 'OTHER'
// ※COMMONは含まない
```

### 2. 仕訳入力フォームの修正

#### FreeeStyleJournalForm.tsx
```typescript
// 区分選択の追加
const divisionOptions = [
  { value: 'KANRI', label: '管理費会計' },
  { value: 'SHUZEN', label: '修繕積立金会計' },
  { value: 'PARKING', label: '駐車場会計' },
  { value: 'OTHER', label: 'その他特別会計' }
]

// 勘定科目フィルタリング
const getAvailableAccounts = (division: JournalDivision) => {
  return accounts.filter(account => 
    account.divisionCode === 'COMMON' || 
    account.divisionCode === division
  )
}
```

### 3. レポート表示の修正

#### ReportService.ts
```typescript
// 修正前: 勘定科目の区分でフィルタリング
if (!divisionCode || account.division === divisionCode || account.division === 'COMMON')

// 修正後: 仕訳データの区分でフィルタリング
function getIncomeDetails(startDate: string, endDate: string, divisionCode?: string) {
  for (const journal of this.journalService.getJournals()) {
    // 仕訳の区分でフィルタリング
    if (divisionCode && journal.division !== divisionCode) {
      continue
    }
    // 以下、仕訳明細の処理
  }
}
```

## 移行計画

### Phase 1: 型定義とバリデーション（1日）
1. JournalDivision型の定義
2. バリデーション関数の実装
3. 単体テストの作成

### Phase 2: 仕訳入力フォーム（2日）
1. 区分選択UIの追加
2. 勘定科目フィルタリングの実装
3. 区分間振替ロジックの実装

### Phase 3: データ移行（1日）
1. 既存データの区分判定ロジック作成
2. 移行スクリプトの実装
3. データ検証

### Phase 4: レポート機能（1日）
1. ReportServiceの修正
2. 区分別集計ロジックの改善
3. 統合テスト

## リスクと対策

### リスク
1. **既存データの不整合**
   - 対策: 移行スクリプトで自動判定、手動確認が必要なものはリスト化

2. **パフォーマンスの低下**
   - 対策: インデックスの追加、キャッシュの活用

3. **UIの複雑化**
   - 対策: デフォルト値の設定、スマートな推論

## テスト計画

### 単体テスト
- 区分バリデーションのテスト
- 勘定科目フィルタリングのテスト
- 区分間振替のテスト

### 統合テスト
- 仕訳入力から帳票出力までのフロー
- 区分別集計の正確性
- データ移行の完全性

### 受け入れテスト
- 実際の会計データでの動作確認
- パフォーマンステスト
- ユーザビリティテスト

## まとめ

現在の実装では、仕訳データの区分が不完全であり、勘定科目の区分と混同されている。この設計書に基づいて、以下を実現する：

1. **明確な区分定義**: 勘定科目マスタと仕訳データで異なる区分体系
2. **厳密なバリデーション**: 使用可能な勘定科目の制限
3. **柔軟な区分間振替**: ビジネスルールに基づく振替制御

これにより、マンション管理組合の複雑な会計区分を正確に管理できるようになる。