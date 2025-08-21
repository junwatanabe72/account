import { StateCreator } from 'zustand'
import { StoreState } from '../../types'

/**
 * 補助元帳管理の拡張スライス
 * 動的データとして補助元帳を管理
 */

export interface AuxiliaryLedgerEntry {
  id: string
  code: string
  name: string
  type: 'vendor' | 'unit_owner' | 'department' | 'project'
  accountCode?: string  // 関連する勘定科目
  isActive: boolean
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface UnitOwner extends AuxiliaryLedgerEntry {
  type: 'unit_owner'
  unitNumber: string
  ownerName: string
  managementFee: number
  repairReserve: number
  parkingFee?: number
  contact?: {
    phone?: string
    email?: string
    address?: string
  }
}

export interface Vendor extends AuxiliaryLedgerEntry {
  type: 'vendor'
  vendorName: string
  category: 'supplier' | 'contractor' | 'utility' | 'service' | 'other'
  taxId?: string
  paymentTerms?: string
  contact?: {
    phone?: string
    email?: string
    address?: string
    representative?: string
  }
}

export interface EnhancedAuxiliaryState {
  // 動的データ
  auxiliaryLedgers: AuxiliaryLedgerEntry[]
  unitOwners: UnitOwner[]
  vendors: Vendor[]
  
  // UI状態
  selectedAuxiliaryIds: Set<string>
  auxiliaryFilter: {
    type?: AuxiliaryLedgerEntry['type']
    accountCode?: string
    isActive?: boolean
    searchQuery?: string
  }
}

export interface EnhancedAuxiliaryActions {
  // 補助元帳CRUD
  createAuxiliaryEntry: (entry: Omit<AuxiliaryLedgerEntry, 'id' | 'createdAt' | 'updatedAt'>) => AuxiliaryLedgerEntry
  updateAuxiliaryEntry: (id: string, updates: Partial<AuxiliaryLedgerEntry>) => boolean
  deleteAuxiliaryEntry: (id: string) => boolean
  toggleAuxiliaryStatus: (id: string) => boolean
  
  // 区分所有者管理
  createUnitOwner: (owner: Omit<UnitOwner, 'id' | 'createdAt' | 'updatedAt' | 'type'>) => UnitOwner
  updateUnitOwner: (id: string, updates: Partial<UnitOwner>) => boolean
  deleteUnitOwner: (id: string) => boolean
  getUnitOwnerByNumber: (unitNumber: string) => UnitOwner | undefined
  calculateTotalFees: () => { managementFee: number; repairReserve: number; parkingFee: number }
  
  // 取引先管理
  createVendor: (vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'type'>) => Vendor
  updateVendor: (id: string, updates: Partial<Vendor>) => boolean
  deleteVendor: (id: string) => boolean
  getVendorsByCategory: (category: Vendor['category']) => Vendor[]
  getActiveVendors: () => Vendor[]
  
  // フィルター・検索
  setAuxiliaryFilter: (filter: Partial<EnhancedAuxiliaryState['auxiliaryFilter']>) => void
  clearAuxiliaryFilter: () => void
  searchAuxiliary: (query: string) => AuxiliaryLedgerEntry[]
  
  // 集計・分析
  getAuxiliaryByType: (type: AuxiliaryLedgerEntry['type']) => AuxiliaryLedgerEntry[]
  getAuxiliaryByAccount: (accountCode: string) => AuxiliaryLedgerEntry[]
  getAuxiliaryBalance: (auxiliaryCode: string) => { debit: number; credit: number; balance: number }
  generateAuxiliaryReport: (auxiliaryCode: string, dateFrom: string, dateTo: string) => AuxiliaryReport
  
