// freee風の目的別勘定科目カテゴリー
// 使いやすさを重視し、日常的な表現でグループ化

export interface AccountCategory {
  id: string
  label: string
  icon?: string
  description?: string
  color?: string
  accounts: AccountItem[]
}

export interface AccountItem {
  code: string
  label: string
  shortLabel?: string
  description?: string
  keywords?: string[]  // 検索用キーワード
  frequency?: number    // 使用頻度（並べ替えに使用）
  divisions?: ('KANRI' | 'SHUZEN' | 'PARKING' | 'OTHER' | 'BOTH')[]  // 使用可能な会計区分
}

// 収入カテゴリー（正しい5000番台のコード）
export const incomeCategories: AccountCategory[] = [
  {
    id: 'fee-income',
    label: '管理費・積立金収入',
    description: '定期的な収入',
    color: '#10B981',
    accounts: [
      { code: '5101', label: '管理費収入', shortLabel: '管理費', keywords: ['管理費', '月額'], frequency: 100, divisions: ['KANRI'] },
      { code: '5201', label: '修繕積立金収入', shortLabel: '修繕積立金', keywords: ['修繕', '積立'], frequency: 99, divisions: ['SHUZEN'] }
    ]
  },
  {
    id: 'usage-income',
    label: '使用料・手数料収入',
    description: '施設利用等による収入',
    color: '#06B6D4',
    accounts: [
      { code: '5102', label: '駐車場使用料収入', shortLabel: '駐車場', keywords: ['駐車場', 'パーキング', '月極'], frequency: 90, divisions: ['KANRI'] },
      { code: '5103', label: '駐輪場使用料収入', shortLabel: '駐輪場', keywords: ['駐輪場', '自転車', 'バイク'], frequency: 70, divisions: ['KANRI'] },
      { code: '5104', label: 'ルーフバルコニー使用料収入', shortLabel: 'ルーフバルコニー', keywords: ['ルーフバルコニー', '屋上', 'バルコニー'], frequency: 50, divisions: ['KANRI'] },
      { code: '5105', label: 'テラス使用料収入', shortLabel: 'テラス', keywords: ['テラス', '専用庭', '庭'], frequency: 45, divisions: ['KANRI'] },
      { code: '5106', label: '集会室使用料収入', shortLabel: '集会室', keywords: ['集会室', 'ホール', '共用施設'], frequency: 40, divisions: ['KANRI'] },
      { code: '5303', label: '延滞金収入', shortLabel: '延滞金', keywords: ['遅延', '延滞', '遅延損害金'], frequency: 10, divisions: ['KANRI'] }
    ]
  },
  {
    id: 'other-income',
    label: 'その他の収入',
    description: '雑収入など',
    color: '#8B5CF6',
    accounts: [
      { code: '5301', label: '受取利息', shortLabel: '利息', keywords: ['利息', '預金利息'], frequency: 60, divisions: ['BOTH'] },
      { code: '5302', label: '雑収入', shortLabel: '雑収入', keywords: ['その他', '雑', '自販機'], frequency: 70, divisions: ['BOTH'] },
      { code: '5304', label: '受取保険金', shortLabel: '保険金', keywords: ['保険', '保険金'], frequency: 20, divisions: ['BOTH'] },
      { code: '5305', label: '補助金収入', shortLabel: '補助金', keywords: ['補助金', '助成金'], frequency: 15, divisions: ['BOTH'] }
    ]
  },
  {
    id: 'special-income',
    label: '特別収入',
    description: '臨時的な収入',
    color: '#F59E0B',
    accounts: [
      { code: '5401', label: '特別徴収金収入', shortLabel: '特別徴収金', keywords: ['特別', '徴収'], frequency: 5, divisions: ['SHUZEN'] },
      { code: '5402', label: '繰入金収入', shortLabel: '繰入金', keywords: ['繰入', '振替'], frequency: 10, divisions: ['SHUZEN'] }
    ]
  }
]

