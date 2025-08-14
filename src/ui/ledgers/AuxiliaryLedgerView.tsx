import React from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'

import { UnitOwnersEditor } from '../masters/UnitOwnersEditor'

export const AuxiliaryLedgerView: React.FC<{ engine: AccountingEngine, onChange: () => void }> = ({ engine, onChange }) => {
  const unitReceivables = engine.getUnitReceivablesSummary()
  const auxiliarySummary = engine.getAuxiliaryLedgerSummary()
  const [showEditor, setShowEditor] = React.useState(false)
  const canBill = (() => {
    let ok = false
    engine.unitOwners.forEach((o: any) => {
      if (o.isActive && ((o.monthlyManagementFee ?? 0) > 0 || (o.monthlyReserveFund ?? 0) > 0)) ok = true
    })
    return ok
  })()

  const createMonthly = () => {
    const today = new Date()
    const billingDate = today.toISOString().split('T')[0]
    // 今日の月初日付に丸める
    const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`
    if (confirm(`${today.getFullYear()}年${today.getMonth() + 1}月分の月次請求を作成しますか？`)) {
      // 事前チェック
      let total = 0, active = 0
      engine.unitOwners.forEach((o: any) => { if (o.isActive) { active++; total += (Number(o.monthlyManagementFee)||0) + (Number(o.monthlyReserveFund)||0) } })
      if (active === 0 || total === 0) { alert('月次請求の作成に失敗: 有効な組合員または月額がありません'); return }
      const res = engine.createMonthlyBilling(firstOfMonth)
      if (res.success) { alert('月次請求を作成しました。補助元帳をご確認ください。'); onChange() }
      else alert(`月次請求の作成に失敗: ${(res as any).errors?.join(', ')}`)
    }
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>補助元帳</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={createMonthly} disabled={!canBill} title={!canBill ? '有効な組合員と月額が必要です（組合員管理で設定）' : undefined}>月次請求作成</button>
          <button onClick={() => setShowEditor(true)}>組合員管理</button>
        </div>
      </div>

      {unitReceivables.length > 0 && (
        <div style={{ border: '1px solid #ffe08a', background: '#fff7db', borderRadius: 8, marginTop: 12 }}>
          <div style={{ padding: '8px 12px', fontWeight: 600 }}>部屋別未収金一覧</div>
          <div style={{ padding: 12, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>部屋番号</th>
                  <th>所有者</th>
                  <th>階</th>
                  <th style={{ textAlign: 'right' }}>未収管理費</th>
                  <th style={{ textAlign: 'right' }}>未収修繕積立金</th>
                  <th style={{ textAlign: 'right' }}>合計</th>
                </tr>
              </thead>
              <tbody>
                {unitReceivables.map(u => {
                  const floor = u.unitNumber.charAt(0)
                  return (
                    <tr key={u.unitNumber}>
                      <td>{u.unitNumber}</td>
                      <td>{u.ownerName}</td>
                      <td style={{ textAlign: 'center' }}>{floor}F</td>
                      <td style={{ textAlign: 'right' }}>¥{Math.abs(u.managementFeeReceivable).toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>¥{Math.abs(u.reserveFundReceivable).toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}><strong>¥{Math.abs(u.totalReceivable).toLocaleString()}</strong></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {auxiliarySummary.length > 0 ? (
        <div style={{ border: '1px solid #0dcaf0', borderRadius: 8, marginTop: 12 }}>
          <div style={{ background: '#0dcaf0', color: 'white', padding: '8px 12px', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>補助元帳一覧</div>
          <div style={{ padding: 12, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>主勘定科目</th>
                  <th>補助科目</th>
                  <th style={{ textAlign: 'right' }}>残高</th>
                  <th style={{ textAlign: 'center' }}>取引数</th>
                  <th>属性</th>
                </tr>
              </thead>
              <tbody>
                {auxiliarySummary.flatMap(accountGroup => 
                  accountGroup.auxiliaries.map(aux => {
                    // 補助元帳の実際のインスタンスを取得して属性情報を取得
                    const account = engine.accounts.get(accountGroup.accountCode)
                    const auxLedger = account?.getAuxiliaryLedger(aux.code)
                    const attrs: string[] = []
                    if (auxLedger?.attributes?.owner) {
                      const owner = auxLedger.attributes.owner
                      attrs.push(`部屋: ${owner.unitNumber}`)
                      attrs.push(`所有者: ${owner.ownerName}`)
                    }
                    return (
                      <tr key={`${accountGroup.accountCode}-${aux.code}`}>
                        <td>{accountGroup.accountName}</td>
                        <td>{aux.name}</td>
                        <td style={{ textAlign: 'right', color: aux.isDebit ? '#0d6efd' : '#dc3545' }}>¥{aux.balance.toLocaleString()}</td>
                        <td style={{ textAlign: 'center' }}>{auxLedger?.transactions.length || 0}</td>
                        <td><small style={{ color: '#666' }}>{attrs.join(', ')}</small></td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p style={{ color: '#888', marginTop: 12 }}>補助元帳データがありません</p>
      )}

      {showEditor && (
        <UnitOwnersEditor engine={engine} onClose={() => setShowEditor(false)} onSaved={onChange} />
      )}
    </div>
  )
}
