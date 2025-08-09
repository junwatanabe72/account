export type NormalBalance = 'DEBIT' | 'CREDIT'
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'

export interface ImportJson {
  clearExisting?: boolean
  journals: Array<{
    date: string
    description: string
    reference?: string
    details: Array<{
      accountCode: string
      debitAmount?: number
      creditAmount?: number
      description?: string
      auxiliaryCode?: string | null
    }>
  }>
  unitOwners?: Array<any>
  vendors?: Array<any>
  openingBalances?: {
    date: string
    entries: Array<{ accountCode: string, debitAmount?: number, creditAmount?: number }>
  }
}

class AuxiliaryLedger {
  constructor(
    public masterAccountCode: string,
    public auxiliaryCode: string,
    public name: string,
    public attributes: Record<string, any> = {}
  ) {}
  balance = 0
  transactions: Array<any> = []
  isActive = true
  createdAt = new Date()
  addTransaction(amount: number, isDebit: boolean, journalId: string, description: string) {
    const transaction: any = {
      date: new Date(), amount, isDebit, journalId, description, balance: this.balance
    }
    this.balance += isDebit ? amount : -amount
    ;(transaction as any).balanceAfter = this.balance
    this.transactions.push(transaction)
  }
  getDisplayBalance() { return Math.abs(this.balance) }
  isDebitBalance() { return this.balance >= 0 }
}

export type AccountDef = {
  code: string
  name: string
  type: AccountType
  normalBalance: NormalBalance
  level: number
  parentCode: string | null
  division: string | null
  isActive?: boolean
}

class HierarchicalAccount {
  constructor(
    public code: string,
    public name: string,
    public type: AccountType,
    public normalBalance: NormalBalance = 'DEBIT',
    public level = 4,
    public parentCode: string | null = null,
    public division: string | null = null
  ) {
    this.isPostable = this.level >= 4
  }
  children: HierarchicalAccount[] = []
  parent?: HierarchicalAccount
  balance = 0
  auxiliaryLedgers = new Map<string, AuxiliaryLedger>()
  hasAuxiliary = false
  isPostable: boolean
  isActive = true
  createAuxiliaryLedger(auxiliaryCode: string, name: string, attributes: Record<string, any> = {}) {
    const aux = new AuxiliaryLedger(this.code, auxiliaryCode, name, attributes)
    this.auxiliaryLedgers.set(auxiliaryCode, aux)
    this.hasAuxiliary = true
    return aux
  }
  getAuxiliaryLedger(auxiliaryCode: string) { return this.auxiliaryLedgers.get(auxiliaryCode) }
  getAllAuxiliaryLedgers() { return Array.from(this.auxiliaryLedgers.values()) }
  getAuxiliaryTotalBalance() { let t = 0; this.auxiliaryLedgers.forEach(a => t += a.balance); return t }
  addToBalance(amount: number, isDebit: boolean) {
    if (isDebit) this.balance += (this.normalBalance === 'DEBIT') ? amount : -amount
    else this.balance += (this.normalBalance === 'CREDIT') ? amount : -amount
  }
  getDisplayBalance() { return Math.abs(this.balance) }
  isDebitBalance() {
    return (this.normalBalance === 'DEBIT' && this.balance >= 0) ||
           (this.normalBalance === 'CREDIT' && this.balance < 0)
  }
  addChild(child: HierarchicalAccount) { this.children.push(child); child.parent = this }
  getAggregatedBalance(): number { return this.children.reduce((s, c) => s + c.getAggregatedBalance(), this.balance) }
}

class JournalDetail {
  constructor(
    public accountCode: string,
    public debitAmount = 0,
    public creditAmount = 0,
    public description = '',
    public auxiliaryCode: string | null = null
  ) {}
  getAmount() { return this.debitAmount || this.creditAmount }
  isDebit() { return this.debitAmount > 0 }
}

class Journal {
  id = Date.now().toString()
  number: string
  details: JournalDetail[] = []
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED' = 'DRAFT'
  createdAt = new Date()
  meta: Record<string, any> = {}
  constructor(public date: string, public description: string, reference = '') {
    this.number = reference || this.generateNumber()
  }
  private generateNumber() {
    const date = new Date(this.date)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
    return `J${year}${month}-${seq}`
  }
  addDetail(d: JournalDetail) { this.details.push(d) }
  getTotalDebit() { return this.details.reduce((s, d) => s + d.debitAmount, 0) }
  getTotalCredit() { return this.details.reduce((s, d) => s + d.creditAmount, 0) }
  isBalanced() { return Math.abs(this.getTotalDebit() - this.getTotalCredit()) < 0.01 }
  validate() {
    const errors: string[] = []
    if (this.details.length === 0) errors.push('仕訳明細がありません')
    if (!this.isBalanced()) errors.push('借方と貸方の金額が一致しません')
    if (this.details.some(d => d.debitAmount < 0 || d.creditAmount < 0)) errors.push('金額は0以上である必要があります')
    return errors
  }
}

class AccountingDivision {
  balance = 0
  isActive = true
  transferLimits: Record<string, number | undefined> = {}
  constructor(public code: string, public name: string, public description: string, public isRequired = true) {}
  canTransferTo(targetDivision: string, amount: number) {
    if (this.code === 'SHUZEN' && targetDivision !== 'SHUZEN') {
      return { allowed: false, reason: '修繕積立金は目的外使用が制限されています' }
    }
    const limit = this.transferLimits[targetDivision]
    if (limit && amount > limit) {
      return { allowed: false, reason: `振替限度額（¥${limit.toLocaleString()}）を超過しています` }
    }
    return { allowed: true }
  }
  setTransferLimit(targetDivision: string, limit: number) { this.transferLimits[targetDivision] = limit }
}