// 支出カテゴリー（正しい6000番台のコード）
export const expenseCategories: AccountCategory[] = [
  {
    id: 'utilities',
    label: '水道光熱費',
    description: '電気・水道・ガスなど',
    color: '#EF4444',
    accounts: [
      { code: '6102', label: '水道光熱費', shortLabel: '水道光熱費', keywords: ['電気', '水道', 'ガス', '灯油', '電力'], frequency: 100, divisions: ['KANRI'] }
    ]
  },
  {
    id: 'management-fee',
    label: '管理業務費',
    description: '管理会社への支払いなど',
    color: '#F59E0B',
    accounts: [
      { code: '6101', label: '管理委託費', shortLabel: '管理委託', keywords: ['管理会社', '委託', '清掃', '設備保守', 'エレベーター', '消防'], frequency: 95, divisions: ['KANRI'] }
    ]
  },
  {
    id: 'repair-maintenance',
    label: '修繕・保全費',
    description: '建物や設備の修理・改修',
    color: '#3B82F6',
    accounts: [
      { code: '6201', label: '修繕費', shortLabel: '修繕費', keywords: ['修繕', '修理', '補修', '緊急', '予防保全'], frequency: 85, divisions: ['KANRI'] },
      { code: '6401', label: '修繕工事費', shortLabel: '大規模修繕', keywords: ['大規模', '改修', '工事', '計画修繕'], frequency: 30, divisions: ['SHUZEN'] },
      { code: '6402', label: '設計監理費', shortLabel: '設計監理', keywords: ['設計', '監理', '建築士'], frequency: 25, divisions: ['SHUZEN'] }
    ]
  },
  {
    id: 'insurance-communication',
    label: '保険・通信費',
    description: '保険料や通信関連',
    color: '#059669',
    accounts: [
      { code: '6104', label: '保険料', shortLabel: '保険', keywords: ['保険', '共用部', '火災', '賠償'], frequency: 75, divisions: ['BOTH'] },
      { code: '6103', label: '通信費', shortLabel: '通信', keywords: ['郵送', '電話', 'インターネット'], frequency: 70, divisions: ['KANRI'] }
    ]
  },
  {
    id: 'office-expense',
    label: '事務費・会議費',
    description: '事務用品や会議関連',
    color: '#7C3AED',
    accounts: [
      { code: '6301', label: '消耗品費', shortLabel: '消耗品', keywords: ['消耗品', '事務用品', '文具'], frequency: 80, divisions: ['KANRI'] },
      { code: '6306', label: '印刷費', shortLabel: '印刷', keywords: ['印刷', 'コピー', '製本'], frequency: 60, divisions: ['KANRI'] },
      { code: '6303', label: '会議費', shortLabel: '会議', keywords: ['会議', '理事会', '総会'], frequency: 50, divisions: ['KANRI'] },
      { code: '6309', label: '旅費交通費', shortLabel: '交通費', keywords: ['交通', '旅費', '実費精算'], frequency: 55, divisions: ['KANRI'] },
      { code: '6304', label: '役員手当', shortLabel: '役員手当', keywords: ['役員', '手当', '報酬'], frequency: 45, divisions: ['KANRI'] }
    ]
  },
  {
    id: 'professional-fee',
    label: '専門家報酬',
    description: '税理士・弁護士など',
    color: '#DC2626',
    accounts: [
      { code: '6305', label: '専門家謝金', shortLabel: '専門家謝金', keywords: ['顧問', '税理士', '弁護士', '建築士', 'アドバイザー'], frequency: 65, divisions: ['BOTH'] }
    ]
  },
  {
    id: 'other-expense',
    label: 'その他の支出',
    description: 'その他の費用',
    color: '#6B7280',
    accounts: [
      { code: '6302', label: '支払手数料', shortLabel: '手数料', keywords: ['振込', '手数料', '残高証明'], frequency: 75, divisions: ['BOTH'] },
      { code: '6307', label: '租税公課', shortLabel: '租税公課', keywords: ['税金', '印紙'], frequency: 70, divisions: ['KANRI'] },
      { code: '6308', label: '雑費', shortLabel: '雑費', keywords: ['その他', '雑'], frequency: 65, divisions: ['KANRI'] },
      { code: '6311', label: '諸会費', shortLabel: '諸会費', keywords: ['自治会', '加入団体'], frequency: 40, divisions: ['KANRI'] }
    ]
  },
  {
    id: 'special-expense',
    label: '特別支出',
    description: '臨時的な支出',
    color: '#991B1B',
    accounts: [
      { code: '6501', label: '繰出金', shortLabel: '繰出金', keywords: ['繰出', '振替', '修繕会計'], frequency: 15, divisions: ['KANRI'] },
      { code: '6502', label: '雑損失', shortLabel: '雑損失', keywords: ['損失', '特別'], frequency: 5, divisions: ['BOTH'] }
    ]
  }
]

