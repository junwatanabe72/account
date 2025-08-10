import {
  UnitOwner,
  Vendor
} from '../../types'
import { AccountService } from './AccountService'
import { JournalService } from './JournalService'
import { SAMPLE_DATA_CONSTANTS } from '../../constants'

export class AuxiliaryService {
  unitOwners: UnitOwner[] = []
  vendors: Vendor[] = []
  
  initializeUnitOwners() {
    this.unitOwners = [
      { unitNumber: '101', ownerName: '山田太郎', monthlyManagementFee: 25000, monthlyReserveFund: 15000, parkingFee: 0, isActive: true },
      { unitNumber: '102', ownerName: '佐藤花子', monthlyManagementFee: 25000, monthlyReserveFund: 15000, parkingFee: 10000, isActive: true },
      { unitNumber: '201', ownerName: '鈴木一郎', monthlyManagementFee: 30000, monthlyReserveFund: 18000, parkingFee: 10000, isActive: true },
      { unitNumber: '202', ownerName: '田中美咲', monthlyManagementFee: 30000, monthlyReserveFund: 18000, parkingFee: 0, isActive: true },
      { unitNumber: '301', ownerName: '高橋健太', monthlyManagementFee: 35000, monthlyReserveFund: 21000, parkingFee: 10000, isActive: true },
      { unitNumber: '302', ownerName: '伊藤真理子', monthlyManagementFee: 35000, monthlyReserveFund: 21000, parkingFee: 10000, isActive: true }
    ]
  }
  
  initializeVendors() {
    this.vendors = [
      { code: 'V001', name: 'ABC管理サービス', category: '管理業務' },
      { code: 'V002', name: 'クリーンメンテナンス', category: '清掃業務' },
      { code: 'V003', name: '東京電力', category: '水道光熱費' },
      { code: 'V004', name: '東京水道局', category: '水道光熱費' },
      { code: 'V005', name: '〇〇建設', category: '修繕工事' }
    ]
  }
  
  createUnitOwnerAuxiliaryAccounts(accountService: AccountService) {
    const a1121 = accountService.getAccount('1121')
    const a1122 = accountService.getAccount('1122')
    
    if (a1121) {
      a1121.hasAuxiliary = true
      for (const owner of this.unitOwners) {
        a1121.createAuxiliaryLedger(owner.unitNumber, `${owner.ownerName}様`, { owner })
      }
    }
    
    if (a1122) {
      a1122.hasAuxiliary = true
      for (const owner of this.unitOwners) {
        a1122.createAuxiliaryLedger(owner.unitNumber, `${owner.ownerName}様`, { owner })
      }
    }
  }
  
  getUnitOwners() {
    return this.unitOwners
  }
  
  setUnitOwners(owners: UnitOwner[]) {
    this.unitOwners = owners
  }
  
  getVendors() {
    return this.vendors
  }
  
  setVendors(vendors: Vendor[]) {
    this.vendors = vendors
  }
  
  clearAuxiliaries() {
    this.unitOwners = []
    this.vendors = []
  }
  
  getAuxiliaryLedgerSummary(accountService: AccountService) {
    const summary: Array<{
      accountCode: string
      accountName: string
      auxiliaries: Array<{
        code: string
        name: string
        balance: number
        isDebit: boolean
      }>
    }> = []
    
    for (const acc of accountService.getAccounts()) {
      if (acc.hasAuxiliary && acc.auxiliaryLedgers.size > 0) {
        const auxiliaries = Array.from(acc.auxiliaryLedgers.values()).map(aux => ({
          code: aux.auxiliaryCode,
          name: aux.name,
          balance: aux.getDisplayBalance(),
          isDebit: aux.isDebitBalance()
        }))
        
        summary.push({
          accountCode: acc.code,
          accountName: acc.name,
          auxiliaries
        })
      }
    }
    
    return summary
  }
  
  getUnitReceivablesSummary(accountService: AccountService) {
    const summary: Array<{
      unitNumber: string
      ownerName: string
      managementFeeReceivable: number
      reserveFundReceivable: number
      totalReceivable: number
    }> = []
    
    const a1121 = accountService.getAccount('1121')
    const a1122 = accountService.getAccount('1122')
    
    for (const owner of this.unitOwners) {
      let mfRec = 0, rfRec = 0
      
      if (a1121) {
        const aux1 = a1121.getAuxiliaryLedger(owner.unitNumber)
        if (aux1) mfRec = aux1.getDisplayBalance()
      }
      
      if (a1122) {
        const aux2 = a1122.getAuxiliaryLedger(owner.unitNumber)
        if (aux2) rfRec = aux2.getDisplayBalance()
      }
      
      const total = mfRec + rfRec
      if (total !== 0) {
        summary.push({
          unitNumber: owner.unitNumber,
          ownerName: owner.ownerName,
          managementFeeReceivable: mfRec,
          reserveFundReceivable: rfRec,
          totalReceivable: total
        })
      }
    }
    
    return summary
  }
  
  createMonthlyBilling(billingDate: string, journalService: JournalService, accountService: AccountService) {
    const details = []
    let totalMF = 0, totalRR = 0
    
    for (const owner of this.unitOwners) {
      if (owner.isActive) {
        const mf = owner.monthlyManagementFee
        const rr = owner.monthlyReserveFund
        
        if (mf > 0) {
          details.push({ accountCode: '1121', debitAmount: mf, auxiliaryCode: owner.unitNumber })
          details.push({ accountCode: '4110', creditAmount: mf })
          totalMF += mf
        }
        
        if (rr > 0) {
          details.push({ accountCode: '1122', debitAmount: rr, auxiliaryCode: owner.unitNumber })
          details.push({ accountCode: '4210', creditAmount: rr })
          totalRR += rr
        }
      }
    }
    
    if (totalMF === 0 && totalRR === 0) {
      return { success: false, errors: ['請求する金額がありません'] }
    }
    
    return journalService.createJournal({
      date: billingDate,
      description: `月次管理費・修繕積立金請求`,
      details
    })
  }
}