export class AccountingEngine {
  accounts = new Map<string, HierarchicalAccount>()
  journals: Journal[] = []
  divisions = new Map<string, AccountingDivision>()
  unitOwners = new Map<string, any>()
  vendors = new Map<string, any>()
  constructor() {
    this.initializeAccounts()
    this.initializeDivisions()
    this.initializeUnitOwners()
    this.initializeVendors()
    this.createUnitOwnerAuxiliaryAccounts()
    // デフォルトで2024年4月～2026年3月の2年分データを読み込む
    this.loadTwoYearSampleData()
  }
  initializeUnitOwners() {
    const data = [
      ['101', '田中太郎', 1, 70.5, 25000, 15000],
      ['102', '佐藤花子', 1, 65.2, 25000, 15000],
      ['201', '鈴木一郎', 2, 75.8, 30000, 18000],
      ['202', '高橋二郎', 2, 72.3, 28000, 17000],
      ['301', '山田三郎', 3, 80.0, 32000, 20000],
    ] as const
    data.forEach(([unitNumber, ownerName, floor, area, managementFee, repairReserve]) => {
      this.unitOwners.set(unitNumber, { unitNumber, ownerName, floor, area, managementFee, repairReserve, contact: '', bankAccount: '', isActive: true })
    })
  }
  initializeVendors() {
    const vendorsData = [
      ['V001', '株式会社マンション管理', '管理会社', '03-1234-5678'],
    ] as const
    vendorsData.forEach(([vendorCode, vendorName, category, contact]) => {
      this.vendors.set(vendorCode, { vendorCode, vendorName, category, contact, bankAccount: '', taxNumber: '', isActive: true })
    })
  }
  createUnitOwnerAuxiliaryAccounts() {
    const a1121 = this.accounts.get('1121')
    const a1122 = this.accounts.get('1122')
    if (a1121) {
      this.unitOwners.forEach((owner, unitNumber) => {
        a1121.createAuxiliaryLedger(unitNumber, `${unitNumber}号室`, { unitNumber, ownerName: owner.ownerName, floor: owner.floor, area: owner.area, monthlyAmount: owner.managementFee })
      })
    }
    if (a1122) {
      this.unitOwners.forEach((owner, unitNumber) => {
        a1122.createAuxiliaryLedger(unitNumber, `${unitNumber}号室`, { unitNumber, ownerName: owner.ownerName, floor: owner.floor, area: owner.area, monthlyAmount: owner.repairReserve })
      })
    }
  }
  initializeDivisions() {
    const d = [
      ['KANRI', '管理費会計', '日常的な管理運営費用を管理', true],
      ['SHUZEN', '修繕積立金会計', '修繕・改良工事費用を管理', true],
      ['PARKING', '駐車場会計', '駐車場運営収支を管理', false],
      ['SPECIAL', '特別会計', '特定目的の収支を管理', false],
    ] as const
    d.forEach(([code, name, description, isRequired]) => this.divisions.set(code, new AccountingDivision(code, name, description, isRequired)))
    const shuzen = this.divisions.get('SHUZEN')!
    shuzen.setTransferLimit('KANRI', 1000000)
  }
  initializeAccounts() {
    const data: Array<[string, string, AccountType, NormalBalance, number, string | null, string | null]> = [
      ['1', '資産の部', 'ASSET', 'DEBIT', 1, null, null],
      ['2', '負債の部', 'LIABILITY', 'CREDIT', 1, null, null],
      ['3', '正味財産の部', 'EQUITY', 'CREDIT', 1, null, null],
      ['4', '収益の部', 'REVENUE', 'CREDIT', 1, null, null],
      ['5', '費用の部', 'EXPENSE', 'DEBIT', 1, null, null],
      ['11', '流動資産', 'ASSET', 'DEBIT', 2, '1', null],
      ['12', '固定資産', 'ASSET', 'DEBIT', 2, '1', null],
      ['21', '流動負債', 'LIABILITY', 'CREDIT', 2, '2', null],
      ['31', '繰越収支差額', 'EQUITY', 'CREDIT', 2, '3', null],
      ['41', '管理費会計収益', 'REVENUE', 'CREDIT', 2, '4', null],
      ['42', '修繕積立金会計収益', 'REVENUE', 'CREDIT', 2, '4', null],
      ['43', '駐車場会計収益', 'REVENUE', 'CREDIT', 2, '4', null],
      ['51', '管理費会計費用', 'EXPENSE', 'DEBIT', 2, '5', null],
      ['52', '修繕積立金会計費用', 'EXPENSE', 'DEBIT', 2, '5', null],
      ['111', '現金預金', 'ASSET', 'DEBIT', 3, '11', null],
      ['112', '未収入金', 'ASSET', 'DEBIT', 3, '11', null],
      ['113', '前払金', 'ASSET', 'DEBIT', 3, '11', null],
      ['121', '建物設備', 'ASSET', 'DEBIT', 3, '12', null],
      ['211', '未払金', 'LIABILITY', 'CREDIT', 3, '21', null],
      ['212', '預り金', 'LIABILITY', 'CREDIT', 3, '21', null],
      ['311', '前期繰越収支差額', 'EQUITY', 'CREDIT', 3, '31', null],
      ['312', '当期収支差額', 'EQUITY', 'CREDIT', 3, '31', null],
      ['411', '基本収益', 'REVENUE', 'CREDIT', 3, '41', null],
      ['412', 'その他収益', 'REVENUE', 'CREDIT', 3, '41', null],
      ['421', '積立金収益', 'REVENUE', 'CREDIT', 3, '42', null],
      ['431', '駐車場収益', 'REVENUE', 'CREDIT', 3, '43', null],
      ['511', '管理業務費', 'EXPENSE', 'DEBIT', 3, '51', null],
      ['512', '維持管理費', 'EXPENSE', 'DEBIT', 3, '51', null],
      ['513', '事務費', 'EXPENSE', 'DEBIT', 3, '51', null],
      ['514', 'その他費用', 'EXPENSE', 'DEBIT', 3, '51', null],
      ['521', '修繕工事費', 'EXPENSE', 'DEBIT', 3, '52', null],
      ['522', '専門家費用', 'EXPENSE', 'DEBIT', 3, '52', null],
      ['1111', '現金', 'ASSET', 'DEBIT', 4, '111', null],
      ['1112', '普通預金（管理費会計）', 'ASSET', 'DEBIT', 4, '111', 'KANRI'],
      ['1113', '普通預金（修繕積立金会計）', 'ASSET', 'DEBIT', 4, '111', 'SHUZEN'],
      ['1114', '普通預金（駐車場会計）', 'ASSET', 'DEBIT', 4, '111', 'PARKING'],
      ['1115', '定期預金（修繕積立金）', 'ASSET', 'DEBIT', 4, '111', 'SHUZEN'],
      ['1121', '未収管理費', 'ASSET', 'DEBIT', 4, '112', 'KANRI'],
      ['1122', '未収修繕積立金', 'ASSET', 'DEBIT', 4, '112', 'SHUZEN'],
      ['1123', '未収駐車場使用料', 'ASSET', 'DEBIT', 4, '112', 'PARKING'],
      ['1131', '前払保険料', 'ASSET', 'DEBIT', 4, '113', 'KANRI'],
      ['1132', '前払管理委託費', 'ASSET', 'DEBIT', 4, '113', 'KANRI'],
      ['1211', '建物', 'ASSET', 'DEBIT', 4, '121', null],
      ['1212', '設備', 'ASSET', 'DEBIT', 4, '121', null],
      ['1213', '減価償却累計額', 'ASSET', 'CREDIT', 4, '121', null],
      ['2111', '未払金', 'LIABILITY', 'CREDIT', 4, '211', null],
      ['2112', '未払費用', 'LIABILITY', 'CREDIT', 4, '211', null],
      ['2113', '前受金', 'LIABILITY', 'CREDIT', 4, '211', null],
      ['2121', '預り金', 'LIABILITY', 'CREDIT', 4, '212', null],
      ['2122', '修繕積立金会計借受金', 'LIABILITY', 'CREDIT', 4, '212', null],
      ['3111', '前期繰越収支差額', 'EQUITY', 'CREDIT', 4, '311', null],
      ['3121', '当期収支差額', 'EQUITY', 'CREDIT', 4, '312', null],
      ['4111', '管理費収入', 'REVENUE', 'CREDIT', 4, '411', 'KANRI'],
      ['4121', '受取利息（管理費）', 'REVENUE', 'CREDIT', 4, '412', 'KANRI'],
      ['4122', 'その他収入', 'REVENUE', 'CREDIT', 4, '412', 'KANRI'],
      ['4211', '修繕積立金収入', 'REVENUE', 'CREDIT', 4, '421', 'SHUZEN'],
      ['4212', '受取利息（修繕積立金）', 'REVENUE', 'CREDIT', 4, '421', 'SHUZEN'],
      ['4213', '一時金収入', 'REVENUE', 'CREDIT', 4, '421', 'SHUZEN'],
      ['4311', '駐車場使用料収入', 'REVENUE', 'CREDIT', 4, '431', 'PARKING'],
      ['4312', '専用使用料収入', 'REVENUE', 'CREDIT', 4, '431', 'PARKING'],
      ['5111', '管理会社委託費', 'EXPENSE', 'DEBIT', 4, '511', 'KANRI'],
      ['5112', '管理員人件費', 'EXPENSE', 'DEBIT', 4, '511', 'KANRI'],
      ['5121', '清掃費', 'EXPENSE', 'DEBIT', 4, '512', 'KANRI'],
      ['5122', '設備保守費', 'EXPENSE', 'DEBIT', 4, '512', 'KANRI'],
      ['5123', 'エレベーター保守費', 'EXPENSE', 'DEBIT', 4, '512', 'KANRI'],
      ['5124', '共用部電気代', 'EXPENSE', 'DEBIT', 4, '512', 'KANRI'],
      ['5125', '共用部水道代', 'EXPENSE', 'DEBIT', 4, '512', 'KANRI'],
      ['5126', '植栽管理費', 'EXPENSE', 'DEBIT', 4, '512', 'KANRI'],
      ['5131', '理事会運営費', 'EXPENSE', 'DEBIT', 4, '513', 'KANRI'],
      ['5132', '総会費用', 'EXPENSE', 'DEBIT', 4, '513', 'KANRI'],
      ['5133', '通信費', 'EXPENSE', 'DEBIT', 4, '513', 'KANRI'],
      ['5134', '事務用品費', 'EXPENSE', 'DEBIT', 4, '513', 'KANRI'],
      ['5141', '火災保険料', 'EXPENSE', 'DEBIT', 4, '514', 'KANRI'],
      ['5142', '小修繕費', 'EXPENSE', 'DEBIT', 4, '514', 'KANRI'],
      ['5143', '消耗品費', 'EXPENSE', 'DEBIT', 4, '514', 'KANRI'],
      ['5144', '租税公課', 'EXPENSE', 'DEBIT', 4, '514', 'KANRI'],
      ['5211', '建物修繕工事費', 'EXPENSE', 'DEBIT', 4, '521', 'SHUZEN'],
      ['5212', '設備修繕工事費', 'EXPENSE', 'DEBIT', 4, '521', 'SHUZEN'],
      ['5213', '緊急修繕工事費', 'EXPENSE', 'DEBIT', 4, '521', 'SHUZEN'],
      ['5221', '建物診断費用', 'EXPENSE', 'DEBIT', 4, '522', 'SHUZEN'],
      ['5222', '設計監理費', 'EXPENSE', 'DEBIT', 4, '522', 'SHUZEN'],
      ['5223', '長期修繕計画作成費', 'EXPENSE', 'DEBIT', 4, '522', 'SHUZEN'],
    ]
    // build
    data.forEach(([code, name, type, normalBalance, level, parentCode, division]) => {
      const a = new HierarchicalAccount(code, name, type, normalBalance, level, parentCode, division)
      this.accounts.set(code, a)
    })
    this.accounts.forEach(acc => {
      if (acc.parentCode) {
        const p = this.accounts.get(acc.parentCode)
        if (p) p.addChild(acc)
      }
    })
  }
  getChartOfAccounts(): AccountDef[] {
    const defs: AccountDef[] = []
    this.accounts.forEach(a => {
      defs.push({ code: a.code, name: a.name, type: a.type, normalBalance: a.normalBalance, level: a.level, parentCode: a.parentCode, division: a.division, isActive: a.isActive })
    })
    return defs.sort((a,b) => a.code.localeCompare(b.code))
  }
  rebuildAccountsFrom(defs: AccountDef[]) {
    this.accounts = new Map()
    // create all
    defs.forEach(d => {
      const a = new HierarchicalAccount(d.code, d.name, d.type, d.normalBalance, d.level, d.parentCode, d.division)
      a.isActive = d.isActive !== false
      this.accounts.set(d.code, a)
    })
    // link parents
    this.accounts.forEach(acc => {
      if (acc.parentCode) {
        const p = this.accounts.get(acc.parentCode)
        if (p) p.addChild(acc)
      }
    })
    // recompute postable: level>=4 or leaf
    this.accounts.forEach(acc => { acc.isPostable = (acc.level >= 4) || acc.children.length === 0 })
    // rebuild auxiliaries for unit owners
    this.createUnitOwnerAuxiliaryAccounts()
  }
  addOrUpdateAccount(def: AccountDef) {
    if (def.level < 1 || def.level > 5) return { success: false as const, errors: ['levelは1-5で指定してください'] }
    if (def.parentCode && !this.accounts.has(def.parentCode)) return { success: false as const, errors: ['親コードが存在しません'] }
    const exists = this.accounts.get(def.code)
    if (exists) {
      exists.name = def.name
      exists.type = def.type
      exists.normalBalance = def.normalBalance
      exists.level = def.level
      exists.parentCode = def.parentCode
      exists.division = def.division
      exists.isActive = def.isActive !== false
      return { success: true as const }
    }
    const a = new HierarchicalAccount(def.code, def.name, def.type, def.normalBalance, def.level, def.parentCode, def.division)
    a.isActive = def.isActive !== false
    this.accounts.set(def.code, a)
    if (def.parentCode) {
      const p = this.accounts.get(def.parentCode)
      if (p) p.addChild(a)
    }
    return { success: true as const }
  }
  setAccountActive(code: string, active: boolean) {
    const a = this.accounts.get(code)
    if (!a) return { success: false as const, errors: ['勘定科目が見つかりません'] }
    a.isActive = active
    return { success: true as const }
  }
  createJournal(journalData: { date: string, description: string, reference?: string, details: Array<{ accountCode: string, debitAmount?: number, creditAmount?: number, description?: string, auxiliaryCode?: string | null }> }, options?: { autoPost?: boolean, meta?: Record<string, any> }) {
    const j = new Journal(journalData.date, journalData.description, journalData.reference)
    if (options?.meta) j.meta = { ...options.meta }
    // 入力検証（勘定存在/有効/仕訳可能、金額整合）
    const preErrors: string[] = []
    journalData.details.forEach(d => {
      const acc = this.accounts.get(d.accountCode)
      if (!acc) preErrors.push(`存在しない勘定科目コード: ${d.accountCode}`)
      else {
        const isLeaf = acc.children.length === 0
        const postable = acc.level >= 4 || isLeaf
        if (!postable) preErrors.push(`仕訳不可の勘定: ${acc.code} - ${acc.name}`)
        if (!acc.isActive) preErrors.push(`無効な勘定: ${acc.code} - ${acc.name}`)
      }
      const da = d.debitAmount ?? 0
      const ca = d.creditAmount ?? 0
      if (da < 0 || ca < 0) preErrors.push('金額は0以上である必要があります')
      if (da > 0 && ca > 0) preErrors.push(`同一明細に借方と貸方が同時指定されています: ${d.accountCode}`)
      if (da === 0 && ca === 0) preErrors.push(`借方または貸方の金額が必要です: ${d.accountCode}`)
    })
    if (preErrors.length) return { success: false as const, errors: Array.from(new Set(preErrors)) }

    journalData.details.forEach(d => j.addDetail(new JournalDetail(d.accountCode, d.debitAmount ?? 0, d.creditAmount ?? 0, d.description ?? '', d.auxiliaryCode ?? null)))
    const errors = j.validate()
    if (errors.length) return { success: false as const, errors }
    const divisionErrors = this.validateDivisionAccounting(j)
    if (divisionErrors.length) return { success: false as const, errors: divisionErrors }
    if (options?.autoPost !== false) {
      this.postJournal(j)
    }
    this.journals.push(j)
    return { success: true as const, journal: j }
  }
  submitJournal(id: string) {
    const j = this.journals.find(x => x.id === id)
    if (!j) return { success: false as const, errors: ['仕訳が見つかりません'] }
    if (j.status !== 'DRAFT') return { success: false as const, errors: ['DRAFTのみ提出できます'] }
    j.status = 'SUBMITTED'
    return { success: true as const }
  }
  approveJournal(id: string) {
    const j = this.journals.find(x => x.id === id)
    if (!j) return { success: false as const, errors: ['仕訳が見つかりません'] }
    if (j.status !== 'SUBMITTED') return { success: false as const, errors: ['SUBMITTEDのみ承認できます'] }
    j.status = 'APPROVED'
    return { success: true as const }
  }
  postJournalById(id: string) {
    const j = this.journals.find(x => x.id === id)
    if (!j) return { success: false as const, errors: ['仕訳が見つかりません'] }
    if (j.status !== 'APPROVED') return { success: false as const, errors: ['APPROVEDのみ記帳できます'] }
    this.postJournal(j)
    return { success: true as const }
  }
  deleteJournal(id: string) {
    const j = this.journals.find(x => x.id === id)
    if (!j) return { success: false as const, errors: ['仕訳が見つかりません'] }
    if (j.status === 'POSTED') return { success: false as const, errors: ['記帳済みは削除できません'] }
    this.journals = this.journals.filter(x => x.id !== id)
    return { success: true as const }
  }
  updateJournal(id: string, data: { date?: string, description?: string, reference?: string, details?: Array<{ accountCode: string, debitAmount?: number, creditAmount?: number, description?: string, auxiliaryCode?: string | null }> }) {
    const j = this.journals.find(x => x.id === id)
    if (!j) return { success: false as const, errors: ['仕訳が見つかりません'] }
    if (j.status === 'POSTED') return { success: false as const, errors: ['記帳済みは編集できません'] }

    const next = new Journal(data.date ?? j.date, data.description ?? j.description, data.reference ?? j.number)
    ;(data.details ?? j.details).forEach(d => next.addDetail(new JournalDetail(d.accountCode, d.debitAmount ?? 0, d.creditAmount ?? 0, d.description ?? '', d.auxiliaryCode ?? null)))

    const errors = next.validate()
    if (errors.length) return { success: false as const, errors }
    const divisionErrors = this.validateDivisionAccounting(next)
    if (divisionErrors.length) return { success: false as const, errors: divisionErrors }

    // apply mutable fields
    j.date = next.date
    j.description = next.description
    j.details = next.details
    // keep number as is; reference is number in this design

    return { success: true as const }
  }
  validateDivisionAccounting(journal: Journal) {
    const errors: string[] = []
    const divisionBalances = new Map<string, number>()
    journal.details.forEach(d => {
      const acc = this.accounts.get(d.accountCode)
      if (acc && acc.division) {
        const amount = (d.debitAmount || 0) - (d.creditAmount || 0)
        divisionBalances.set(acc.division, (divisionBalances.get(acc.division) ?? 0) + amount)
      }
    })
    const divisions = Array.from(divisionBalances.keys())
    if (divisions.length > 1) {
      for (let i = 0; i < divisions.length; i++) {
        for (let j = i + 1; j < divisions.length; j++) {
          const fromDivCode = divisions[i]
          const toDivCode = divisions[j]
          if (fromDivCode && toDivCode) {
            const fromDiv = this.divisions.get(fromDivCode)
            const amount = Math.abs(divisionBalances.get(fromDivCode) || 0)
            if (fromDiv) {
              const can = fromDiv.canTransferTo(toDivCode, amount)
              const toDivName = this.divisions.get(toDivCode)?.name || toDivCode
              if (!can.allowed) errors.push(`${fromDiv.name}から${toDivName}への振替: ${can.reason}`)
            }
          }
        }
      }
    }
    return errors
  }
  postJournal(journal: Journal) {
    // 記帳時に残高反映
    journal.details.forEach(d => {
      const acc = this.accounts.get(d.accountCode)
      if (!acc) return
      if ((d.debitAmount || 0) > 0) acc.addToBalance(d.debitAmount!, true)
      if ((d.creditAmount || 0) > 0) acc.addToBalance(d.creditAmount!, false)
      if (d.auxiliaryCode && acc.hasAuxiliary) {
        const aux = acc.getAuxiliaryLedger(d.auxiliaryCode)
        if (aux) aux.addTransaction(d.debitAmount || d.creditAmount || 0, (d.debitAmount || 0) > 0, journal.id, journal.description)
      }
      if (acc.division) {
        const division = this.divisions.get(acc.division)
        if (division) {
          const amount = (d.debitAmount || 0) - (d.creditAmount || 0)
          if (acc.normalBalance === 'DEBIT') division.balance += amount
          else division.balance -= amount
        }
      }
    })
    journal.status = 'POSTED'
  }
  serialize() {
    return {
      chartOfAccounts: this.getChartOfAccounts(),
      unitOwners: Array.from(this.unitOwners.values()),
      vendors: Array.from(this.vendors.values()),
      journals: this.journals.map(j => ({ id: j.id, number: j.number, date: j.date, description: j.description, status: j.status, details: j.details, meta: j.meta })),
      createdAt: new Date().toISOString(),
    }
  }
  restore(data: any) {
    this.clearAll()
    if (Array.isArray(data.chartOfAccounts) && data.chartOfAccounts.length > 0) {
      this.rebuildAccountsFrom(data.chartOfAccounts)
    } else {
      this.initializeAccounts()
    }
    if (data.unitOwners) {
      this.unitOwners = new Map(data.unitOwners.map((o: any) => [o.unitNumber, o]))
      this.rebuildAuxiliaryAccounts()
    }
    if (data.vendors) {
      this.vendors = new Map(data.vendors.map((v: any) => [v.vendorCode, v]))
    }
    if (Array.isArray(data.journals)) {
      for (const j of data.journals) {
        const res = this.createJournal({ date: j.date, description: j.description, reference: j.number, details: j.details }, { autoPost: j.status === 'POSTED', meta: j.meta })
        if (res.success) {
          const created = (res as any).journal as Journal
          if (j.status && j.status !== 'POSTED') {
            created.status = j.status
          }
        }
      }
    }
    return true
  }
  getTrialBalance() {
    const lines: Array<{ code: string, name: string, debitBalance: number, creditBalance: number }> = []
    let totalDebit = 0
    let totalCredit = 0
    this.accounts.forEach(acc => {
      if (acc.balance !== 0) {
        const bal = acc.getDisplayBalance()
        const isDebit = acc.isDebitBalance()
        lines.push({ code: acc.code, name: acc.name, debitBalance: isDebit ? bal : 0, creditBalance: !isDebit ? bal : 0 })
        if (isDebit) totalDebit += bal; else totalCredit += bal
      }
    })
    lines.sort((a, b) => a.code.localeCompare(b.code))
    return { accounts: lines, totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 }
  }
  getAccounts() { return Array.from(this.accounts.values()).sort((a, b) => a.code.localeCompare(b.code)) }
  getIncomeStatement() {
    const revenues: Array<{ code: string, name: string, amount: number }> = []
    const expenses: Array<{ code: string, name: string, amount: number }> = []
    let totalRevenue = 0
    let totalExpense = 0
    this.accounts.forEach(acc => {
      if (acc.balance !== 0) {
        const amt = acc.getDisplayBalance()
        if (acc.type === 'REVENUE') { revenues.push({ code: acc.code, name: acc.name, amount: amt }); totalRevenue += amt }
        else if (acc.type === 'EXPENSE') { expenses.push({ code: acc.code, name: acc.name, amount: amt }); totalExpense += amt }
      }
    })
    revenues.sort((a, b) => a.code.localeCompare(b.code))
    expenses.sort((a, b) => a.code.localeCompare(b.code))
    const netIncome = totalRevenue - totalExpense
    return { revenues, expenses, totalRevenue, totalExpense, netIncome }
  }
  getBalanceSheet() {
    const assets: Array<{ code: string, name: string, amount: number }> = []
    const liabilities: Array<{ code: string, name: string, amount: number }> = []
    const equity: Array<{ code: string, name: string, amount: number }> = []
    let totalAssets = 0, totalLiabilities = 0, totalEquity = 0
    
    this.accounts.forEach(acc => {
      if (acc.balance !== 0) {
        const amt = acc.getDisplayBalance()
        if (acc.type === 'ASSET') { 
          assets.push({ code: acc.code, name: acc.name, amount: amt })
          totalAssets += acc.isDebitBalance() ? amt : -amt
        }
        else if (acc.type === 'LIABILITY') { 
          liabilities.push({ code: acc.code, name: acc.name, amount: amt })
          totalLiabilities += acc.isDebitBalance() ? -amt : amt
        }
        else if (acc.type === 'EQUITY') { 
          equity.push({ code: acc.code, name: acc.name, amount: amt })
          totalEquity += acc.isDebitBalance() ? -amt : amt
        }
      }
    })
    
    const pl = this.getIncomeStatement()
    if (pl.netIncome !== 0) { 
      equity.push({ code: '3121', name: '当期収支差額', amount: Math.abs(pl.netIncome) })
      totalEquity += pl.netIncome
    }
    
    assets.sort((a, b) => a.code.localeCompare(b.code))
    liabilities.sort((a, b) => a.code.localeCompare(b.code))
    equity.sort((a, b) => a.code.localeCompare(b.code))
    
    return { 
      assets, 
      liabilities, 
      equity, 
      totalAssets, 
      totalLiabilities, 
      totalEquity, 
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 
    }
  }
  createClosingEntries(closingDate: string) {
    // 収益・費用を各会計区分ごとに当期収支差額(3121)へ振替
    const divisions = new Set<string | null>()
    this.accounts.forEach(acc => {
      if ((acc.type === 'REVENUE' || acc.type === 'EXPENSE') && acc.balance !== 0) {
        divisions.add(acc.division || null)
      }
    })
    let createdCount = 0
    const results: Array<{ division: string | null, success: boolean, error?: string }> = []
    divisions.forEach(divCode => {
      // 集計
      const revenueAccounts: Array<{ code: string, amount: number }> = []
      const expenseAccounts: Array<{ code: string, amount: number }> = []
      this.accounts.forEach(acc => {
        if (acc.division === divCode && acc.balance !== 0) {
          const amt = acc.getDisplayBalance()
          if (acc.type === 'REVENUE' && amt > 0) revenueAccounts.push({ code: acc.code, amount: amt })
          if (acc.type === 'EXPENSE' && amt > 0) expenseAccounts.push({ code: acc.code, amount: amt })
        }
      })
      const totalRevenue = revenueAccounts.reduce((s, a) => s + a.amount, 0)
      const totalExpense = expenseAccounts.reduce((s, a) => s + a.amount, 0)
      if (totalRevenue === 0 && totalExpense === 0) { results.push({ division: divCode, success: true }); return }
      const details: Array<{ accountCode: string, debitAmount?: number, creditAmount?: number }> = []
      revenueAccounts.forEach(a => details.push({ accountCode: a.code, debitAmount: a.amount }))
      expenseAccounts.forEach(a => details.push({ accountCode: a.code, creditAmount: a.amount }))
      const net = totalRevenue - totalExpense
      if (net >= 0) details.push({ accountCode: '3121', creditAmount: net })
      else details.push({ accountCode: '3121', debitAmount: -net })
      const res = this.createJournal({ date: closingDate, description: '期末振替（収益・費用→当期収支差額）', details }, { meta: { source: 'CLOSING', division: divCode || 'OTHER' } })
      if ((res as any).success) { createdCount++; results.push({ division: divCode, success: true }) }
      else { results.push({ division: divCode, success: false, error: (res as any).errors?.join(', ') }) }
    })
    return { success: true as const, createdCount, results }
  }
  importJsonData(json: ImportJson) {
    try {
      if (!json.journals || !Array.isArray(json.journals)) throw new Error('JSONデータに正しい形式のjournals配列が含まれていません')
      if (json.clearExisting !== false) this.clearAll()

      // unitOwners/vendors を反映（存在する場合）
      if (json.unitOwners && Array.isArray(json.unitOwners)) {
        this.unitOwners = new Map(json.unitOwners.map((o: any) => [o.unitNumber, {
          unitNumber: o.unitNumber,
          ownerName: o.ownerName,
          floor: o.floor ?? 1,
          area: o.area ?? 0,
          managementFee: o.managementFee ?? 0,
          repairReserve: o.repairReserve ?? 0,
          contact: o.contact ?? '',
          bankAccount: o.bankAccount ?? '',
          isActive: o.isActive !== false,
        }]))
        this.rebuildAuxiliaryAccounts()
      }
      if (json.vendors && Array.isArray(json.vendors)) {
        this.vendors = new Map(json.vendors.map((v: any) => [v.vendorCode, {
          vendorCode: v.vendorCode,
          vendorName: v.vendorName,
          category: v.category ?? '',
          contact: v.contact ?? '',
          bankAccount: v.bankAccount ?? '',
          taxNumber: v.taxNumber ?? '',
          isActive: v.isActive !== false,
        }]))
      }

      // openingBalances を先に適用（存在する場合）
      if (json.openingBalances && Array.isArray(json.openingBalances.entries)) {
        const ob = json.openingBalances
        const res = this.createOpeningBalance(ob.date, ob.entries)
        if (!(res as any).success) {
          throw new Error('期首残高仕訳の作成に失敗: ' + (res as any).errors?.join(', '))
        }
      }

      const results: Array<{ index: number, success: boolean, error: string | null }> = []
      json.journals.forEach((j, idx) => {
        if (!j.date || !j.description || !j.details) {
          results.push({ index: idx, success: false, error: '日付、摘要、仕訳明細は必須項目です' }); return
        }
        if (!Array.isArray(j.details) || j.details.length === 0) {
          results.push({ index: idx, success: false, error: '仕訳明細が正しい形式ではありません' }); return
        }
        let ok = true
        for (const d of j.details) {
          if (!d.accountCode || (d.debitAmount === undefined && d.creditAmount === undefined) || ((d.debitAmount ?? 0) < 0 || (d.creditAmount ?? 0) < 0)) { ok = false; break }
        }
        if (!ok) { results.push({ index: idx, success: false, error: '仕訳明細の形式が正しくありません（勘定科目コード、借方金額または貸方金額が必要）' }); return }
        const res = this.createJournal(j)
        results.push({ index: idx, success: res.success, error: res.success ? null : (res as any).errors.join(', ') })
      })
      const successCount = results.filter(r => r.success).length
      const failureCount = results.length - successCount
      return { success: true as const, totalJournals: json.journals.length, successCount, failureCount, results }
    } catch (e: any) {
      return { success: false as const, error: e.message }
    }
  }
  createOpeningBalance(date: string, entries: Array<{ accountCode: string, debitAmount?: number, creditAmount?: number }>) {
    const details = entries.map(e => ({ accountCode: e.accountCode, debitAmount: e.debitAmount ?? 0, creditAmount: e.creditAmount ?? 0 }))
    const totalDebit = details.reduce((s, d) => s + (d.debitAmount || 0), 0)
    const totalCredit = details.reduce((s, d) => s + (d.creditAmount || 0), 0)
    if (Math.abs(totalDebit - totalCredit) >= 0.01) {
      return { success: false as const, errors: ['期首残高の借方合計と貸方合計が一致していません'] }
    }
    return this.createJournal({ date, description: '期首残高', details })
  }
  loadSampleData2024() {
    this.clearAll()
    
    const sample2024 = [
      // 前期繰越残高
      { date: '2024-03-01', description: '前期繰越残高', details: [ 
        { accountCode: '1112', debitAmount: 1500000 }, 
        { accountCode: '1113', debitAmount: 441186 }, 
        { accountCode: '3111', creditAmount: 1941186 }
      ]},
      
      // 管理費収入
      { date: '2024-03-01', description: '管理費', details: [ 
        { accountCode: '1121', debitAmount: 6231720 }, 
        { accountCode: '4111', creditAmount: 6231720 } 
      ]},
      { date: '2024-03-02', description: 'テラス・バルコニー使用料', details: [ 
        { accountCode: '1112', debitAmount: 33720 }, 
        { accountCode: '4122', creditAmount: 33720 } 
      ]},
      { date: '2024-03-03', description: 'デスク使用料', details: [ 
        { accountCode: '1112', debitAmount: 57600 }, 
        { accountCode: '4122', creditAmount: 57600 } 
      ]},
      { date: '2024-03-04', description: 'ペット置場使用料', details: [ 
        { accountCode: '1112', debitAmount: 72000 }, 
        { accountCode: '4122', creditAmount: 72000 } 
      ]},
      { date: '2024-03-05', description: '自転車置場使用料', details: [ 
        { accountCode: '1112', debitAmount: 94800 }, 
        { accountCode: '4122', creditAmount: 94800 } 
      ]},
      { date: '2024-03-06', description: '雑収入 光ファイバー通信電気料', details: [ 
        { accountCode: '1112', debitAmount: 25270 }, 
        { accountCode: '4122', creditAmount: 25270 } 
      ]},
      { date: '2024-03-07', description: '雑収入 電柱敷地料', details: [ 
        { accountCode: '1112', debitAmount: 4500 }, 
        { accountCode: '4122', creditAmount: 4500 } 
      ]},
      { date: '2024-03-08', description: '雑収入 保険金', details: [ 
        { accountCode: '1112', debitAmount: 9340 }, 
        { accountCode: '4122', creditAmount: 9340 } 
      ]},
      
      // 管理費支出
      { date: '2024-03-10', description: '電気料', details: [ 
        { accountCode: '5124', debitAmount: 867814 }, 
        { accountCode: '1112', creditAmount: 867814 } 
      ]},
      { date: '2024-03-11', description: '水道料', details: [ 
        { accountCode: '5125', debitAmount: 30184 }, 
        { accountCode: '1112', creditAmount: 30184 } 
      ]},
      { date: '2024-03-12', description: '通信費', details: [ 
        { accountCode: '5133', debitAmount: 57137 }, 
        { accountCode: '1112', creditAmount: 57137 } 
      ]},
      { date: '2024-03-13', description: 'エレベーター点検費', details: [ 
        { accountCode: '5123', debitAmount: 514800 }, 
        { accountCode: '1112', creditAmount: 514800 } 
      ]},
      { date: '2024-03-14', description: '宅配ボックス点検費', details: [ 
        { accountCode: '5122', debitAmount: 52800 }, 
        { accountCode: '1112', creditAmount: 52800 } 
      ]},
      { date: '2024-03-15', description: '定期清掃費', details: [ 
        { accountCode: '5121', debitAmount: 120000 }, 
        { accountCode: '1112', creditAmount: 120000 } 
      ]},
      { date: '2024-03-16', description: '雑排水管洗浄作業費', details: [ 
        { accountCode: '5122', debitAmount: 220000 }, 
        { accountCode: '1112', creditAmount: 220000 } 
      ]},
      { date: '2024-03-17', description: '特殊建築物定期検査費', details: [ 
        { accountCode: '5122', debitAmount: 121000 }, 
        { accountCode: '1112', creditAmount: 121000 } 
      ]},
      { date: '2024-03-18', description: '植栽管理費', details: [ 
        { accountCode: '5126', debitAmount: 66000 }, 
        { accountCode: '1112', creditAmount: 66000 } 
      ]},
      { date: '2024-03-19', description: '小修繕費', details: [ 
        { accountCode: '5142', debitAmount: 384758 }, 
        { accountCode: '1112', creditAmount: 384758 } 
      ]},
      { date: '2024-03-20', description: '組合運営費', details: [ 
        { accountCode: '5131', debitAmount: 42880 }, 
        { accountCode: '1112', creditAmount: 42880 } 
      ]},
      { date: '2024-03-21', description: '消耗品費', details: [ 
        { accountCode: '5143', debitAmount: 6160 }, 
        { accountCode: '1112', creditAmount: 6160 } 
      ]},
      { date: '2024-03-22', description: '銀行手数料', details: [ 
        { accountCode: '5133', debitAmount: 87175 }, 
        { accountCode: '1112', creditAmount: 87175 } 
      ]},
      { date: '2024-03-23', description: '保険料', details: [ 
        { accountCode: '5141', debitAmount: 488430 }, 
        { accountCode: '1112', creditAmount: 488430 } 
      ]},
      { date: '2024-03-24', description: '管理委託費', details: [ 
        { accountCode: '5111', debitAmount: 3689400 }, 
        { accountCode: '1112', creditAmount: 3689400 } 
      ]},
      
      // 管理費入金（期中）
      { date: '2024-03-25', description: '管理費入金（口座振替）', details: [ 
        { accountCode: '1112', debitAmount: 6231720 }, 
        { accountCode: '1121', creditAmount: 6231720 } 
      ]},
    ]
    
    this.executeSampleData(sample2024, '2024')
    return true
  }

