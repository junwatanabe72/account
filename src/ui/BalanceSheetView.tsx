import React from 'react'
import { AccountingEngine } from '../domain/accountingEngine'

export const BalanceSheetView: React.FC<{ engine: AccountingEngine }> = ({ engine }) => {
  const bs = engine.getBalanceSheet()
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <h3>貸借対照表</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <h4 style={{ color: '#0d6efd' }}>資産の部</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {bs.assets.length === 0 ? (
                <tr><td style={{ color: '#888' }}>資産データなし</td></tr>
              ) : (
                bs.assets.map(a => (
                  <tr key={a.code}>
                    <td>{a.name}</td>
                    <td style={{ textAlign: 'right' }}>¥{a.amount.toLocaleString()}</td>
                  </tr>
                ))
              )}
              <tr style={{ borderTop: '2px solid #000' }}>
                <td><strong>資産合計</strong></td>
                <td style={{ textAlign: 'right' }}><strong>¥{bs.totalAssets.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <h4 style={{ color: '#b36b00' }}>負債の部</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {bs.liabilities.length === 0 ? (
                <tr><td style={{ color: '#888' }}>負債データなし</td></tr>
              ) : (
                bs.liabilities.map(a => (
                  <tr key={a.code}>
                    <td>{a.name}</td>
                    <td style={{ textAlign: 'right' }}>¥{a.amount.toLocaleString()}</td>
                  </tr>
                ))
              )}
              <tr style={{ borderTop: '2px solid #000' }}>
                <td><strong>負債合計</strong></td>
                <td style={{ textAlign: 'right' }}><strong>¥{bs.totalLiabilities.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>
          <h4 style={{ color: 'green', marginTop: 12 }}>正味財産の部</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {bs.equity.length === 0 ? (
                <tr><td style={{ color: '#888' }}>正味財産データなし</td></tr>
              ) : (
                bs.equity.map(a => (
                  <tr key={a.code}>
                    <td>{a.name}</td>
                    <td style={{ textAlign: 'right' }}>¥{a.amount.toLocaleString()}</td>
                  </tr>
                ))
              )}
              <tr style={{ borderTop: '2px solid #000' }}>
                <td><strong>正味財産合計</strong></td>
                <td style={{ textAlign: 'right' }}><strong>¥{bs.totalEquity.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ border: `1px solid ${bs.isBalanced ? 'green' : 'crimson'}`, marginTop: 12, padding: 12, textAlign: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div>
            <h5>資産合計</h5>
            <div style={{ color: '#0d6efd' }}>¥{bs.totalAssets.toLocaleString()}</div>
          </div>
          <div>
            <h5>負債・正味財産合計</h5>
            <div style={{ color: 'green' }}>¥{(bs.totalLiabilities + bs.totalEquity).toLocaleString()}</div>
          </div>
          <div>
            <h5>貸借対照</h5>
            <div style={{ color: bs.isBalanced ? 'green' : 'crimson' }}>{bs.isBalanced ? '✓ 一致' : '✗ 不一致'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
