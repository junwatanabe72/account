import React, { useState } from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'

export const BalanceSheetView: React.FC<{ engine: AccountingEngine }> = ({ engine }) => {
  const [showDebug, setShowDebug] = useState(false)
  const bs = engine.getBalanceSheet()
  
  // デバッグ情報の計算
  const debugInfo = showDebug ? engine.getBalanceSheetDebugInfo() : null
  
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3>貸借対照表</h3>
        <button 
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? 'デバッグ情報を隠す' : 'デバッグ情報を表示'}
        </button>
      </div>
      
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
                    <td>{a.code} {a.name}</td>
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
                    <td>{a.code} {a.name}</td>
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
                    <td>{a.code} {a.name}</td>
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
      
      {/* 貸借対照チェック */}
      <div style={{ border: `2px solid ${bs.isBalanced ? 'green' : 'crimson'}`, marginTop: 12, padding: 12, textAlign: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div>
            <h5>資産合計</h5>
            <div style={{ color: '#0d6efd', fontSize: '1.2em' }}>¥{bs.totalAssets.toLocaleString()}</div>
          </div>
          <div>
            <h5>負債・正味財産合計</h5>
            <div style={{ color: 'green', fontSize: '1.2em' }}>¥{(bs.totalLiabilities + bs.totalEquity).toLocaleString()}</div>
          </div>
          <div>
            <h5>貸借対照</h5>
            <div style={{ color: bs.isBalanced ? 'green' : 'crimson', fontSize: '1.2em' }}>
              {bs.isBalanced ? '✓ 一致' : '✗ 不一致'}
            </div>
            {!bs.isBalanced && (
              <div style={{ color: 'crimson', fontSize: '0.9em' }}>
                差額: ¥{Math.abs(bs.totalAssets - (bs.totalLiabilities + bs.totalEquity)).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* デバッグ情報 */}
      {showDebug && debugInfo && (
        <div style={{ marginTop: 20, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
          <h5>デバッグ情報</h5>
          <div style={{ fontSize: '0.9em', fontFamily: 'monospace' }}>
            <h6>資産の部 詳細:</h6>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>科目コード</th>
                  <th>科目名</th>
                  <th>残高</th>
                  <th>借方/貸方</th>
                  <th>表示金額</th>
                  <th>集計値</th>
                </tr>
              </thead>
              <tbody>
                {debugInfo.assets.map(item => (
                  <tr key={item.code}>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.balance}</td>
                    <td>{item.isDebit ? '借方' : '貸方'}</td>
                    <td>{item.displayAmount}</td>
                    <td>{item.calculatedAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <h6>負債の部 詳細:</h6>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>科目コード</th>
                  <th>科目名</th>
                  <th>残高</th>
                  <th>借方/貸方</th>
                  <th>表示金額</th>
                  <th>集計値</th>
                </tr>
              </thead>
              <tbody>
                {debugInfo.liabilities.map(item => (
                  <tr key={item.code}>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.balance}</td>
                    <td>{item.isDebit ? '借方' : '貸方'}</td>
                    <td>{item.displayAmount}</td>
                    <td>{item.calculatedAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <h6>正味財産の部 詳細:</h6>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>科目コード</th>
                  <th>科目名</th>
                  <th>残高</th>
                  <th>借方/貸方</th>
                  <th>表示金額</th>
                  <th>集計値</th>
                </tr>
              </thead>
              <tbody>
                {debugInfo.equity.map(item => (
                  <tr key={item.code}>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.balance}</td>
                    <td>{item.isDebit ? '借方' : '貸方'}</td>
                    <td>{item.displayAmount}</td>
                    <td>{item.calculatedAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ marginTop: 10 }}>
              <strong>計算式:</strong><br />
              資産合計 = {debugInfo.assetCalculation}<br />
              負債合計 = {debugInfo.liabilityCalculation}<br />
              正味財産合計 = {debugInfo.equityCalculation}<br />
              当期収支差額 = {debugInfo.netIncome}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}