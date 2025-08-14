import React from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'
import { TrialBalanceEntry } from '../../types'

export const TrialBalanceView: React.FC<{ engine: AccountingEngine }> = ({ engine }) => {
  const tb = engine.getTrialBalance()
  if (tb.accounts.length === 0) return <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}><h3>試算表</h3><p style={{ color: '#888' }}>残高がありません</p></div>
  const warn = !tb.isBalanced

  const groups: Record<string, typeof tb.accounts> = {
    '資産の部': [],
    '負債の部': [],
    '正味財産の部': [],
    '収益の部': [],
    '費用の部': [],
  }
  tb.accounts.forEach((a: TrialBalanceEntry) => {
    const acc = engine.accounts.get(a.code)
    if (acc) {
      switch (acc.type) {
        case 'ASSET': groups['資産の部']?.push(a); break
        case 'LIABILITY': groups['負債の部']?.push(a); break
        case 'EQUITY': groups['正味財産の部']?.push(a); break
        case 'REVENUE': groups['収益の部']?.push(a); break
        case 'EXPENSE': groups['費用の部']?.push(a); break
      }
    }
  })

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <h3>試算表</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>勘定科目</th>
            <th style={{ textAlign: 'center' }}>会計区分</th>
            <th style={{ textAlign: 'right' }}>借方残高</th>
            <th style={{ textAlign: 'right' }}>貸方残高</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groups).map(([name, list]) => (
            list.length > 0 && (
              <React.Fragment key={name}>
                <tr style={{ background: '#f2f2f2' }}>
                  <td colSpan={4}><strong>{name}</strong></td>
                </tr>
                {list.map((a: TrialBalanceEntry) => {
                  const acc = engine.accounts.get(a.code)
                  const divisionText = acc?.division ?? '-'
                  return (
                    <tr key={a.code}>
                      <td>&nbsp;&nbsp;{a.code} - {a.name}</td>
                      <td style={{ textAlign: 'center' }}><span style={{ background: '#ddd', padding: '2px 6px', borderRadius: 4 }}>{divisionText}</span></td>
                      <td style={{ textAlign: 'right', color: '#0d6efd' }}>{a.debitBalance > 0 ? `¥${a.debitBalance.toLocaleString()}` : ''}</td>
                      <td style={{ textAlign: 'right', color: '#dc3545' }}>{a.creditBalance > 0 ? `¥${a.creditBalance.toLocaleString()}` : ''}</td>
                    </tr>
                  )
                })}
              </React.Fragment>
            )
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2}><strong>合計</strong></td>
            <td style={{ textAlign: 'right', color: '#0d6efd' }}><strong>¥{tb.totalDebit.toLocaleString()}</strong></td>
            <td style={{ textAlign: 'right', color: '#dc3545' }}><strong>¥{tb.totalCredit.toLocaleString()}</strong></td>
          </tr>
        </tfoot>
      </table>
      {!tb.isBalanced && <div className="alert alert-warning mt-2 mb-0">試算表が貸借不一致です。期首残高や仕訳の整合をご確認ください。</div>}
    </div>
  )
}
