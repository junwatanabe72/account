import React, { useState, useMemo } from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'
import { 
  AccountingDivision,
  DEFAULT_ACCOUNTING_DIVISIONS,
  getGroupedAccountingDivisions,
  TOP_LEVEL_NAMES
} from '../../types/accountingDivision'

interface ExpenseDetail {
  journalId: string
  date: string
  number: string
  accountCode: string
  accountName: string
  description: string
  amount: number
  auxiliaryCode?: string
  auxiliaryName?: string
  division?: string
}

interface AccountSummary {
  accountCode: string
  accountName: string
  amount: number
  count: number
  division?: string
  auxiliaryDetails?: Array<{
    auxiliaryCode: string
    auxiliaryName: string
    amount: number
    count: number
  }>
}

const YearSelect: React.FC<{ value: string, onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div className="d-flex align-items-center gap-2 mb-2">
    <label className="form-label mb-0">年度</label>
    <select className="form-select" style={{ maxWidth: 180 }} value={value} onChange={e => onChange(e.target.value)}>
      <option value="2023">2023年度</option>
      <option value="2024">2024年度</option>
      <option value="2025">2025年度</option>
    </select>
  </div>
)

interface ExpenseDetailViewProps {
  engine: AccountingEngine
}

export const ExpenseDetailView: React.FC<ExpenseDetailViewProps> = ({ engine }) => {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(String(currentYear))
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL')
  const accountingDivisions = DEFAULT_ACCOUNTING_DIVISIONS
  const divisionGroups = getGroupedAccountingDivisions(accountingDivisions)
  
  const yearDates = useMemo(() => {
    const fiscalYear = parseInt(year)
    // 現在月のデータを表示（サンプルデータが1ヶ月分のため）
    const currentMonth = new Date().getMonth() + 1
    return {
      start: `${fiscalYear}-${String(currentMonth).padStart(2, '0')}-01`,
      end: `${fiscalYear}-${String(currentMonth).padStart(2, '0')}-31`
    }
  }, [year])
  
  const [startDate, setStartDate] = useState(yearDates.start)
  const [endDate, setEndDate] = useState(yearDates.end)
  
  React.useEffect(() => {
    setStartDate(yearDates.start)
    setEndDate(yearDates.end)
  }, [yearDates])
  
  const divisions = useMemo(() => {
    if (selectedDivision === 'ALL') {
      const divs = Array.from(engine.divisions.values())
      return [
        ...divs.map(d => ({ code: d.code, name: d.name })),
        { code: 'OTHER', name: 'その他' }
      ]
    } else {
      // 選択された会計区分のみ
      const selected = accountingDivisions.find(d => {
        // 旧コードとの互換性を保つ
        if (selectedDivision === 'KANRI') return d.code === 'GENERAL'
        return d.code === selectedDivision
      })
      
      if (selected) {
        const legacyCode = selectedDivision === 'GENERAL' ? 'KANRI' : selectedDivision
        return [{ code: legacyCode, name: selected.name }]
      }
      return []
    }
  }, [engine, selectedDivision, accountingDivisions])
  
  const divisionData = useMemo(() => {
    const data = new Map()
    divisions.forEach(div => {
      const details = engine.getExpenseDetails(startDate, endDate, div.code)
      const summary = engine.getExpenseDetailSummary(startDate, endDate, div.code)
      if (details.length > 0 || summary.length > 0) {
        data.set(div.code, {
          name: div.name,
          details,
          summary
        })
      }
    })
    return data
  }, [engine, startDate, endDate, divisions])
  
  const monthColumns = useMemo(() => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const months: string[] = []
    
    let current = new Date(start.getFullYear(), start.getMonth(), 1)
    while (current <= end) {
      months.push(current.toISOString().substring(0, 7))
      current.setMonth(current.getMonth() + 1)
    }
    
    return months
  }, [startDate, endDate])
  
  const formatYen = (amount: number) => `¥${amount.toLocaleString()}`
  
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    return `${year}年${parseInt(monthNum || '0')}月`
  }
  
  const getAuxiliaryMonthlyData = (expenseDetails: ExpenseDetail[]) => {
    const data = new Map<string, Map<string, number>>()
    
    expenseDetails.forEach(detail => {
      if (detail.auxiliaryCode) {
        const key = `${detail.accountCode}-${detail.auxiliaryCode}`
        const month = detail.date.substring(0, 7)
        
        if (!data.has(key)) {
          data.set(key, new Map())
        }
        
        const monthData = data.get(key)!
        monthData.set(month, (monthData.get(month) || 0) + detail.amount)
      }
    })
    
    return data
  }

  const handleStartDateChange = (value: string) => {
    const start = new Date(value)
    const end = new Date(endDate)
    
    if (isNaN(start.getTime())) {
      alert('無効な日付形式です')
      return
    }
    
    if (start > end) {
      alert('開始日は終了日より前の日付を指定してください')
      return
    }
    
    setStartDate(value)
  }

  const handleEndDateChange = (value: string) => {
    const start = new Date(startDate)
    const end = new Date(value)
    
    if (isNaN(end.getTime())) {
      alert('無効な日付形式です')
      return
    }
    
    if (start > end) {
      alert('終了日は開始日より後の日付を指定してください')
      return
    }
    
    setEndDate(value)
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <h3>支出明細表</h3>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <YearSelect value={year} onChange={setYear} />
        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0">会計区分</label>
          <select 
            className="form-select" 
            style={{ maxWidth: 250 }}
            value={selectedDivision}
            onChange={e => setSelectedDivision(e.target.value)}
          >
            <option value="ALL">全区分表示</option>
            {divisionGroups.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map(division => {
                  // 旧コードとの互換性
                  const legacyCode = division.code === 'GENERAL' ? 'KANRI' : 
                                     division.code === 'SPECIAL_OTHER' ? 'SPECIAL' : 
                                     division.code
                  return (
                    <option key={division.code} value={legacyCode}>
                      {division.name}
                    </option>
                  )
                })}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label>開始日: </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <label>終了日: </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
      </div>

      {Array.from(divisionData.entries()).map(([divCode, data]) => {
        const auxiliaryMonthlyData = getAuxiliaryMonthlyData(data.details)
        const totalByMonth = new Map<string, number>()
        
        // 月別の集計を詳細データから作成
        data.details.forEach((detail: ExpenseDetail) => {
          const month = detail.date.substring(0, 7)
          totalByMonth.set(month, (totalByMonth.get(month) || 0) + detail.amount)
        })
        
        const grandTotal = data.summary.reduce((sum: number, account: AccountSummary) => sum + account.amount, 0)
        
        return (
          <div key={divCode} style={{ marginBottom: 48, border: '2px solid #dc3545', borderRadius: 8, padding: 16 }}>
            <h3 style={{ color: '#dc3545', marginBottom: 16 }}>{data.name} 支出明細表</h3>
            
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ color: '#dc3545' }}>支出明細（月次集計）</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>科目</th>
                      {monthColumns.map(month => (
                        <th key={month} style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right', minWidth: 100 }}>
                          {formatMonth(month)}
                        </th>
                      ))}
                      <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right', backgroundColor: '#e9ecef' }}>合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.summary.map((account: AccountSummary) => {
                      // 各勘定科目の月別集計を計算
                      const accountMonthlyData = new Map<string, number>()
                      data.details
                        .filter((detail: ExpenseDetail) => detail.accountCode === account.accountCode && !detail.auxiliaryCode)
                        .forEach((detail: ExpenseDetail) => {
                          const month = detail.date.substring(0, 7)
                          accountMonthlyData.set(month, (accountMonthlyData.get(month) || 0) + detail.amount)
                        })
                      
                      return (
                        <React.Fragment key={account.accountCode}>
                          <tr>
                            <td style={{ border: '1px solid #ddd', padding: 8, fontWeight: 'bold' }}>
                              {account.accountCode} {account.accountName}
                            </td>
                            {monthColumns.map(month => (
                              <td key={month} style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>
                                {accountMonthlyData.get(month) ? formatYen(accountMonthlyData.get(month)!) : '-'}
                              </td>
                            ))}
                            <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>
                              {formatYen(account.amount)}
                            </td>
                          </tr>
                          {account.auxiliaryDetails && account.auxiliaryDetails.length > 0 && (
                            account.auxiliaryDetails.map((aux) => {
                              const auxKey = `${account.accountCode}-${aux.auxiliaryCode}`
                              const auxMonthly = auxiliaryMonthlyData.get(auxKey)
                              return (
                                <tr key={auxKey} style={{ backgroundColor: '#f8f9fa' }}>
                                  <td style={{ border: '1px solid #ddd', padding: '4px 8px 4px 24px', fontSize: 12 }}>
                                    └ {aux.auxiliaryName}
                                  </td>
                                  {monthColumns.map(month => (
                                    <td key={month} style={{ border: '1px solid #ddd', padding: 4, textAlign: 'right', fontSize: 12 }}>
                                      {auxMonthly?.get(month) ? formatYen(auxMonthly.get(month)!) : '-'}
                                    </td>
                                  ))}
                                  <td style={{ border: '1px solid #ddd', padding: 4, textAlign: 'right', fontSize: 12 }}>
                                    {formatYen(aux.amount)}
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </React.Fragment>
                      )
                    })}
                    <tr style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>支出合計</td>
                      {monthColumns.map(month => (
                        <td key={month} style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>
                          {totalByMonth.get(month) ? formatYen(totalByMonth.get(month)!) : '-'}
                        </td>
                      ))}
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right', fontSize: 16 }}>
                        {formatYen(grandTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 style={{ color: '#dc3545' }}>支出明細（詳細）</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ border: '1px solid #ddd', padding: 6, textAlign: 'left' }}>日付</th>
                      <th style={{ border: '1px solid #ddd', padding: 6, textAlign: 'left' }}>伝票番号</th>
                      <th style={{ border: '1px solid #ddd', padding: 6, textAlign: 'left' }}>科目</th>
                      <th style={{ border: '1px solid #ddd', padding: 6, textAlign: 'left' }}>摘要</th>
                      <th style={{ border: '1px solid #ddd', padding: 6, textAlign: 'left' }}>補助元帳</th>
                      <th style={{ border: '1px solid #ddd', padding: 6, textAlign: 'right' }}>金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.details.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ border: '1px solid #ddd', padding: 16, textAlign: 'center', color: '#888' }}>
                          該当する支出データがありません
                        </td>
                      </tr>
                    ) : (
                      data.details.map((detail: ExpenseDetail, index: number) => (
                        <tr key={index}>
                          <td style={{ border: '1px solid #ddd', padding: 6 }}>{detail.date}</td>
                          <td style={{ border: '1px solid #ddd', padding: 6 }}>{detail.journalNumber}</td>
                          <td style={{ border: '1px solid #ddd', padding: 6 }}>{detail.accountCode} {detail.accountName}</td>
                          <td style={{ border: '1px solid #ddd', padding: 6 }}>{detail.description}</td>
                          <td style={{ border: '1px solid #ddd', padding: 6 }}>{detail.auxiliaryName || '-'}</td>
                          <td style={{ border: '1px solid #ddd', padding: 6, textAlign: 'right' }}>{formatYen(detail.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })}

      {divisionData.size === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: '#888' }}>
          指定期間内に支出データがありません
        </div>
      )}
    </div>
  )
}