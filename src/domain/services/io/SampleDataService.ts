import { 
  SAMPLE_DATA_CONSTANTS,
  DIVISION_CODES
} from '../../../constants'
import { JournalService } from '../core/JournalService'
import { AccountService } from '../core/AccountService'
import { AuxiliaryService } from '../ledger/AuxiliaryService'
import { IJournalService } from '../../interfaces/IJournalService'
import { IAccountService } from '../../interfaces/IAccountService'

export class SampleDataService {
  constructor(
    private journalService: JournalService | IJournalService,
    private accountService: AccountService | IAccountService,
    private auxiliaryService: AuxiliaryService
  ) {}
  
  clearAll() {
    this.accountService.clearAccounts()
    this.journalService.clearJournals()
    this.auxiliaryService.clearAuxiliaries()
  }
  
  loadSampleData() {
    // エイリアスメソッド（互換性のため）
    this.loadOneMonthSampleData()
  }
  
  loadTwoYearSampleData() {
    // エイリアスメソッド（互換性のため）
    this.loadFullYearSampleData()
  }
  
  private getRandomAmount(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
  
  loadOneMonthSampleData() {
    // エイリアスメソッド - フル年間データを生成
    this.loadFullYearSampleData()
  }
  
  // 1年分の完全なサンプルデータを生成
  loadFullYearSampleData() {
    this.accountService.clearAccounts()
    this.journalService.clearJournals()
    this.auxiliaryService.clearAuxiliaries()
    
    this.accountService.initializeAccounts()
    this.auxiliaryService.initializeUnitOwners()
    this.auxiliaryService.initializeVendors()
    this.auxiliaryService.createUnitOwnerAuxiliaryAccounts(this.accountService)
    
    const currentYear = 2024
    
    // 期首残高（2024年4月1日）
    const openingJournal = this.journalService.createJournal({
      date: `${currentYear}-04-01`,
      description: '期首残高',
      division: 'KANRI',
      details: [
        { accountCode: '1102', debitAmount: 5000000, creditAmount: 0 },  // 普通預金（管理）
        { accountCode: '1103', debitAmount: 10000000, creditAmount: 0 }, // 普通預金（修繕）
        { accountCode: '1105', debitAmount: 500000, creditAmount: 0 },   // 普通預金（駐車場）
        { accountCode: '4101', debitAmount: 0, creditAmount: 15500000 }  // 管理費繰越金（期首の場合は純資産科目を使用）
      ]
    })
    if (openingJournal.success && openingJournal.data) {
      this.journalService.submitJournal(openingJournal.data.id)
      this.journalService.approveJournal(openingJournal.data.id)
      this.journalService.postJournalById(openingJournal.data.id)
    }
    
    // 12ヶ月分のデータ生成（2024年4月〜2025年3月）
    for (let month = 4; month <= 12; month++) {
      this.generateMonthlyTransactions(currentYear, month)
    }
    for (let month = 1; month <= 3; month++) {
      this.generateMonthlyTransactions(currentYear + 1, month)
    }
    
    // 年次の特別な取引
    this.generateAnnualTransactions(currentYear)
    
    // すべての仕訳を承認・記帳
    console.log('[SampleDataService] Posting all journals...')
    const allJournals = this.journalService.getJournals()
    let postedCount = 0
    for (const journal of allJournals) {
      if (journal.status === 'DRAFT') {
        this.journalService.submitJournal(journal.id)
      }
      if (journal.status === 'SUBMITTED' || journal.status === 'DRAFT') {
        this.journalService.approveJournal(journal.id)
      }
      if (journal.status !== 'POSTED') {
        const result = this.journalService.postJournalById(journal.id)
        if (result) {
          postedCount++
        }
      }
    }
    console.log(`[SampleDataService] Posted ${postedCount} journals out of ${allJournals.length}`)
  }
  
  private generateMonthlyTransactions(year: number, month: number) {
    const monthStr = String(month).padStart(2, '0')
    const lastDay = new Date(year, month, 0).getDate()
    
    // 1. 管理費収入（毎月25日）
    const kanriIncomeJournal = this.journalService.createJournal({
      date: `${year}-${monthStr}-25`,
      description: `管理費収入（${year}年${month}月分）`,
      division: 'KANRI',
      details: [
        { accountCode: '1102', debitAmount: 750000, creditAmount: 0 },  // 普通預金（管理）
        { accountCode: '5101', debitAmount: 0, creditAmount: 750000 }   // 管理費収入
      ]
    })
    // 記帳は最後にまとめて行うのでここでは不要
    
    // 2. 修繕積立金収入（毎月25日）
    const shuzenIncomeJournal = this.journalService.createJournal({
      date: `${year}-${monthStr}-25`,
      description: `修繕積立金収入（${year}年${month}月分）`,
      division: 'SHUZEN',
      details: [
        { accountCode: '1103', debitAmount: 500000, creditAmount: 0 },  // 普通預金（修繕）
        { accountCode: '5201', debitAmount: 0, creditAmount: 500000 }   // 修繕積立金収入
      ]
    })
    
    // 3. 駐車場収入（毎月25日）
    const parkingIncomeJournal = this.journalService.createJournal({
      date: `${year}-${monthStr}-25`,
      description: `駐車場使用料（${year}年${month}月分）`,
      division: 'PARKING',
      details: [
        { accountCode: '1105', debitAmount: 240000, creditAmount: 0 },  // 普通預金（駐車場）
        { accountCode: '5107', debitAmount: 0, creditAmount: 240000 }   // 駐車場収入
      ]
    })
    
    // 4. 管理委託費（毎月月末）
    const kanriExpenseJournal = this.journalService.createJournal({
      date: `${year}-${monthStr}-${lastDay}`,
      description: `管理委託費（${year}年${month}月分）`,
      division: 'KANRI',
      details: [
        { accountCode: '6101', debitAmount: 350000, creditAmount: 0 },  // 管理委託費
        { accountCode: '1102', debitAmount: 0, creditAmount: 350000 }   // 普通預金（管理）
      ]
    })
    
    // 5. 清掃費（毎月15日）
    const cleaningJournal = this.journalService.createJournal({
      date: `${year}-${monthStr}-15`,
      description: `清掃業務委託費（${year}年${month}月分）`,
      division: 'KANRI',
      details: [
        { accountCode: '6201', debitAmount: 80000, creditAmount: 0 },  // 修繕費（清掃）
        { accountCode: '1102', debitAmount: 0, creditAmount: 80000 }   // 普通顐金（管理）
      ]
    })
    
    // 6. エレベーター保守（毎月20日）
    const elevatorJournal = this.journalService.createJournal({
      date: `${year}-${monthStr}-20`,
      description: `エレベーター保守点検（${year}年${month}月分）`,
      division: 'KANRI',
      details: [
        { accountCode: '6201', debitAmount: 45000, creditAmount: 0 },  // 修繕費（エレベーター）
        { accountCode: '1102', debitAmount: 0, creditAmount: 45000 }   // 普通預金（管理）
      ]
    })
    
    // 7. 電気代（毎月10日）
    const electricityJournal = this.journalService.createJournal({
      date: `${year}-${monthStr}-10`,
      description: `共用部電気代（${year}年${month}月分）`,
      division: 'KANRI',
      details: [
        { accountCode: '6102', debitAmount: 35000, creditAmount: 0 },  // 水道光熱費
        { accountCode: '1102', debitAmount: 0, creditAmount: 35000 }   // 普通預金（管理）
      ]
    })
    
    // 8. 水道代（毎月10日）
    const waterJournal = this.journalService.createJournal({
      date: `${year}-${monthStr}-10`,
      description: `共用部水道代（${year}年${month}月分）`,
      division: 'KANRI',
      details: [
        { accountCode: '6102', debitAmount: 15000, creditAmount: 0 },  // 水道光熱費
        { accountCode: '1102', debitAmount: 0, creditAmount: 15000 }   // 普通預金（管理）
      ]
    })
    
    // 9. 駐車場管理費（毎月月末）
    const parkingExpenseJournal = this.journalService.createJournal({
      date: `${year}-${monthStr}-${lastDay}`,
      description: `駐車場管理費（${year}年${month}月分）`,
      division: 'PARKING',
      details: [
        { accountCode: '6310', debitAmount: 20000, creditAmount: 0 },  // 駐車場管理費
        { accountCode: '1105', debitAmount: 0, creditAmount: 20000 }   // 普通預金（駐車場）
      ]
    })
    
    // 10. 自販機設置料（毎月5日）
    const vendingJournal = this.journalService.createJournal({
      date: `${year}-${monthStr}-05`,
      description: `自販機設置料（${year}年${month}月分）`,
      division: 'OTHER',
      details: [
        { accountCode: '1102', debitAmount: 5000, creditAmount: 0 },   // 普通預金（管理）
        { accountCode: '5302', debitAmount: 0, creditAmount: 5000 }    // 雑収入
      ]
    })
    
    // 11. 携帯基地局設置料（毎月月末）
    const antennaJournal = this.journalService.createJournal({
      date: `${year}-${monthStr}-${lastDay}`,
      description: `携帯基地局設置料（${year}年${month}月分）`,
      division: 'OTHER',
      details: [
        { accountCode: '1102', debitAmount: 30000, creditAmount: 0 },  // 普通預金（管理）
        { accountCode: '5302', debitAmount: 0, creditAmount: 30000 }   // 雑収入
      ]
    })
  }
  
  private generateAnnualTransactions(year: number) {
    // 1. 損害保険料（年1回、6月）
    const insuranceJournal = this.journalService.createJournal({
      date: `${year}-06-15`,
      description: `マンション総合保険料（${year}年度）`,
      division: 'KANRI',
      details: [
        { accountCode: '6104', debitAmount: 180000, creditAmount: 0 }, // 保険料
        { accountCode: '1102', debitAmount: 0, creditAmount: 180000 }  // 普通預金（管理）
      ]
    })
    
    // 2. 消防設備点検（年2回、5月と11月）
    const fireInspection1 = this.journalService.createJournal({
      date: `${year}-05-20`,
      description: `消防設備点検（${year}年度前期）`,
      division: 'KANRI',
      details: [
        { accountCode: '6201', debitAmount: 60000, creditAmount: 0 },  // 修繕費
        { accountCode: '1102', debitAmount: 0, creditAmount: 60000 }   // 普通預金（管理）
      ]
    })
    
    const fireInspection2 = this.journalService.createJournal({
      date: `${year}-11-20`,
      description: `消防設備点検（${year}年度後期）`,
      division: 'KANRI',
      details: [
        { accountCode: '6201', debitAmount: 60000, creditAmount: 0 },  // 修繕費
        { accountCode: '1102', debitAmount: 0, creditAmount: 60000 }   // 普通預金（管理）
      ]
    })
    
    // 3. 植栽剪定（年4回、3月、6月、9月、12月）
    const plantingMonths = [6, 9, 12]
    plantingMonths.forEach(month => {
      const plantingJournal = this.journalService.createJournal({
        date: `${year}-${String(month).padStart(2, '0')}-10`,
        description: `植栽剪定作業（${year}年${month}月）`,
        division: 'KANRI',
        details: [
          { accountCode: '6201', debitAmount: 45000, creditAmount: 0 },  // 修繕費（植栽）
          { accountCode: '1102', debitAmount: 0, creditAmount: 45000 }   // 普通預金（管理）
        ]
      })
    })
    
    // 2025年3月の植栽剪定
    const plantingJournalMarch = this.journalService.createJournal({
      date: `${year + 1}-03-10`,
      description: `植栽剪定作業（${year + 1}年3月）`,
      division: 'KANRI',
      details: [
        { accountCode: '6201', debitAmount: 45000, creditAmount: 0 },  // 修繕費（植栽）
        { accountCode: '1102', debitAmount: 0, creditAmount: 45000 }   // 普通預金（管理）
      ]
    })
    
    // 4. 大規模修繕工事（9月）
    const majorRepairJournal = this.journalService.createJournal({
      date: `${year}-09-30`,
      description: `外壁塗装工事（大規模修繕）`,
      division: 'SHUZEN',
      details: [
        { accountCode: '6401', debitAmount: 3000000, creditAmount: 0 }, // 修繕工事費
        { accountCode: '1103', debitAmount: 0, creditAmount: 3000000 }  // 普通預金（修繕）
      ]
    })
    
    // 5. 屋上防水工事（7月）
    const roofRepairJournal = this.journalService.createJournal({
      date: `${year}-07-15`,
      description: `屋上防水補修工事`,
      division: 'SHUZEN',
      details: [
        { accountCode: '6401', debitAmount: 800000, creditAmount: 0 },  // 修繕工事費
        { accountCode: '1103', debitAmount: 0, creditAmount: 800000 }   // 普通預金（修繕）
      ]
    })
    
    // 6. 給水ポンプ交換（10月）
    const pumpRepairJournal = this.journalService.createJournal({
      date: `${year}-10-20`,
      description: `給水ポンプ交換工事`,
      division: 'SHUZEN',
      details: [
        { accountCode: '6401', debitAmount: 500000, creditAmount: 0 },  // 修繕工事費
        { accountCode: '1103', debitAmount: 0, creditAmount: 500000 }   // 普通預金（修繕）
      ]
    })
    
    // 7. 集会室使用料（不定期、月1〜2回）
    const meetingRoomMonths = [4, 5, 6, 7, 9, 10, 11, 12, 1, 2]
    meetingRoomMonths.forEach(month => {
      const actualYear = month <= 3 ? year + 1 : year
      const meetingRoomJournal = this.journalService.createJournal({
        date: `${actualYear}-${String(month).padStart(2, '0')}-15`,
        description: `集会室使用料`,
        division: 'OTHER',
        details: [
          { accountCode: '1101', debitAmount: 3000, creditAmount: 0 },   // 現金
          { accountCode: '5302', debitAmount: 0, creditAmount: 3000 }    // 雑収入
        ]
      })
    })
  }
}