  loadSampleData2025() {
    this.clearAll()
    
    const sample2025 = [
      // 前期繰越残高（2024年の結果を反映）
      { date: '2025-03-01', description: '前期繰越残高', details: [ 
        { accountCode: '1112', debitAmount: 1000000 }, 
        { accountCode: '1113', debitAmount: 721598 }, 
        { accountCode: '3111', creditAmount: 1721598 }
      ]},
      
      // 管理費収入（2025年度）
      { date: '2025-03-01', description: '管理費', details: [ 
        { accountCode: '1121', debitAmount: 6500000 }, 
        { accountCode: '4111', creditAmount: 6500000 } 
      ]},
      { date: '2025-03-02', description: 'テラス・バルコニー使用料', details: [ 
        { accountCode: '1112', debitAmount: 35000 }, 
        { accountCode: '4122', creditAmount: 35000 } 
      ]},
      { date: '2025-03-03', description: 'デスク使用料', details: [ 
        { accountCode: '1112', debitAmount: 60000 }, 
        { accountCode: '4122', creditAmount: 60000 } 
      ]},
      { date: '2025-03-04', description: 'ペット置場使用料', details: [ 
        { accountCode: '1112', debitAmount: 75000 }, 
        { accountCode: '4122', creditAmount: 75000 } 
      ]},
      { date: '2025-03-05', description: '自転車置場使用料', details: [ 
        { accountCode: '1112', debitAmount: 98000 }, 
        { accountCode: '4122', creditAmount: 98000 } 
      ]},
      
      // 管理費支出（2025年度、インフレを考慮して増額）
      { date: '2025-03-10', description: '電気料', details: [ 
        { accountCode: '5124', debitAmount: 920000 }, 
        { accountCode: '1112', creditAmount: 920000 } 
      ]},
      { date: '2025-03-11', description: '水道料', details: [ 
        { accountCode: '5125', debitAmount: 32000 }, 
        { accountCode: '1112', creditAmount: 32000 } 
      ]},
      { date: '2025-03-12', description: '通信費', details: [ 
        { accountCode: '5133', debitAmount: 60000 }, 
        { accountCode: '1112', creditAmount: 60000 } 
      ]},
      { date: '2025-03-13', description: 'エレベーター点検費', details: [ 
        { accountCode: '5123', debitAmount: 530000 }, 
        { accountCode: '1112', creditAmount: 530000 } 
      ]},
      { date: '2025-03-14', description: '宅配ボックス点検費', details: [ 
        { accountCode: '5122', debitAmount: 55000 }, 
        { accountCode: '1112', creditAmount: 55000 } 
      ]},
      { date: '2025-03-15', description: '定期清掃費', details: [ 
        { accountCode: '5121', debitAmount: 125000 }, 
        { accountCode: '1112', creditAmount: 125000 } 
      ]},
      { date: '2025-03-20', description: '組合運営費', details: [ 
        { accountCode: '5131', debitAmount: 45000 }, 
        { accountCode: '1112', creditAmount: 45000 } 
      ]},
      { date: '2025-03-23', description: '保険料', details: [ 
        { accountCode: '5141', debitAmount: 510000 }, 
        { accountCode: '1112', creditAmount: 510000 } 
      ]},
      { date: '2025-03-24', description: '管理委託費', details: [ 
        { accountCode: '5111', debitAmount: 3800000 }, 
        { accountCode: '1112', creditAmount: 3800000 } 
      ]},
      
      // 管理費入金（期中）
      { date: '2025-03-25', description: '管理費入金（口座振替）', details: [ 
        { accountCode: '1112', debitAmount: 6500000 }, 
        { accountCode: '1121', creditAmount: 6500000 } 
      ]},
    ]
    
    this.executeSampleData(sample2025, '2025')
    return true
  }

