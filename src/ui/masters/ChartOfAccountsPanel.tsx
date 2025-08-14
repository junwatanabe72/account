import React from 'react'
import { AccountingEngine, AccountDef } from '../../domain/accountingEngine'

export const ChartOfAccountsPanel: React.FC<{ engine: AccountingEngine, onChanged: () => void }> = ({ engine, onChanged }) => {
  const [defs, setDefs] = React.useState<AccountDef[]>(engine.getChartOfAccounts())
  const [newDef, setNewDef] = React.useState<AccountDef>({ code: '', name: '', type: 'ASSET', normalBalance: 'DEBIT', level: 4, parentCode: undefined, division: undefined, isActive: true })

  const reload = () => setDefs(engine.getChartOfAccounts())

  const save = () => {
    const errors: string[] = []
    for (const d of defs) {
      const res = engine.addOrUpdateAccount(d)
      if (!(res as any).success) errors.push(`${d.code}: ${(res as any).errors.join(', ')}`)
    }
    onChanged();
    if (errors.length) alert('一部保存に失敗:\n' + errors.join('\n'))
    else alert('勘定科目を保存しました')
  }
  const add = () => {
    if (!newDef.code || !newDef.name) { alert('コードと名称は必須です'); return }
    const res = engine.addOrUpdateAccount(newDef)
    if (!(res as any).success) { alert((res as any).errors.join(', ')); return }
    setDefs(engine.getChartOfAccounts())
    setNewDef({ code: '', name: '', type: 'ASSET', normalBalance: 'DEBIT', level: 4, parentCode: undefined, division: undefined, isActive: true })
    onChanged()
  }
  const toggleActive = (code: string) => {
    engine.setAccountActive(code, !defs.find(d => d.code === code)?.isActive)
    setDefs(engine.getChartOfAccounts())
    onChanged()
  }

  const types: Array<AccountDef['type']> = ['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE']
  const normals: Array<AccountDef['normalBalance']> = ['DEBIT','CREDIT']

  return (
    <div className="card mt-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <strong>勘定科目マスタ</strong>
        <button className="btn btn-sm btn-primary" onClick={save}>保存</button>
      </div>
      <div className="card-body">
        <div className="mb-3 p-2 border rounded">
          <div className="row g-2 align-items-end">
            <div className="col-md-2">
              <label className="form-label">コード</label>
              <input className="form-control" value={newDef.code} onChange={e => setNewDef({ ...newDef, code: e.target.value })} />
            </div>
            <div className="col-md-3">
              <label className="form-label">名称</label>
              <input className="form-control" value={newDef.name} onChange={e => setNewDef({ ...newDef, name: e.target.value })} />
            </div>
            <div className="col-md-2">
              <label className="form-label">種別</label>
              <select className="form-select" value={newDef.type} onChange={e => setNewDef({ ...newDef, type: e.target.value as any })}>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">正規残</label>
              <select className="form-select" value={newDef.normalBalance} onChange={e => setNewDef({ ...newDef, normalBalance: e.target.value as any })}>
                {normals.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="col-md-1">
              <label className="form-label">レベル</label>
              <input className="form-control" type="number" min={1} max={5} value={newDef.level} onChange={e => setNewDef({ ...newDef, level: Number(e.target.value) })} />
            </div>
            <div className="col-md-2">
              <label className="form-label">親コード</label>
              <input className="form-control" value={newDef.parentCode ?? ''} onChange={e => setNewDef({ ...newDef, parentCode: e.target.value || undefined })} />
            </div>
            <div className="col-md-2">
              <label className="form-label">区分</label>
              <select className="form-select" value={newDef.division ?? ''} onChange={e => setNewDef({ ...newDef, division: e.target.value || undefined })}>
                <option value="">(なし)</option>
                <option value="KANRI">KANRI</option>
                <option value="SHUZEN">SHUZEN</option>
                <option value="PARKING">PARKING</option>
                <option value="SPECIAL">SPECIAL</option>
              </select>
            </div>
            <div className="col-md-1 form-check form-switch">
              <input className="form-check-input" type="checkbox" checked={!!newDef.isActive} onChange={e => setNewDef({ ...newDef, isActive: e.target.checked })} />
              <label className="form-check-label">有効</label>
            </div>
            <div className="col-md-2 text-end">
              <button className="btn btn-sm btn-secondary" onClick={add}>科目追加</button>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end mb-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={reload}>再読込</button>
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-striped">
            <thead>
              <tr>
                <th>コード</th>
                <th>名称</th>
                <th>種別</th>
                <th>正規残</th>
                <th>レベル</th>
                <th>親</th>
                <th>区分</th>
                <th>有効</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {defs.map((d, idx) => (
                <tr key={d.code}>
                  <td style={{ whiteSpace: 'nowrap' }}>{d.code}</td>
                  <td><input className="form-control form-control-sm" value={d.name} onChange={e => setDefs(ds => ds.map((x,i) => i===idx? { ...x, name: e.target.value } : x))} /></td>
                  <td>
                    <select className="form-select form-select-sm" value={d.type} onChange={e => setDefs(ds => ds.map((x,i) => i===idx? { ...x, type: e.target.value as any } : x))}>
                      {['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="form-select form-select-sm" value={d.normalBalance} onChange={e => setDefs(ds => ds.map((x,i) => i===idx? { ...x, normalBalance: e.target.value as any } : x))}>
                      {['DEBIT','CREDIT'].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td style={{ maxWidth: 80 }}>
                    <input className="form-control form-control-sm" type="number" min={1} max={5} value={d.level} onChange={e => setDefs(ds => ds.map((x,i) => i===idx? { ...x, level: Number(e.target.value) } : x))} />
                  </td>
                  <td style={{ maxWidth: 120 }}>
                    <input className="form-control form-control-sm" value={d.parentCode ?? ''} onChange={e => setDefs(ds => ds.map((x,i) => i===idx? { ...x, parentCode: e.target.value || null } : x))} />
                  </td>
                  <td style={{ maxWidth: 140 }}>
                    <select className="form-select form-select-sm" value={d.division ?? ''} onChange={e => setDefs(ds => ds.map((x,i) => i===idx? { ...x, division: e.target.value || null } : x))}>
                      <option value="">(なし)</option>
                      <option value="KANRI">KANRI</option>
                      <option value="SHUZEN">SHUZEN</option>
                      <option value="PARKING">PARKING</option>
                      <option value="SPECIAL">SPECIAL</option>
                    </select>
                  </td>
                  <td className="text-center">
                    <input type="checkbox" className="form-check-input" checked={!!d.isActive} onChange={e => setDefs(ds => ds.map((x,i) => i===idx? { ...x, isActive: e.target.checked } : x))} />
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleActive(d.code)}>{d.isActive ? '無効化' : '有効化'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