// 振替カテゴリー
export const transferCategories: AccountCategory[] = [
  {
    id: 'bank-transfer',
    label: '口座間振替',
    description: '銀行口座間の資金移動',
    color: '#10B981',
    accounts: [
      { code: '1102', label: '普通預金（管理）', shortLabel: '管理口座', keywords: ['管理', '普通預金'], frequency: 90 },
      { code: '1103', label: '普通預金（修繕）', shortLabel: '修繕口座', keywords: ['修繕', '普通預金'], frequency: 85 },
      { code: '1104', label: '定期預金', shortLabel: '定期預金', keywords: ['定期'], frequency: 50 },
      { code: '1101', label: '現金', shortLabel: '現金', keywords: ['現金', '小口'], frequency: 30 }
    ]
  }
]

// 検索関数
export function searchAccounts(query: string, type: 'income' | 'expense' | 'transfer', division?: 'KANRI' | 'SHUZEN' | 'PARKING' | 'OTHER'): AccountItem[] {
  const categories = type === 'income' ? incomeCategories : 
                    type === 'expense' ? expenseCategories : 
                    transferCategories
  
  const results: AccountItem[] = []
  const lowerQuery = query.toLowerCase()
  
  categories.forEach(category => {
    category.accounts.forEach(account => {
      // 会計区分でフィルタリング
      if (division && !isAccountAvailableForDivision(account, division)) {
        return // この科目はスキップ
      }
      
      const matchScore = calculateMatchScore(account, lowerQuery)
      if (matchScore > 0) {
        results.push({ ...account, frequency: matchScore })
      }
    })
  })
  
  return results.sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
}

// マッチスコア計算
function calculateMatchScore(account: AccountItem, query: string): number {
  let score = 0
  
  // コード完全一致
  if (account.code === query) return 1000
  
  // ラベル部分一致
  if (account.label.toLowerCase().includes(query)) score += 100
  if (account.shortLabel?.toLowerCase().includes(query)) score += 80
  
  // キーワード一致
  account.keywords?.forEach(keyword => {
    if (keyword.toLowerCase().includes(query)) score += 50
  })
  
  // 使用頻度を加算
  if (score > 0) score += (account.frequency || 0) / 10
  
  return score
}

// よく使う勘定科目を取得
export function getFrequentAccounts(type: 'income' | 'expense' | 'transfer', division?: 'KANRI' | 'SHUZEN' | 'PARKING' | 'OTHER', limit: number = 5): AccountItem[] {
  const categories = type === 'income' ? incomeCategories : 
                    type === 'expense' ? expenseCategories : 
                    transferCategories
  
  const allAccounts: AccountItem[] = []
  categories.forEach(category => {
    allAccounts.push(...category.accounts)
  })
  
  // 会計区分でフィルタリング
  const filteredAccounts = division 
    ? allAccounts.filter(account => isAccountAvailableForDivision(account, division))
    : allAccounts
  
  return filteredAccounts
    .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
    .slice(0, limit)
}

// 勘定科目が指定された会計区分で使用可能かチェック
export function isAccountAvailableForDivision(account: AccountItem, division: 'KANRI' | 'SHUZEN' | 'PARKING' | 'OTHER'): boolean {
  if (!account.divisions) return true // 区分指定がない場合は使用可能
  return account.divisions.includes(division) || account.divisions.includes('BOTH')
}