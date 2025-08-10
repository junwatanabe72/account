import { 
  SAMPLE_DATA_CONSTANTS,
  DIVISION_CODES
} from '../../constants'
import { JournalService } from './JournalService'
import { AccountService } from './AccountService'
import { AuxiliaryService } from './AuxiliaryService'

export class SampleDataService {
  constructor(
    private journalService: JournalService,
    private accountService: AccountService,
    private auxiliaryService: AuxiliaryService
  ) {}
  
  private getRandomAmount(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
  
  loadTwoYearSampleData() {
    this.accountService.clearAccounts()
    this.journalService.clearJournals()
    this.auxiliaryService.clearAuxiliaries()
    
    this.accountService.initializeAccounts()
    this.auxiliaryService.initializeUnitOwners()
    this.auxiliaryService.initializeVendors()
    this.auxiliaryService.createUnitOwnerAuxiliaryAccounts(this.accountService)
    
    const currentYear = new Date().getFullYear()
    const previousYear = currentYear - 1
    const previousYearStart = `${previousYear}-04-01`
    const previousYearEnd = `${currentYear}-03-31`
    const currentYearStart = `${currentYear}-04-01`
    
    // 前期期首残高
    this.journalService.createJournal({
      date: previousYearStart,
      description: '期首残高',
      details: [
        { accountCode: '1111', debitAmount: 5000000 },
        { accountCode: '1112', debitAmount: 10000000 },
        { accountCode: '3210', creditAmount: 7000000 },
        { accountCode: '3220', creditAmount: 8000000 }
      ]
    })
    
    // 前年度の月次データ
    this.generateMonthlyData(previousYear, 4, 12)
    this.generateMonthlyData(currentYear, 1, 3)
    
    // 前期決算処理
    this.generateClosingEntries(`${currentYear}-03-31`, previousYear)
    
    // 当期期首残高
    const openingBalances = this.accountService.getAccounts()
      .filter(acc => acc.balance !== 0)
      .map(acc => ({
        accountCode: acc.code,
        debitAmount: acc.isDebitBalance() ? acc.getDisplayBalance() : 0,
        creditAmount: !acc.isDebitBalance() ? acc.getDisplayBalance() : 0
      }))
    
    this.journalService.createJournal({
      date: currentYearStart,
      description: '期首残高',
      details: openingBalances
    })
    
    // 当年度の月次データ（現在月まで）
    const currentMonth = new Date().getMonth() + 1
    const endMonth = currentMonth < 4 ? currentMonth + 12 : currentMonth
    
    for (let m = 4; m <= endMonth; m++) {
      const actualMonth = m > 12 ? m - 12 : m
      const year = m > 12 ? currentYear + 1 : currentYear
      this.generateMonthlyData(year, actualMonth, actualMonth)
    }
  }
  
  private generateMonthlyData(year: number, startMonth: number, endMonth: number) {
    for (let month = startMonth; month <= endMonth; month++) {
      const date = `${year}-${String(month).padStart(2, '0')}-10`
      
      // 月次請求
      this.auxiliaryService.createMonthlyBilling(date, this.journalService, this.accountService)
      
      // 管理費収入（口座振替）
      const collectionDate = `${year}-${String(month).padStart(2, '0')}-27`
      const collectionDetails = []
      let totalCollection = 0
      
      for (const owner of this.auxiliaryService.getUnitOwners()) {
        if (owner.isActive && Math.random() > 0.05) { // 95%の収納率
          const mf = owner.monthlyManagementFee
          const rr = owner.monthlyReserveFund
          
          if (mf > 0) {
            collectionDetails.push({ accountCode: '1111', debitAmount: mf })
            collectionDetails.push({ accountCode: '1121', creditAmount: mf, auxiliaryCode: owner.unitNumber })
            totalCollection += mf
          }
          
          if (rr > 0) {
            collectionDetails.push({ accountCode: '1111', debitAmount: rr })
            collectionDetails.push({ accountCode: '1122', creditAmount: rr, auxiliaryCode: owner.unitNumber })
            totalCollection += rr
          }
        }
      }
      
      if (collectionDetails.length > 0) {
        this.journalService.createJournal({
          date: collectionDate,
          description: `管理費等口座振替（${month}月分）`,
          details: collectionDetails
        })
      }
      
      // 月次経費
      this.generateMonthlyExpenses(year, month)
    }
  }
  
  private generateMonthlyExpenses(year: number, month: number) {
    const datePrefix = `${year}-${String(month).padStart(2, '0')}`
    
    // 管理員業務費
    this.journalService.createJournal({
      date: `${datePrefix}-25`,
      description: `管理員業務費（${month}月分）`,
      details: [
        { accountCode: '5110', debitAmount: this.getRandomAmount(150000, 180000) },
        { accountCode: '2111', creditAmount: this.getRandomAmount(150000, 180000) }
      ]
    })
    
    // 清掃業務費
    this.journalService.createJournal({
      date: `${datePrefix}-25`,
      description: `清掃業務費（${month}月分）`,
      details: [
        { accountCode: '5120', debitAmount: this.getRandomAmount(80000, 100000) },
        { accountCode: '2111', creditAmount: this.getRandomAmount(80000, 100000) }
      ]
    })
    
    // 電気料（共用部）
    const electricityBase = this.getRandomAmount(30000, 50000)
    const electricityAmount = month >= 6 && month <= 9 ? 
      electricityBase * 1.3 : // 夏季
      month >= 11 || month <= 2 ? 
        electricityBase * 1.2 : // 冬季
        electricityBase
    
    this.journalService.createJournal({
      date: `${datePrefix}-20`,
      description: `電気料（${month}月分）`,
      details: [
        { accountCode: '5210', debitAmount: Math.floor(electricityAmount) },
        { accountCode: '2111', creditAmount: Math.floor(electricityAmount) }
      ]
    })
    
    // 水道料（共用部）
    this.journalService.createJournal({
      date: `${datePrefix}-20`,
      description: `水道料（${month}月分）`,
      details: [
        { accountCode: '5220', debitAmount: this.getRandomAmount(20000, 30000) },
        { accountCode: '2111', creditAmount: this.getRandomAmount(20000, 30000) }
      ]
    })
    
    // 経常修繕費
    if (Math.random() > 0.7) {
      const repairAmount = this.getRandomAmount(50000, 200000)
      const repairDesc = this.getRandomRepairDescription()
      this.journalService.createJournal({
        date: `${datePrefix}-15`,
        description: `経常修繕工事（${repairDesc}）`,
        details: [
          { accountCode: '5310', debitAmount: repairAmount },
          { accountCode: '2111', creditAmount: repairAmount }
        ]
      })
    }
    
    // 年間費用
    if (month === 4) { // 4月：保険料年間分
      this.journalService.createJournal({
        date: `${datePrefix}-01`,
        description: '火災保険料（年間）',
        details: [
          { accountCode: '5410', debitAmount: 480000 },
          { accountCode: '1111', creditAmount: 480000 }
        ]
      })
    }
    
    if (month === 6) { // 6月：組合運営費
      this.journalService.createJournal({
        date: `${datePrefix}-15`,
        description: '理事会運営費',
        details: [
          { accountCode: '5620', debitAmount: 50000 },
          { accountCode: '1111', creditAmount: 50000 }
        ]
      })
    }
    
    if (month === 9) { // 9月：大規模修繕工事費
      this.journalService.createJournal({
        date: `${datePrefix}-30`,
        description: '外壁補修工事（計画修繕）',
        details: [
          { accountCode: '5320', debitAmount: 3000000 },
          { accountCode: '1111', creditAmount: 3000000 }
        ]
      })
    }
    
    // 支払処理
    const paymentDate = `${datePrefix}-${String(month === 12 ? 28 : 30)}`
    const paymentAmount = this.getRandomAmount(300000, 500000)
    this.journalService.createJournal({
      date: paymentDate,
      description: `未払金支払（${month}月分）`,
      details: [
        { accountCode: '2111', debitAmount: paymentAmount },
        { accountCode: '1111', creditAmount: paymentAmount }
      ]
    })
  }
  
  private getRandomRepairDescription(): string {
    const repairs = [
      'エレベーター点検補修',
      '給水ポンプ交換',
      '共用廊下照明器具交換',
      'エントランスドア修繕',
      '駐車場区画線補修',
      '排水管清掃',
      '消防設備点検補修'
    ]
    return repairs[Math.floor(Math.random() * repairs.length)] || 'その他修繕工事'
  }
  
  private generateClosingEntries(closingDate: string, fiscalYear: number) {
    // 収益・費用の振替
    const revenueAccounts = this.accountService.getAccounts().filter(acc => acc.type === 'REVENUE' && acc.balance !== 0)
    const expenseAccounts = this.accountService.getAccounts().filter(acc => acc.type === 'EXPENSE' && acc.balance !== 0)
    
    // 管理費会計の決算
    const kanriRevenue = revenueAccounts.filter(acc => acc.division === DIVISION_CODES.KANRI)
    const kanriExpense = expenseAccounts.filter(acc => acc.division === DIVISION_CODES.KANRI)
    
    if (kanriRevenue.length > 0 || kanriExpense.length > 0) {
      const details = []
      
      for (const acc of kanriRevenue) {
        details.push({ accountCode: acc.code, debitAmount: acc.getDisplayBalance() })
      }
      details.push({ accountCode: '3110', creditAmount: kanriRevenue.reduce((sum, acc) => sum + acc.getDisplayBalance(), 0) })
      
      details.push({ accountCode: '3110', debitAmount: kanriExpense.reduce((sum, acc) => sum + acc.getDisplayBalance(), 0) })
      for (const acc of kanriExpense) {
        details.push({ accountCode: acc.code, creditAmount: acc.getDisplayBalance() })
      }
      
      this.journalService.createJournal({
        date: closingDate,
        description: `決算振替仕訳（管理費会計）${fiscalYear}年度`,
        details
      })
    }
    
    // 修繕積立金会計の決算
    const shuzenRevenue = revenueAccounts.filter(acc => acc.division === DIVISION_CODES.SHUZEN)
    const shuzenExpense = expenseAccounts.filter(acc => acc.division === DIVISION_CODES.SHUZEN)
    
    if (shuzenRevenue.length > 0 || shuzenExpense.length > 0) {
      const details = []
      
      for (const acc of shuzenRevenue) {
        details.push({ accountCode: acc.code, debitAmount: acc.getDisplayBalance() })
      }
      details.push({ accountCode: '3120', creditAmount: shuzenRevenue.reduce((sum, acc) => sum + acc.getDisplayBalance(), 0) })
      
      details.push({ accountCode: '3120', debitAmount: shuzenExpense.reduce((sum, acc) => sum + acc.getDisplayBalance(), 0) })
      for (const acc of shuzenExpense) {
        details.push({ accountCode: acc.code, creditAmount: acc.getDisplayBalance() })
      }
      
      this.journalService.createJournal({
        date: closingDate,
        description: `決算振替仕訳（修繕積立金会計）${fiscalYear}年度`,
        details
      })
    }
  }
  
  loadSampleData() {
    this.loadTwoYearSampleData()
  }
  
  clearAll() {
    this.accountService.clearAccounts()
    this.journalService.clearJournals()
    this.auxiliaryService.clearAuxiliaries()
    this.accountService.initializeAccounts()
  }
}