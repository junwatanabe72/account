import { IDivisionService } from '../interfaces/IDivisionService'
import { AccountingDivision } from '../services/core/DivisionService'
import { DivisionCode } from '../../types'
import { AccountingDivisionInterface } from '../../types/services'

export class MockDivisionService implements IDivisionService {
  private mockDivisions = new Map<string, AccountingDivision>()
  // DivisionServiceが持つdivisionsMapプロパティを追加
  get divisionsMap() {
    return this.mockDivisions
  }
  
  get divisions(): AccountingDivisionInterface[] {
    return Array.from(this.mockDivisions.values())
  }
  
  getDivision(code: DivisionCode): AccountingDivisionInterface | undefined {
    return this.mockDivisions.get(code)
  }
  
  getDivisions(): AccountingDivisionInterface[] {
    return this.divisions
  }
  
  initializeDivisions(): void {
    // テスト用の最小限の区分を設定
    this.addMockDivision(new AccountingDivision(
      'KANRI',
      '管理費会計',
      'テスト用管理費会計',
      true
    ))
    
    this.addMockDivision(new AccountingDivision(
      'SHUZEN',
      '修繕積立金会計',
      'テスト用修繕積立金会計',
      true
    ))
    
    this.addMockDivision(new AccountingDivision(
      'SHARED',
      '共通会計',
      'テスト用共通会計',
      false
    ))
  }
  
  clearDivisions(): void {
    this.mockDivisions.clear()
  }
  
  // テスト用ヘルパーメソッド
  addMockDivision(division: AccountingDivision): void {
    this.mockDivisions.set(division.code, division)
  }
  
  setDivisionBalance(code: string, balance: number): void {
    const division = this.mockDivisions.get(code)
    if (division) {
      // バランスを設定するロジック（必要に応じて実装）
    }
  }
  
  setTransferLimit(fromCode: string, toCode: string, limit: number): void {
    const division = this.mockDivisions.get(fromCode)
    if (division) {
      division.setTransferLimit(toCode, limit)
    }
  }
}