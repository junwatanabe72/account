# freee UI/UXを参考にした実装計画

## 🎯 現在のアプリに反映すべき主要改善点

### 1. **取引ベースの入力方式への転換** 🔴 最優先

#### 現状の問題点
- 現在: ユーザーが借方・貸方を直接入力（会計知識が必要）
- freee: 「収入/支出/口座振替」から選択するだけ

#### 実装案
```typescript
// 新しい取引入力コンポーネント
interface TransactionInput {
  type: 'income' | 'expense' | 'transfer';
  date: string;
  accountTitle: string;
  amount: number;
  status: 'unpaid' | 'paid';
  counterparty?: string;
  dueDate?: string;
  tags?: string[];
  note?: string;
}

// 取引から仕訳を自動生成
function generateJournalEntry(transaction: TransactionInput): JournalEntry {
  // ルールベースで借方・貸方を自動決定
}
```

**実装ファイル**: 
- 新規作成: `src/ui/TransactionInputForm.tsx`
- 修正: `src/ui/JournalForm.tsx`

### 2. **仕訳プレビュー機能** 🔴 最優先

#### 機能内容
- 入力中にリアルタイムで仕訳を表示
- 折りたたみ可能なプレビューエリア

#### 実装イメージ
```tsx
const JournalPreview: React.FC<{transaction: TransactionInput}> = ({transaction}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const journalEntry = generateJournalEntry(transaction);
  
  return (
    <div className="journal-preview">
      <button onClick={() => setIsExpanded(!isExpanded)}>
        仕訳プレビュー {isExpanded ? '▼' : '▶'}
      </button>
      {isExpanded && (
        <table>
          <tr>
            <td>借方: {journalEntry.debit.account}</td>
            <td>{journalEntry.debit.amount}円</td>
            <td>貸方: {journalEntry.credit.account}</td>
            <td>{journalEntry.credit.amount}円</td>
          </tr>
        </table>
      )}
    </div>
  );
};
```

### 3. **勘定科目の用途別ナビゲーション** 🟠 高優先

#### 現状の問題点
- 現在: 科目コードと名前のドロップダウンのみ
- freee: 用途別カテゴリで階層的に選択

#### 実装案
```typescript
const accountCategories = {
  income: {
    '売上': ['売上高', '雑収入'],
    '金銭債権・一時支払': ['未収入金', '仮払金'],
    '固定資産の売却': ['固定資産売却益'],
    '税金（還付）': ['法人税等還付金'],
  },
  expense: {
    '仕入・原価': ['仕入高', '外注費'],
    '人件費': ['給料手当', '法定福利費'],
    '経費': ['旅費交通費', '通信費', '消耗品費'],
    '設備・資産': ['建物', '器具備品'],
  }
};
```

**実装ファイル**: 
- 新規作成: `src/ui/AccountNavigator.tsx`
- 修正: `src/constants/index.ts`

### 4. **テンプレート機能の強化** 🟠 高優先

#### 機能内容
- よく使う取引パターンを保存
- ドロップダウンから選択して一発入力

#### 実装案
```typescript
interface TransactionTemplate {
  id: string;
  name: string;
  category: string;
  transactionType: 'income' | 'expense' | 'transfer';
  accountTitle: string;
  defaultAmount?: number;
  counterparty?: string;
  tags?: string[];
  description: string;
}

// LocalStorageに保存
const saveTemplate = (template: TransactionTemplate) => {
  const templates = JSON.parse(localStorage.getItem('templates') || '[]');
  templates.push(template);
  localStorage.setItem('templates', JSON.stringify(templates));
};
```

### 5. **チップ式フィルター** 🟡 中優先

#### 現状の問題点
- 現在: 基本的なフィルター機能のみ
- freee: チップ（バッジ）式で視覚的に条件を管理

#### 実装イメージ
```tsx
const FilterChips: React.FC = () => {
  const [filters, setFilters] = useState<Filter[]>([]);
  
  return (
    <div className="filter-chips">
      {filters.map(filter => (
        <span className="chip" key={filter.id}>
          {filter.label}
          <button onClick={() => removeFilter(filter.id)}>×</button>
        </span>
      ))}
      <button onClick={addFilter}>+ フィルタを追加</button>
    </div>
  );
};
```