  loadTwoYearSampleData() {
    this.clearAll()
    
    const twoYearSample = [
      // 期首繰越残高（2024年4月1日）
      { date: '2024-04-01', description: '期首繰越残高', details: [ 
        { accountCode: '1112', debitAmount: 5000000 }, // 普通預金（管理費）
        { accountCode: '1113', debitAmount: 8000000 }, // 普通預金（修繕）
        { accountCode: '3111', creditAmount: 13000000 } // 前期繰越収支差額
      ]},
    ]
    
    // 24ヶ月分の月次データを生成
    const months = [
      // 2024年度
      { year: 2024, month: 4 }, { year: 2024, month: 5 }, { year: 2024, month: 6 },
      { year: 2024, month: 7 }, { year: 2024, month: 8 }, { year: 2024, month: 9 },
      { year: 2024, month: 10 }, { year: 2024, month: 11 }, { year: 2024, month: 12 },
      // 2025年
      { year: 2025, month: 1 }, { year: 2025, month: 2 }, { year: 2025, month: 3 },
      { year: 2025, month: 4 }, { year: 2025, month: 5 }, { year: 2025, month: 6 },
      { year: 2025, month: 7 }, { year: 2025, month: 8 }, { year: 2025, month: 9 },
      { year: 2025, month: 10 }, { year: 2025, month: 11 }, { year: 2025, month: 12 },
      // 2026年（第一四半期）
      { year: 2026, month: 1 }, { year: 2026, month: 2 }, { year: 2026, month: 3 }
    ]
    
    months.forEach(({ year, month }) => {
      const monthStr = String(month).padStart(2, '0')
      const datePrefix = `${year}-${monthStr}`
      
      // 月次管理費収入（月初）
      const managementFeeAmount = year <= 2024 ? 520000 : 550000 // 2025年以降はインフレ調整
      twoYearSample.push({
        date: `${datePrefix}-01`,
        description: `${month}月分管理費`,
        details: [
          { accountCode: '1121', debitAmount: managementFeeAmount },
          { accountCode: '4111', creditAmount: managementFeeAmount }
        ]
      })
      
      // その他使用料収入（月初）
      const otherFeeAmount = Math.floor(Math.random() * 20000) + 10000 // 10,000～30,000円のランダム
      twoYearSample.push({
        date: `${datePrefix}-02`,
        description: `${month}月分その他使用料`,
        details: [
          { accountCode: '1112', debitAmount: otherFeeAmount },
          { accountCode: '4122', creditAmount: otherFeeAmount }
        ]
      })
      
      // 月次支出 - 電気料（月の5日）
      const electricityAmount = year <= 2024 ? 
        Math.floor(Math.random() * 30000) + 60000 : // 2024年: 60,000～90,000円
        Math.floor(Math.random() * 35000) + 70000   // 2025年以降: 70,000～105,000円
      twoYearSample.push({
        date: `${datePrefix}-05`,
        description: `${month}月分電気料`,
        details: [
          { accountCode: '5124', debitAmount: electricityAmount },
          { accountCode: '1112', creditAmount: electricityAmount }
        ]
      })
      
      // 水道料（月の6日）
      const waterAmount = Math.floor(Math.random() * 5000) + 2000 // 2,000～7,000円
      twoYearSample.push({
        date: `${datePrefix}-06`,
        description: `${month}月分水道料`,
        details: [
          { accountCode: '5125', debitAmount: waterAmount },
          { accountCode: '1112', creditAmount: waterAmount }
        ]
      })
      
      // 清掃費（月の10日）
      const cleaningAmount = year <= 2024 ? 95000 : 105000
      twoYearSample.push({
        date: `${datePrefix}-10`,
        description: `${month}月分定期清掃費`,
        details: [
          { accountCode: '5121', debitAmount: cleaningAmount },
          { accountCode: '1112', creditAmount: cleaningAmount }
        ]
      })
      
      // エレベーター保守費（月の12日）
      const elevatorAmount = year <= 2024 ? 42000 : 45000
      twoYearSample.push({
        date: `${datePrefix}-12`,
        description: `${month}月分エレベーター保守費`,
        details: [
          { accountCode: '5123', debitAmount: elevatorAmount },
          { accountCode: '1112', creditAmount: elevatorAmount }
        ]
      })
      
      // 管理委託費（月の15日）
      const managementCommissionAmount = year <= 2024 ? 290000 : 315000
      twoYearSample.push({
        date: `${datePrefix}-15`,
        description: `${month}月分管理委託費`,
        details: [
          { accountCode: '5111', debitAmount: managementCommissionAmount },
          { accountCode: '1112', creditAmount: managementCommissionAmount }
        ]
      })
      
      // 季節変動費用
      if (month >= 6 && month <= 9) { // 夏季（6-9月）
        const summerExpenseAmount = Math.floor(Math.random() * 15000) + 10000
        twoYearSample.push({
          date: `${datePrefix}-18`,
          description: `${month}月分植栽管理費（夏季）`,
          details: [
            { accountCode: '5126', debitAmount: summerExpenseAmount },
            { accountCode: '1112', creditAmount: summerExpenseAmount }
          ]
        })
      }
      
      if (month >= 11 || month <= 2) { // 冬季（11-2月）
        const winterExpenseAmount = Math.floor(Math.random() * 8000) + 5000
        twoYearSample.push({
          date: `${datePrefix}-20`,
          description: `${month}月分除雪・融雪費`,
          details: [
            { accountCode: '5143', debitAmount: winterExpenseAmount },
            { accountCode: '1112', creditAmount: winterExpenseAmount }
          ]
        })
      }
      
      // 小修繕費（不定期、30%の確率）
      if (Math.random() < 0.3) {
        const repairAmount = Math.floor(Math.random() * 50000) + 20000 // 20,000～70,000円
        twoYearSample.push({
          date: `${datePrefix}-22`,
          description: `${month}月分小修繕費`,
          details: [
            { accountCode: '5142', debitAmount: repairAmount },
            { accountCode: '1112', creditAmount: repairAmount }
          ]
        })
      }
      
      // 管理費入金（口座振替、月の25日）
      twoYearSample.push({
        date: `${datePrefix}-25`,
        description: `${month}月分管理費入金（口座振替）`,
        details: [
          { accountCode: '1112', debitAmount: managementFeeAmount },
          { accountCode: '1121', creditAmount: managementFeeAmount }
        ]
      })
      
      // 年次支出（特定月のみ）
      if (month === 4) { // 4月：保険料年間分
        const insuranceAmount = year <= 2024 ? 480000 : 520000
        twoYearSample.push({
          date: `${datePrefix}-30`,
          description: `${year}年度保険料`,
          details: [
            { accountCode: '5141', debitAmount: insuranceAmount },
            { accountCode: '1112', creditAmount: insuranceAmount }
          ]
        })
      }
      
      if (month === 6) { // 6月：組合運営費
        const operationAmount = year <= 2024 ? 150000 : 160000
        twoYearSample.push({
          date: `${datePrefix}-28`,
          description: `${year}年度総会運営費`,
          details: [
            { accountCode: '5131', debitAmount: operationAmount },
            { accountCode: '1112', creditAmount: operationAmount }
          ]
        })
      }
      
      if (month === 9) { // 9月：大規模修繕工事費
        const majorRepairAmount = year <= 2024 ? 800000 : 900000
        twoYearSample.push({
          date: `${datePrefix}-30`,
          description: `${year}年度大規模修繕工事費`,
          details: [
            { accountCode: '5211', debitAmount: majorRepairAmount },
            { accountCode: '1113', creditAmount: majorRepairAmount }
          ]
        })
      }
    })
    
    this.executeSampleData(twoYearSample, '2024-2026')
    return true
  }

