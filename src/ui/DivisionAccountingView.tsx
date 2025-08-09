import React from 'react'
import { AccountingEngine } from '../domain/accountingEngine'

export const DivisionAccountingView: React.FC<{ engine: AccountingEngine }> = ({ engine }) => {
  const divisions = engine.getDivisionTrialBalance()

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <h3>区分経理状況</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from(divisions.entries()).map(([code, div]) => {
          const hasAny = div.totalAssets > 0 || div.totalLiabilities > 0 || div.totalRevenues > 0 || div.totalExpenses > 0
          if (code === 'OTHER' && !hasAny) return null
          const netIncome = div.totalRevenues - div.totalExpenses
          return (
            <div key={code} style={{ border: '1px solid #eee', borderRadius: 8 }}>
              <div style={{ background: '#0d6efd', color: 'white', padding: '8px 12px', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                <strong>{div.name}</strong>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <h4 style={{ color: '#0d6efd', margin: '6px 0', fontSize: '14px' }}>資産</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12px' }}>
                      {div.assets.length === 0 ? <li style={{ color: '#888' }}>なし</li> : div.assets.map(a => (
                        <li key={a.code}>{a.name}: ¥{a.amount.toLocaleString()}</li>
                      ))}
                    </ul>
                    <div style={{ fontSize: '13px' }}><strong>資産計: ¥{div.totalAssets.toLocaleString()}</strong></div>
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <h4 style={{ color: '#b36b00', margin: '6px 0', fontSize: '14px' }}>負債</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12px' }}>
                      {div.liabilities.length === 0 ? <li style={{ color: '#888' }}>なし</li> : div.liabilities.map(a => (
                        <li key={a.code}>{a.name}: ¥{a.amount.toLocaleString()}</li>
                      ))}
                    </ul>
                    <div style={{ fontSize: '13px' }}><strong>負債計: ¥{div.totalLiabilities.toLocaleString()}</strong></div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <h4 style={{ color: 'green', margin: '6px 0', fontSize: '14px' }}>収益</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12px' }}>
                      {div.revenues.length === 0 ? <li style={{ color: '#888' }}>なし</li> : div.revenues.map(a => (
                        <li key={a.code}>{a.name}: ¥{a.amount.toLocaleString()}</li>
                      ))}
                    </ul>
                    <div style={{ fontSize: '13px' }}><strong>収益計: ¥{div.totalRevenues.toLocaleString()}</strong></div>
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <h4 style={{ color: '#dc3545', margin: '6px 0', fontSize: '14px' }}>費用</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12px' }}>
                      {div.expenses.length === 0 ? <li style={{ color: '#888' }}>なし</li> : div.expenses.map(a => (
                        <li key={a.code}>{a.name}: ¥{a.amount.toLocaleString()}</li>
                      ))}
                    </ul>
                    <div style={{ fontSize: '13px' }}><strong>費用計: ¥{div.totalExpenses.toLocaleString()}</strong></div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', paddingTop: 8, borderTop: '1px solid #eee' }}>
                  <h5 style={{ fontSize: '14px', margin: '4px 0' }}>収支差額</h5>
                  <div style={{ color: netIncome >= 0 ? 'green' : 'crimson', fontSize: 16 }}>
                    ¥{Math.abs(netIncome).toLocaleString()} {netIncome >= 0 ? '（黒字）' : '（赤字）'}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