### 6. **取引先マスタと自動期日計算** 🟡 中優先

#### 機能内容
- 取引先ごとの支払条件を設定
- 発生日から自動で期日を計算

#### 実装案
```typescript
interface Counterparty {
  id: string;
  name: string;
  paymentTerms: {
    type: 'endOfMonth' | 'endOfNextMonth' | 'days';
    days?: number; // 例: 30日後
  };
}

function calculateDueDate(occurredOn: Date, terms: PaymentTerms): Date {
  // 支払条件に基づいて期日を自動計算
}
```

## 📋 段階的実装計画

### Phase 1: 基本的なUX改善（1週間）
1. **Day 1-2**: 取引ベース入力フォームの実装
   - `TransactionInputForm.tsx`の作成
   - 収入/支出/口座振替のタブ切り替えUI

2. **Day 3-4**: 仕訳プレビュー機能
   - リアルタイム仕訳生成ロジック
   - 折りたたみ可能なプレビューUI

3. **Day 5**: 入力補助機能
   - 3桁カンマ自動挿入
   - 日付ピッカーの改善
   - Enterキーでの送信

### Phase 2: 科目選択の改善（1週間）
1. **Day 6-7**: 勘定科目ナビゲーター
   - 用途別カテゴリ構造の実装
   - 階層的選択UI

2. **Day 8-9**: 科目サジェスト機能
   - 最近使用した科目の優先表示
   - キーワード検索

3. **Day 10**: 科目説明とヘルプ
   - 各科目の説明文追加
   - 「迷ったら」ガイド機能

### Phase 3: 効率化機能（1週間）
1. **Day 11-12**: テンプレート機能
   - テンプレート作成・保存
   - テンプレートからの入力

2. **Day 13-14**: フィルター強化
   - チップ式フィルターUI
   - フィルター条件の保存

3. **Day 15**: 取引先マスタ
   - 取引先管理機能
   - 自動期日計算

## 🚀 即座に実装可能な改善

### 今すぐできる改善（2-3時間で実装可能）

1. **金額入力の改善**
```typescript
// JournalForm.tsxに追加
const formatAmount = (value: string) => {
  const num = value.replace(/,/g, '');
  return Number(num).toLocaleString();
};
```

2. **キーボードショートカット**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSubmit();
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

3. **ステータスチップ**
```tsx
<div className="status-chips">
  <button 
    className={`chip ${status === 'unpaid' ? 'active' : ''}`}
    onClick={() => setStatus('unpaid')}
  >
    未決済
  </button>
  <button 
    className={`chip ${status === 'paid' ? 'active' : ''}`}
    onClick={() => setStatus('paid')}
  >
    決済済み
  </button>
</div>
```

## 📊 期待される効果

| 改善項目 | 現在の課題 | 改善後の効果 |
|---------|-----------|------------|
| 取引ベース入力 | 借方・貸方の理解が必要 | 会計知識不要で入力可能 |
| 仕訳プレビュー | 登録後に確認 | 入力中に確認・修正可能 |
| 科目ナビ | コード番号で選択 | 用途から直感的に選択 |
| テンプレート | 毎回同じ入力 | ワンクリックで入力完了 |
| フィルター | 検索が面倒 | 視覚的に条件管理 |

## 🎯 実装の優先順位

### 必須実装（MVP）
1. ✅ 取引ベース入力
2. ✅ 仕訳プレビュー
3. ✅ 科目ナビゲーター

### 推奨実装
4. ⭐ テンプレート機能
5. ⭐ チップ式フィルター
6. ⭐ 自動期日計算

### オプション
7. ○ AI科目サジェスト
8. ○ 自然言語入力
9. ○ 異常検知

## 次のステップ

1. **Phase 1の実装開始**
   - `TransactionInputForm.tsx`の作成から着手
   - 既存の`JournalForm.tsx`との統合方法を検討

2. **UIコンポーネントの準備**
   - チップコンポーネント
   - 階層選択コンポーネント
   - プレビューテーブル

3. **データ構造の拡張**
   - Transaction型の定義
   - 仕訳生成ルールの実装
   - テンプレート保存機能

この実装により、会計知識がないユーザーでも直感的に入力でき、入力速度が大幅に向上することが期待できます。