  loadSampleData() {
    return this.loadTwoYearSampleData()
  }

  private executeSampleData(sample: any[], year: string) {
    sample.forEach((j, index) => { 
      const r = this.createJournal(j as any)
      if (!(r as any).success) {
        console.error(`Sample journal ${index} failed for ${year}:`, r)
        console.error('Journal data:', j)
      }
    })
  }
  clearAll() {
    this.journals = []
    this.accounts.forEach(a => {
      a.balance = 0
      a.auxiliaryLedgers.forEach(aux => { aux.balance = 0; aux.transactions = [] })
    })
    this.divisions.forEach(d => { d.balance = 0 })
  }
  rebuildAuxiliaryAccounts() {
    const a1121 = this.accounts.get('1121')
    const a1122 = this.accounts.get('1122')
    if (a1121) { a1121.auxiliaryLedgers.clear(); a1121.hasAuxiliary = false }
    if (a1122) { a1122.auxiliaryLedgers.clear(); a1122.hasAuxiliary = false }
    this.createUnitOwnerAuxiliaryAccounts()
  }
  getAuxiliaryLedgerSummary() {
    const summary: Array<{ masterAccountCode: string, masterAccountName: string, auxiliaryCode: string, auxiliaryName: string, balance: number, displayBalance: number, isDebitBalance: boolean, attributes: Record<string, any>, transactionCount: number }> = []
    this.accounts.forEach(acc => {
      if (acc.hasAuxiliary && acc.auxiliaryLedgers.size > 0) {
        acc.getAllAuxiliaryLedgers()
          .filter(aux => aux.balance !== 0 || aux.transactions.length > 0)
          .forEach(aux => {
            summary.push({
              masterAccountCode: acc.code,
              masterAccountName: acc.name,
              auxiliaryCode: aux.auxiliaryCode,
              auxiliaryName: aux.name,
              balance: aux.balance,
              displayBalance: aux.getDisplayBalance(),
              isDebitBalance: aux.isDebitBalance(),
              attributes: aux.attributes,
              transactionCount: aux.transactions.length,
            })
          })
      }
    })
    return summary.sort((a, b) => a.masterAccountCode === b.masterAccountCode ? a.auxiliaryCode.localeCompare(b.auxiliaryCode) : a.masterAccountCode.localeCompare(b.masterAccountCode))
  }
  getUnitReceivablesSummary() {
    const summary: Array<{ unitNumber: string, ownerName: string, floor: number, managementFeeBalance: number, repairReserveBalance: number, totalBalance: number, monthlyManagementFee: number, monthlyRepairReserve: number }> = []
    const mf = this.accounts.get('1121')
    const rr = this.accounts.get('1122')
    this.unitOwners.forEach((owner, unitNumber) => {
      const mfAux = mf?.getAuxiliaryLedger(unitNumber)
      const rrAux = rr?.getAuxiliaryLedger(unitNumber)
      const m = mfAux?.balance || 0
      const r = rrAux?.balance || 0
      const total = m + r
      if (total !== 0) {
        summary.push({ unitNumber, ownerName: owner.ownerName, floor: owner.floor, managementFeeBalance: m, repairReserveBalance: r, totalBalance: total, monthlyManagementFee: owner.managementFee, monthlyRepairReserve: owner.repairReserve })
      }
    })
    return summary.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber))
  }
  createMonthlyBilling(billingDate: string) {
    const details: Array<{ accountCode: string, debitAmount?: number, creditAmount?: number, auxiliaryCode?: string | null }> = []
    let totalMF = 0
    let totalRR = 0
    this.unitOwners.forEach((owner, unitNumber) => {
      if (owner.isActive) {
        const mf = Math.max(0, Number(owner.managementFee) || 0)
        const rr = Math.max(0, Number(owner.repairReserve) || 0)
        if (mf > 0) {
          details.push({ accountCode: '1121', debitAmount: mf, auxiliaryCode: unitNumber })
          totalMF += mf
        }
        if (rr > 0) {
          details.push({ accountCode: '1122', debitAmount: rr, auxiliaryCode: unitNumber })
          totalRR += rr
        }
      }
    })
    if (totalMF === 0 && totalRR === 0) {
      return { success: false as const, errors: ['有効な組合員が存在しないか、月額が設定されていません'] }
    }
    if (totalMF > 0) details.push({ accountCode: '4111', creditAmount: totalMF })
    if (totalRR > 0) details.push({ accountCode: '4211', creditAmount: totalRR })
    const res = this.createJournal({ date: billingDate, description: `${billingDate.substring(0, 7)}月分管理費・修繕積立金請求`, details }, { meta: { source: 'MONTHLY_BILLING', period: billingDate.substring(0,7) } })
    return res
  }
  exportCurrentBalancesAsOpeningDetails() {
    const entries: Array<{ accountCode: string, debitAmount?: number, creditAmount?: number }> = []
    this.accounts.forEach(acc => {
      if (acc.balance !== 0) {
        const amt = acc.getDisplayBalance()
        if (acc.isDebitBalance()) entries.push({ accountCode: acc.code, debitAmount: amt })
        else entries.push({ accountCode: acc.code, creditAmount: amt })
      }
    })
    return entries
  }
  getDivisionTrialBalance() {
    const result = new Map<string, { name: string, assets: any[], liabilities: any[], equity: any[], revenues: any[], expenses: any[], totalAssets: number, totalLiabilities: number, totalEquity: number, totalRevenues: number, totalExpenses: number }>()
    this.divisions.forEach((division, code) => {
      result.set(code, { name: division.name, assets: [], liabilities: [], equity: [], revenues: [], expenses: [], totalAssets: 0, totalLiabilities: 0, totalEquity: 0, totalRevenues: 0, totalExpenses: 0 })
    })
    result.set('OTHER', { name: 'その他', assets: [], liabilities: [], equity: [], revenues: [], expenses: [], totalAssets: 0, totalLiabilities: 0, totalEquity: 0, totalRevenues: 0, totalExpenses: 0 })
    this.accounts.forEach(acc => {
      if (acc.balance !== 0) {
        const divisionCode = acc.division || 'OTHER'
        const div = result.get(divisionCode)!
        const amount = acc.getDisplayBalance()
        const data = { code: acc.code, name: acc.name, amount }
        switch (acc.type) {
          case 'ASSET': div.assets.push(data); div.totalAssets += amount; break
          case 'LIABILITY': div.liabilities.push(data); div.totalLiabilities += amount; break
          case 'EQUITY': div.equity.push(data); div.totalEquity += amount; break
          case 'REVENUE': div.revenues.push(data); div.totalRevenues += amount; break
          case 'EXPENSE': div.expenses.push(data); div.totalExpenses += amount; break
        }
      }
    })
    return result
  }
  getIncomeDetails(startDate: string, endDate: string, divisionCode?: string) {
    const incomeDetails: Array<{
      date: string
      journalNumber: string
      accountCode: string
      accountName: string
      description: string
      amount: number
      auxiliaryCode?: string
      auxiliaryName?: string
      division?: string
    }> = []
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    this.journals.forEach(journal => {
      const journalDate = new Date(journal.date)
      if (journalDate >= start && journalDate <= end && journal.status === 'POSTED') {
        journal.details.forEach(detail => {
          const account = this.accounts.get(detail.accountCode)
          if (account && account.type === 'REVENUE') {
            if (!divisionCode || account.division === divisionCode || (divisionCode === 'OTHER' && !account.division)) {
              const amount = detail.creditAmount || 0
              if (amount > 0) {
                const auxiliaryLedger = detail.auxiliaryCode ? account.getAuxiliaryLedger(detail.auxiliaryCode) : null
                incomeDetails.push({
                  date: journal.date,
                  journalNumber: journal.number,
                  accountCode: account.code,
                  accountName: account.name,
                  description: detail.description || journal.description,
                  amount,
                  auxiliaryCode: detail.auxiliaryCode || undefined,
                  auxiliaryName: auxiliaryLedger?.name,
                  division: account.division || 'OTHER'
                })
              }
            }
          }
        })
      }
    })
    
    incomeDetails.sort((a, b) => a.date.localeCompare(b.date) || a.accountCode.localeCompare(b.accountCode))
    return incomeDetails
  }
  getIncomeDetailSummary(startDate: string, endDate: string, divisionCode?: string) {
    const details = this.getIncomeDetails(startDate, endDate, divisionCode)
    const summary = new Map<string, {
      accountCode: string
      accountName: string
      monthlyDetails: Map<string, number>
      total: number
      auxiliaryDetails?: Map<string, { name: string, amount: number }>
    }>()
    
    details.forEach(detail => {
      const month = detail.date.substring(0, 7)
      let accountSummary = summary.get(detail.accountCode)
      
      if (!accountSummary) {
        accountSummary = {
          accountCode: detail.accountCode,
          accountName: detail.accountName,
          monthlyDetails: new Map(),
          total: 0,
          auxiliaryDetails: detail.auxiliaryCode ? new Map() : undefined
        }
        summary.set(detail.accountCode, accountSummary)
      }
      
      const currentMonthAmount = accountSummary.monthlyDetails.get(month) || 0
      accountSummary.monthlyDetails.set(month, currentMonthAmount + detail.amount)
      accountSummary.total += detail.amount
      
      if (detail.auxiliaryCode && accountSummary.auxiliaryDetails) {
        const aux = accountSummary.auxiliaryDetails.get(detail.auxiliaryCode)
        if (aux) {
          aux.amount += detail.amount
        } else {
          accountSummary.auxiliaryDetails.set(detail.auxiliaryCode, {
            name: detail.auxiliaryName || detail.auxiliaryCode,
            amount: detail.amount
          })
        }
      }
    })
    
    return Array.from(summary.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode))
  }
  getExpenseDetails(startDate: string, endDate: string, divisionCode?: string) {
    const expenseDetails: Array<{
      date: string
      journalNumber: string
      accountCode: string
      accountName: string
      description: string
      amount: number
      auxiliaryCode?: string
      auxiliaryName?: string
      division?: string
    }> = []
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    this.journals.forEach(journal => {
      const journalDate = new Date(journal.date)
      if (journalDate >= start && journalDate <= end && journal.status === 'POSTED') {
        journal.details.forEach(detail => {
          const account = this.accounts.get(detail.accountCode)
          if (account && account.type === 'EXPENSE') {
            if (!divisionCode || account.division === divisionCode || (divisionCode === 'OTHER' && !account.division)) {
              const amount = detail.debitAmount || 0
              if (amount > 0) {
                const auxiliaryLedger = detail.auxiliaryCode ? account.getAuxiliaryLedger(detail.auxiliaryCode) : null
                expenseDetails.push({
                  date: journal.date,
                  journalNumber: journal.number,
                  accountCode: account.code,
                  accountName: account.name,
                  description: detail.description || journal.description,
                  amount,
                  auxiliaryCode: detail.auxiliaryCode || undefined,
                  auxiliaryName: auxiliaryLedger?.name,
                  division: account.division || 'OTHER'
                })
              }
            }
          }
        })
      }
    })
    
    expenseDetails.sort((a, b) => a.date.localeCompare(b.date) || a.accountCode.localeCompare(b.accountCode))
    return expenseDetails
  }
  getExpenseDetailSummary(startDate: string, endDate: string, divisionCode?: string) {
    const details = this.getExpenseDetails(startDate, endDate, divisionCode)
    const summary = new Map<string, {
      accountCode: string
      accountName: string
      monthlyDetails: Map<string, number>
      total: number
      auxiliaryDetails?: Map<string, { name: string, amount: number }>
    }>()
    
    details.forEach(detail => {
      const month = detail.date.substring(0, 7)
      let accountSummary = summary.get(detail.accountCode)
      
      if (!accountSummary) {
        accountSummary = {
          accountCode: detail.accountCode,
          accountName: detail.accountName,
          monthlyDetails: new Map(),
          total: 0,
          auxiliaryDetails: detail.auxiliaryCode ? new Map() : undefined
        }
        summary.set(detail.accountCode, accountSummary)
      }
      
      const currentMonthAmount = accountSummary.monthlyDetails.get(month) || 0
      accountSummary.monthlyDetails.set(month, currentMonthAmount + detail.amount)
      accountSummary.total += detail.amount
      
      if (detail.auxiliaryCode && accountSummary.auxiliaryDetails) {
        const aux = accountSummary.auxiliaryDetails.get(detail.auxiliaryCode)
        if (aux) {
          aux.amount += detail.amount
        } else {
          accountSummary.auxiliaryDetails.set(detail.auxiliaryCode, {
            name: detail.auxiliaryName || detail.auxiliaryCode,
            amount: detail.amount
          })
        }
      }
    })
    
    return Array.from(summary.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode))
  }
}
