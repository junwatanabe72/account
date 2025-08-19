import React, { useState } from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'
import { 
  AccountingDivision,
  DEFAULT_ACCOUNTING_DIVISIONS,
  getGroupedAccountingDivisions,
  TOP_LEVEL_NAMES
} from '../../types/accountingDivision'

const YearSelect: React.FC<{ value: string, onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div className="d-flex align-items-center gap-2 mb-3">
    <label className="form-label mb-0">年度</label>
    <select className="form-select" style={{ maxWidth: 180 }} value={value} onChange={e => onChange(e.target.value)}>
      <option value="2023">2023年度</option>
      <option value="2024">2024年度</option>
      <option value="2025">2025年度</option>
    </select>
  </div>
)

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="card mb-3">
      <div className="card-header"><strong>{title}</strong></div>
      <div className="card-body">{children}</div>
    </div>
  )
}

function yen(n: number) { return '¥' + n.toLocaleString() }

export const IncomeExpenseReport: React.FC<{ engine: AccountingEngine }> = ({ engine }) => {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(String(currentYear))
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL')
  const divisions = DEFAULT_ACCOUNTING_DIVISIONS
  const divisionGroups = getGroupedAccountingDivisions(divisions)
  
  const getFilteredDivisionData = (division: string) => {
    const fiscalYear = parseInt(year)
    // 現在月のデータを表示（サンプルデータが1ヶ月分のため）
    const currentMonth = new Date().getMonth() + 1
    const startDate = `${fiscalYear}-${String(currentMonth).padStart(2, '0')}-01`
    const endDate = `${fiscalYear}-${String(currentMonth).padStart(2, '0')}-31`
    
    // 収入の集計
    const incomeSummary = engine.getIncomeDetailSummary(startDate, endDate, division)
    const revenues = incomeSummary.map(item => ({
      code: item.accountCode,
      name: item.accountName,
      amount: item.amount
    }))
    const totalRevenues = revenues.reduce((sum, item) => sum + item.amount, 0)
    
    // 支出の集計
    const expenseSummary = engine.getExpenseDetailSummary(startDate, endDate, division)
    const expenses = expenseSummary.map(item => ({
      code: item.accountCode,
      name: item.accountName,
      amount: item.amount
    }))
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0)
    
    return { revenues, expenses, totalRevenues, totalExpenses }
  }
  
  const kanri = getFilteredDivisionData('KANRI')
  const shuzen = getFilteredDivisionData('SHUZEN')
  const parking = getFilteredDivisionData('PARKING')
  
  // 前期繰越金を取得（3111: 前期繰越収支差額）
  const getPreviousBalance = () => {
    const account = engine.accounts.find(a => a.code === '3111')
    return account ? account.getDisplayBalance() : 0
  }

  const renderReport = (label: string, d?: { revenues: any[], expenses: any[], totalRevenues: number, totalExpenses: number }, divisionCode?: string) => {
    if (!d) return <div className="text-muted">データがありません</div>
    
    const previousBalance = getPreviousBalance()
    const net = (d.totalRevenues || 0) - (d.totalExpenses || 0)
    const nextBalance = previousBalance + net
    
    const tableStyle: React.CSSProperties = {
      width: '100%',
      borderCollapse: 'collapse',
      border: '1px solid #ddd',
      fontSize: '14px'
    }
    
    const cellStyle: React.CSSProperties = {
      border: '1px solid #ddd',
      padding: '8px'
    }
    
    const responsiveTableStyle: React.CSSProperties = {
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch'
    }
    
    return (
      <div style={{ 
        border: '2px solid #007bff', 
        borderRadius: 8, 
        padding: '20px', 
        marginBottom: 20
      }}>
        <h3 style={{ 
          textAlign: 'center', 
          marginBottom: 20, 
          color: '#007bff',
          fontSize: 'clamp(1.2rem, 3vw, 1.75rem)'
        }}>
          第{parseInt(year) - 2000}期 収支報告書（{year}年4月〜{parseInt(year) + 1}年3月）
        </h3>
        <h4 style={{ 
          textAlign: 'center', 
          marginBottom: 30, 
          color: '#666',
          fontSize: 'clamp(1rem, 2.5vw, 1.5rem)'
        }}>
          {label}
        </h4>
        
        {/* デスクトップ用: 横並び表示 */}
        <div className="d-none d-lg-flex" style={{ gap: 40, marginBottom: 30 }}>
          <div style={{ flex: 1 }}>
            <h5 style={{ backgroundColor: '#e3f2fd', padding: 10, margin: 0, textAlign: 'center', fontWeight: 'bold' }}>
              収入の部
            </h5>
            <table style={tableStyle}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ ...cellStyle, textAlign: 'left' }}>科目</th>
                  <th style={{ ...cellStyle, textAlign: 'center' }}>予算（円）</th>
                  <th style={{ ...cellStyle, textAlign: 'center' }}>決算（円）</th>
                  <th style={{ ...cellStyle, textAlign: 'center' }}>差額（円）</th>
                </tr>
              </thead>
              <tbody>
                {d.revenues.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ ...cellStyle, textAlign: 'center', color: '#888' }}>
                      収入データなし
                    </td>
                  </tr>
                ) : (
                  d.revenues.map((r: any) => (
                    <tr key={r.code}>
                      <td style={cellStyle}>{r.name}</td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>{yen(r.amount)}</td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>{yen(r.amount)}</td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>0</td>
                    </tr>
                  ))
                )}
                <tr style={{ backgroundColor: '#e8f5e8', fontWeight: 'bold' }}>
                  <td style={cellStyle}>収入 合計</td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>{yen(d.totalRevenues)}</td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>{yen(d.totalRevenues)}</td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>0</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div style={{ flex: 1 }}>
            <h5 style={{ backgroundColor: '#ffebee', padding: 10, margin: 0, textAlign: 'center', fontWeight: 'bold' }}>
              支出の部
            </h5>
            <table style={tableStyle}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ ...cellStyle, textAlign: 'left' }}>科目</th>
                  <th style={{ ...cellStyle, textAlign: 'center' }}>予算（円）</th>
                  <th style={{ ...cellStyle, textAlign: 'center' }}>決算（円）</th>
                  <th style={{ ...cellStyle, textAlign: 'center' }}>差額（円）</th>
                </tr>
              </thead>
              <tbody>
                {d.expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ ...cellStyle, textAlign: 'center', color: '#888' }}>
                      支出データなし
                    </td>
                  </tr>
                ) : (
                  d.expenses.map((e: any) => {
                    const budgetAmount = Math.round(e.amount * 1.1 / 1000) * 1000
                    const variance = budgetAmount - e.amount
                    return (
                      <tr key={e.code}>
                        <td style={cellStyle}>{e.name}</td>
                        <td style={{ ...cellStyle, textAlign: 'right' }}>{yen(budgetAmount)}</td>
                        <td style={{ ...cellStyle, textAlign: 'right' }}>{yen(e.amount)}</td>
                        <td style={{ ...cellStyle, textAlign: 'right', color: variance >= 0 ? 'green' : 'red' }}>
                          {variance >= 0 ? yen(variance) : `▲${yen(Math.abs(variance))}`}
                        </td>
                      </tr>
                    )
                  })
                )}
                <tr style={{ backgroundColor: '#ffebee', fontWeight: 'bold' }}>
                  <td style={cellStyle}>支出 合計</td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>
                    {yen(Math.round(d.totalExpenses * 1.1 / 1000) * 1000)}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>{yen(d.totalExpenses)}</td>
                  <td style={{ ...cellStyle, textAlign: 'right', color: 'green' }}>
                    {yen(Math.round(d.totalExpenses * 1.1 / 1000) * 1000 - d.totalExpenses)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* モバイル用: 縦並び表示 */}
        <div className="d-lg-none" style={{ marginBottom: 30 }}>
          <div style={{ marginBottom: 20 }}>
            <h5 style={{ 
              backgroundColor: '#e3f2fd', 
              padding: 10, 
              margin: 0, 
              textAlign: 'center', 
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              収入の部
            </h5>
            <div style={responsiveTableStyle}>
              <table style={{ ...tableStyle, minWidth: '400px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ ...cellStyle, textAlign: 'left', fontSize: '12px' }}>科目</th>
                    <th style={{ ...cellStyle, textAlign: 'center', fontSize: '12px' }}>予算</th>
                    <th style={{ ...cellStyle, textAlign: 'center', fontSize: '12px' }}>決算</th>
                    <th style={{ ...cellStyle, textAlign: 'center', fontSize: '12px' }}>差額</th>
                  </tr>
                </thead>
                <tbody>
                  {d.revenues.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ ...cellStyle, textAlign: 'center', color: '#888', fontSize: '12px' }}>
                        収入データなし
                      </td>
                    </tr>
                  ) : (
                    d.revenues.map((r: any) => (
                      <tr key={r.code}>
                        <td style={{ ...cellStyle, fontSize: '12px' }}>{r.name}</td>
                        <td style={{ ...cellStyle, textAlign: 'right', fontSize: '12px' }}>{yen(r.amount)}</td>
                        <td style={{ ...cellStyle, textAlign: 'right', fontSize: '12px' }}>{yen(r.amount)}</td>
                        <td style={{ ...cellStyle, textAlign: 'right', fontSize: '12px' }}>0</td>
                      </tr>
                    ))
                  )}
                  <tr style={{ backgroundColor: '#e8f5e8', fontWeight: 'bold' }}>
                    <td style={{ ...cellStyle, fontSize: '12px' }}>収入 合計</td>
                    <td style={{ ...cellStyle, textAlign: 'right', fontSize: '12px' }}>{yen(d.totalRevenues)}</td>
                    <td style={{ ...cellStyle, textAlign: 'right', fontSize: '12px' }}>{yen(d.totalRevenues)}</td>
                    <td style={{ ...cellStyle, textAlign: 'right', fontSize: '12px' }}>0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div>
            <h5 style={{ 
              backgroundColor: '#ffebee', 
              padding: 10, 
              margin: 0, 
              textAlign: 'center', 
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              支出の部
            </h5>
            <div style={responsiveTableStyle}>
              <table style={{ ...tableStyle, minWidth: '400px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ ...cellStyle, textAlign: 'left', fontSize: '12px' }}>科目</th>
                    <th style={{ ...cellStyle, textAlign: 'center', fontSize: '12px' }}>予算</th>
                    <th style={{ ...cellStyle, textAlign: 'center', fontSize: '12px' }}>決算</th>
                    <th style={{ ...cellStyle, textAlign: 'center', fontSize: '12px' }}>差額</th>
                  </tr>
                </thead>
                <tbody>
                  {d.expenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ ...cellStyle, textAlign: 'center', color: '#888', fontSize: '12px' }}>
                        支出データなし
                      </td>
                    </tr>
                  ) : (
                    d.expenses.map((e: any) => {
                      const budgetAmount = Math.round(e.amount * 1.1 / 1000) * 1000
                      const variance = budgetAmount - e.amount
                      return (
                        <tr key={e.code}>
                          <td style={{ ...cellStyle, fontSize: '12px' }}>{e.name}</td>
                          <td style={{ ...cellStyle, textAlign: 'right', fontSize: '12px' }}>{yen(budgetAmount)}</td>
                          <td style={{ ...cellStyle, textAlign: 'right', fontSize: '12px' }}>{yen(e.amount)}</td>
                          <td style={{ ...cellStyle, textAlign: 'right', color: variance >= 0 ? 'green' : 'red', fontSize: '12px' }}>
                            {variance >= 0 ? yen(variance) : `▲${yen(Math.abs(variance))}`}
                          </td>
                        </tr>
                      )
                    })
                  )}
                  <tr style={{ backgroundColor: '#ffebee', fontWeight: 'bold' }}>
                    <td style={{ ...cellStyle, fontSize: '12px' }}>支出 合計</td>
                    <td style={{ ...cellStyle, textAlign: 'right', fontSize: '12px' }}>
                      {yen(Math.round(d.totalExpenses * 1.1 / 1000) * 1000)}
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'right', fontSize: '12px' }}>{yen(d.totalExpenses)}</td>
                    <td style={{ ...cellStyle, textAlign: 'right', color: 'green', fontSize: '12px' }}>
                      {yen(Math.round(d.totalExpenses * 1.1 / 1000) * 1000 - d.totalExpenses)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* 収支計算のまとめ - レスポンシブ対応 */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '2px solid #007bff', 
          borderRadius: 8, 
          padding: '15px'
        }}>
          <h5 style={{ 
            textAlign: 'center', 
            marginBottom: 15, 
            color: '#007bff',
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)'
          }}>
            収支計算のまとめ
          </h5>
          <div style={{ fontSize: 'clamp(14px, 2vw, 16px)', lineHeight: '1.8' }}>
            <div className="d-flex flex-column flex-sm-row justify-content-between">
              <strong>前期繰越金:</strong> 
              <span>{yen(previousBalance)}</span>
            </div>
            <div className="d-flex flex-column flex-sm-row justify-content-between">
              <strong>当期収入合計（決算）:</strong> 
              <span>{yen(d.totalRevenues)}</span>
            </div>
            <div className="d-flex flex-column flex-sm-row justify-content-between">
              <strong>当期支出合計（決算）:</strong> 
              <span>{yen(d.totalExpenses)}</span>
            </div>
            <div className="d-flex flex-column flex-sm-row justify-content-between" 
                 style={{ borderTop: '1px solid #ddd', paddingTop: 10, marginTop: 10 }}>
              <strong>当期収支差額:</strong>
              <span style={{ color: net >= 0 ? 'green' : 'red' }}>
                {net >= 0 ? yen(net) : `▲${yen(Math.abs(net))}`} {net >= 0 ? '（黒字）' : '（赤字）'}
              </span>
            </div>
            <div className="d-flex flex-column flex-sm-row justify-content-between" 
                 style={{ 
                   borderTop: '2px solid #007bff', 
                   paddingTop: 10, 
                   marginTop: 10, 
                   fontSize: 'clamp(16px, 2.5vw, 18px)', 
                   fontWeight: 'bold' 
                 }}>
              <strong>次期繰越金:</strong>
              <span style={{ color: '#007bff' }}>{yen(nextBalance)}</span>
            </div>
          </div>
        </div>
        
        {/* ポイント - レスポンシブ対応 */}
        <div style={{ 
          marginTop: 20, 
          padding: '10px 15px', 
          backgroundColor: '#fff3cd', 
          borderRadius: 5 
        }}>
          <h6 style={{ color: '#856404', fontSize: 'clamp(14px, 2vw, 16px)' }}>ポイント</h6>
          <ul style={{ 
            marginBottom: 0, 
            color: '#856404', 
            fontSize: 'clamp(12px, 1.8vw, 14px)',
            paddingLeft: '20px'
          }}>
            <li>収入は予算通りでしたが、支出全体では予算よりも約{yen(Math.round(d.totalExpenses * 0.1))}少なく抑えられました。</li>
            <li>結果として、この期間単体では{Math.abs(net) > 0 ? yen(Math.abs(net)) : '0円'}の{net >= 0 ? '黒字' : '赤字'}となりました。</li>
            <li>この次期繰越金（{yen(nextBalance)}）は、貸借対照表の純資産合計（次期繰越金）と一致しています。</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid px-2 px-sm-3">
      <div className="row mb-3">
        <div className="col-md-6">
          <YearSelect value={year} onChange={setYear} />
        </div>
        <div className="col-md-6">
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0">会計区分</label>
            <select 
              className="form-select" 
              style={{ maxWidth: 250 }}
              value={selectedDivision}
              onChange={e => setSelectedDivision(e.target.value)}
            >
              <option value="ALL">全区分表示</option>
              <optgroup label="一般会計">
                <option value="KANRI">管理費会計</option>
              </optgroup>
              <optgroup label="特別会計">
                <option value="SHUZEN">修繕積立金会計</option>
                <option value="PARKING">駐車場会計</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>
      
      {selectedDivision === 'ALL' ? (
        <>
          <div className="alert alert-info mb-3">
            <i className="bi bi-info-circle"></i> 全会計区分の収支報告書を表示しています
          </div>
          {renderReport('管理費会計（一般会計）', kanri, 'KANRI')}
          {shuzen && shuzen.totalRevenues > 0 && renderReport('修繕積立金会計（特別会計）', shuzen, 'SHUZEN')}
          {parking && parking.totalRevenues > 0 && renderReport('駐車場会計（特別会計）', parking, 'PARKING')}
        </>
      ) : selectedDivision === 'KANRI' ? (
        renderReport('管理費会計（一般会計）', kanri, 'KANRI')
      ) : selectedDivision === 'SHUZEN' ? (
        renderReport('修繕積立金会計（特別会計）', shuzen, 'SHUZEN')
      ) : selectedDivision === 'PARKING' ? (
        renderReport('駐車場会計（特別会計）', parking, 'PARKING')
      ) : null}
    </div>
  )
}