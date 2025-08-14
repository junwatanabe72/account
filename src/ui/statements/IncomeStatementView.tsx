import React from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'

export const IncomeStatementView: React.FC<{ engine: AccountingEngine }> = ({ engine }) => {
  const pl = engine.getIncomeStatement()
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <h3>損益計算書</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <h4 style={{ color: '#0d6efd' }}>収益の部</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {pl.revenues.length === 0 ? (
                <tr><td style={{ color: '#888' }}>収益データなし</td></tr>
              ) : (
                pl.revenues.map(r => (
                  <tr key={r.code}>
                    <td>{r.name}</td>
                    <td style={{ textAlign: 'right' }}>¥{r.amount.toLocaleString()}</td>
                  </tr>
                ))
              )}
              <tr style={{ borderTop: '2px solid #000' }}>
                <td><strong>収益合計</strong></td>
                <td style={{ textAlign: 'right' }}><strong>¥{pl.totalRevenue.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <h4 style={{ color: '#dc3545' }}>費用の部</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {pl.expenses.length === 0 ? (
                <tr><td style={{ color: '#888' }}>費用データなし</td></tr>
              ) : (
                pl.expenses.map(r => (
                  <tr key={r.code}>
                    <td>{r.name}</td>
                    <td style={{ textAlign: 'right' }}>¥{r.amount.toLocaleString()}</td>
                  </tr>
                ))
              )}
              <tr style={{ borderTop: '2px solid #000' }}>
                <td><strong>費用合計</strong></td>
                <td style={{ textAlign: 'right' }}><strong>¥{pl.totalExpense.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ border: '1px solid #ccc', marginTop: 12, padding: 12, textAlign: 'center' }}>
        <h4>当期収支差額</h4>
        <h3 style={{ color: pl.netIncome >= 0 ? 'green' : 'crimson' }}>
          ¥{Math.abs(pl.netIncome).toLocaleString()} {pl.netIncome >= 0 ? '（黒字）' : '（赤字）'}
        </h3>
      </div>
    </div>
  )
}