  // インポート・エクスポート
  importUnitOwners: (owners: UnitOwner[]) => { success: number; failed: number }
  importVendors: (vendors: Vendor[]) => { success: number; failed: number }
  exportAuxiliaryData: () => { unitOwners: UnitOwner[]; vendors: Vendor[] }
}

export interface AuxiliaryReport {
  auxiliaryCode: string
  auxiliaryName: string
  period: { from: string; to: string }
  openingBalance: number
  transactions: {
    date: string
    description: string
    debit: number
    credit: number
    balance: number
  }[]
  closingBalance: number
  totalDebit: number
  totalCredit: number
}

export interface EnhancedAuxiliarySlice extends EnhancedAuxiliaryState, EnhancedAuxiliaryActions {}

export const createEnhancedAuxiliarySlice: StateCreator<
  StoreState,
  [],
  [],
  EnhancedAuxiliarySlice
> = (set, get) => ({
  // 初期状態
  auxiliaryLedgers: [],
  unitOwners: [],
  vendors: [],
  selectedAuxiliaryIds: new Set(),
  auxiliaryFilter: {},
  
  // 補助元帳作成
  createAuxiliaryEntry: (entryData) => {
    const newEntry: AuxiliaryLedgerEntry = {
      ...entryData,
      id: `aux_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    set(state => ({
      auxiliaryLedgers: [...state.auxiliaryLedgers, newEntry],
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '補助元帳を作成しました')
    return newEntry
  },
  
  // 補助元帳更新
  updateAuxiliaryEntry: (id, updates) => {
    const entry = get().auxiliaryLedgers.find(a => a.id === id)
    if (!entry) {
      get().showToast('error', '補助元帳が見つかりません')
      return false
    }
    
    set(state => ({
      auxiliaryLedgers: state.auxiliaryLedgers.map(a => 
        a.id === id 
          ? { ...a, ...updates, updatedAt: new Date().toISOString() }
          : a
      ),
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '補助元帳を更新しました')
    return true
  },
  
  // 補助元帳削除
  deleteAuxiliaryEntry: (id) => {
    // 使用中チェック
    const journals = get().journals || []
    const isUsed = journals.some(j => 
      j.details?.some(d => d.auxiliaryCode === id)
    )
    
    if (isUsed) {
      get().showToast('error', 'この補助元帳は使用中のため削除できません')
      return false
    }
    
    set(state => ({
      auxiliaryLedgers: state.auxiliaryLedgers.filter(a => a.id !== id),
      unitOwners: state.unitOwners.filter(u => u.id !== id),
      vendors: state.vendors.filter(v => v.id !== id),
      selectedAuxiliaryIds: new Set([...state.selectedAuxiliaryIds].filter(sid => sid !== id)),
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '補助元帳を削除しました')
    return true
  },
  
  // ステータス切り替え
  toggleAuxiliaryStatus: (id) => {
    const entry = get().auxiliaryLedgers.find(a => a.id === id)
    if (!entry) return false
    
    return get().updateAuxiliaryEntry(id, { isActive: !entry.isActive })
  },
  
  // 区分所有者作成
  createUnitOwner: (ownerData) => {
    const newOwner: UnitOwner = {
      ...ownerData,
      type: 'unit_owner',
      id: `owner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code: `OWNER_${ownerData.unitNumber}`,
      name: ownerData.ownerName,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // 補助元帳にも追加
    get().createAuxiliaryEntry(newOwner)
    
    set(state => ({
      unitOwners: [...state.unitOwners, newOwner],
      lastUpdate: new Date()
    }))
    
    get().showToast('success', `区分所有者 ${newOwner.unitNumber} を登録しました`)
    return newOwner
  },
  
  // 区分所有者更新
  updateUnitOwner: (id, updates) => {
    const owner = get().unitOwners.find(u => u.id === id)
    if (!owner) {
      get().showToast('error', '区分所有者が見つかりません')
      return false
    }
    
    // 補助元帳も更新
    get().updateAuxiliaryEntry(id, updates)
    
    set(state => ({
      unitOwners: state.unitOwners.map(u => 
        u.id === id 
          ? { ...u, ...updates, updatedAt: new Date().toISOString() }
          : u
      ),
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '区分所有者情報を更新しました')
    return true
  },
  
  // 区分所有者削除
  deleteUnitOwner: (id) => {
    return get().deleteAuxiliaryEntry(id)
  },
  
  // 部屋番号から区分所有者取得
  getUnitOwnerByNumber: (unitNumber) => {
    return get().unitOwners.find(u => u.unitNumber === unitNumber)
  },
  
  // 費用合計計算
  calculateTotalFees: () => {
    const activeOwners = get().unitOwners.filter(u => u.isActive)
    
    return {
      managementFee: activeOwners.reduce((sum, u) => sum + u.managementFee, 0),
      repairReserve: activeOwners.reduce((sum, u) => sum + u.repairReserve, 0),
      parkingFee: activeOwners.reduce((sum, u) => sum + (u.parkingFee || 0), 0)
    }
  },
  
  // 取引先作成
  createVendor: (vendorData) => {
    const newVendor: Vendor = {
      ...vendorData,
      type: 'vendor',
      id: `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code: `VENDOR_${vendorData.vendorName.toUpperCase().replace(/\s/g, '_').substr(0, 10)}`,
      name: vendorData.vendorName,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // 補助元帳にも追加
    get().createAuxiliaryEntry(newVendor)
    
    set(state => ({
      vendors: [...state.vendors, newVendor],
      lastUpdate: new Date()
    }))
    
    get().showToast('success', `取引先 ${newVendor.vendorName} を登録しました`)
    return newVendor
  },
  
  // 取引先更新
  updateVendor: (id, updates) => {
    const vendor = get().vendors.find(v => v.id === id)
    if (!vendor) {
      get().showToast('error', '取引先が見つかりません')
      return false
    }
    
    // 補助元帳も更新
    get().updateAuxiliaryEntry(id, updates)
    
    set(state => ({
      vendors: state.vendors.map(v => 
        v.id === id 
          ? { ...v, ...updates, updatedAt: new Date().toISOString() }
          : v
      ),
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '取引先情報を更新しました')
    return true
  },
  
  // 取引先削除
  deleteVendor: (id) => {
    return get().deleteAuxiliaryEntry(id)
  },
  
  // カテゴリー別取引先取得
  getVendorsByCategory: (category) => {
    return get().vendors.filter(v => v.category === category)
  },
  
  // アクティブな取引先取得
  getActiveVendors: () => {
    return get().vendors.filter(v => v.isActive)
  },
  
  // フィルター設定
  setAuxiliaryFilter: (filter) => {
    set(state => ({
      auxiliaryFilter: { ...state.auxiliaryFilter, ...filter }
    }))
  },
  
  clearAuxiliaryFilter: () => {
    set({ auxiliaryFilter: {} })
  },
  
  // 検索
  searchAuxiliary: (query) => {
    const lowerQuery = query.toLowerCase()
    return get().auxiliaryLedgers.filter(a => 
      a.code.toLowerCase().includes(lowerQuery) ||
      a.name.toLowerCase().includes(lowerQuery)
    )
  },
  
  // タイプ別取得
  getAuxiliaryByType: (type) => {
    return get().auxiliaryLedgers.filter(a => a.type === type)
  },
  
  // 勘定科目別取得
  getAuxiliaryByAccount: (accountCode) => {
    return get().auxiliaryLedgers.filter(a => a.accountCode === accountCode)
  },
  
  // 補助元帳残高取得
  getAuxiliaryBalance: (auxiliaryCode) => {
    const journals = get().journals || []
    let debit = 0
    let credit = 0
    
    journals.forEach(j => {
      if (j.status === 'POSTED') {
        j.details?.forEach(d => {
          if (d.auxiliaryCode === auxiliaryCode) {
            debit += d.debitAmount || 0
            credit += d.creditAmount || 0
          }
        })
      }
    })
    
    return {
      debit,
      credit,
      balance: debit - credit
    }
  },
  
  // 補助元帳レポート生成
  generateAuxiliaryReport: (auxiliaryCode, dateFrom, dateTo) => {
    const auxiliary = get().auxiliaryLedgers.find(a => a.code === auxiliaryCode)
    if (!auxiliary) {
      return {
        auxiliaryCode,
        auxiliaryName: '不明',
        period: { from: dateFrom, to: dateTo },
        openingBalance: 0,
        transactions: [],
        closingBalance: 0,
        totalDebit: 0,
        totalCredit: 0
      }
    }
    
    const journals = get().journals || []
    const transactions: AuxiliaryReport['transactions'] = []
    let balance = 0
    let totalDebit = 0
    let totalCredit = 0
    
    journals
      .filter(j => {
        if (j.status !== 'POSTED') return false
        if (j.date < dateFrom || j.date > dateTo) return false
        return j.details?.some(d => d.auxiliaryCode === auxiliaryCode)
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach(j => {
        j.details?.forEach(d => {
          if (d.auxiliaryCode === auxiliaryCode) {
            const debit = d.debitAmount || 0
            const credit = d.creditAmount || 0
            balance += debit - credit
            totalDebit += debit
            totalCredit += credit
            
            transactions.push({
              date: j.date,
              description: d.description || j.description,
              debit,
              credit,
              balance
            })
          }
        })
      })
    
    return {
      auxiliaryCode,
      auxiliaryName: auxiliary.name,
      period: { from: dateFrom, to: dateTo },
      openingBalance: 0,
      transactions,
      closingBalance: balance,
      totalDebit,
      totalCredit
    }
  },
  
  // 区分所有者インポート
  importUnitOwners: (owners) => {
    let success = 0
    let failed = 0
    
    owners.forEach(owner => {
      try {
        get().createUnitOwner(owner)
        success++
      } catch {
        failed++
      }
    })
    
    get().showToast('info', `インポート完了: 成功 ${success}件, 失敗 ${failed}件`)
    return { success, failed }
  },
  
  // 取引先インポート
  importVendors: (vendors) => {
    let success = 0
    let failed = 0
    
    vendors.forEach(vendor => {
      try {
        get().createVendor(vendor)
        success++
      } catch {
        failed++
      }
    })
    
    get().showToast('info', `インポート完了: 成功 ${success}件, 失敗 ${failed}件`)
    return { success, failed }
  },
  
  // データエクスポート
  exportAuxiliaryData: () => {
    return {
      unitOwners: get().unitOwners,
      vendors: get().vendors
    }
  }
})