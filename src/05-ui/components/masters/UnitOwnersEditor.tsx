import React, { useMemo, useState } from 'react'
import { AccountingEngine } from '../../02-core/accountingEngine'

type EditableOwner = {
  unitNumber: string
  ownerName: string
  floor: number
  area: number
  managementFee: number
  repairReserve: number
  contact?: string
  bankAccount?: string
  isActive: boolean
}

export const UnitOwnersEditor: React.FC<{ engine: AccountingEngine, onClose: () => void, onSaved: () => void }> = ({ engine, onClose, onSaved }) => {
  const initial = useMemo<EditableOwner[]>(() => Array.from(engine.unitOwners.values()).map((o: any) => ({
    unitNumber: o.unitNumber,
    ownerName: o.ownerName,
    floor: o.floor,
    area: o.area,
    managementFee: o.managementFee,
    repairReserve: o.repairReserve,
    contact: o.contact ?? '',
    bankAccount: o.bankAccount ?? '',
    isActive: o.isActive !== false,
  })), [engine])
  const [rows, setRows] = useState<EditableOwner[]>(initial)

  const addRow = () => setRows(r => [...r, { unitNumber: '', ownerName: '', floor: 1, area: 70, managementFee: 0, repairReserve: 0, isActive: true }])
  const removeRow = (idx: number) => setRows(r => r.filter((_, i) => i !== idx))
  const update = (idx: number, key: keyof EditableOwner, value: any) => setRows(r => r.map((x, i) => i === idx ? { ...x, [key]: value } : x))

  const save = () => {
    const newMap = new Map<string, any>()
    for (const row of rows) {
      const unit = row.unitNumber.trim()
      if (!unit) { alert('部屋番号を入力してください'); return }
      if (!row.ownerName.trim()) { alert('所有者名を入力してください'); return }
      if (row.managementFee < 0 || row.repairReserve < 0) { alert('金額は0以上で入力してください'); return }
      newMap.set(unit, { ...row, unitNumber: unit })
    }
    engine.unitOwners = newMap
    engine.rebuildAuxiliaryAccounts()
    onSaved()
    onClose()
    alert('組合員マスタを更新しました。')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '90%', maxWidth: 900, background: 'white', borderRadius: 8, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>組合員マスタ管理</h3>
          <button onClick={onClose}>× 閉じる</button>
        </div>
        <div style={{ margin: '8px 0' }}>
          <button onClick={addRow}>新規組合員追加</button>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 420 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>部屋番号</th>
                <th>所有者名</th>
                <th>階数</th>
                <th>面積(m²)</th>
                <th>管理費</th>
                <th>修繕積立金</th>
                <th>有効</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td><input value={r.unitNumber} onChange={e => update(idx, 'unitNumber', e.target.value)} /></td>
                  <td><input value={r.ownerName} onChange={e => update(idx, 'ownerName', e.target.value)} /></td>
                  <td><input type="number" value={r.floor} onChange={e => update(idx, 'floor', Number(e.target.value))} /></td>
                  <td><input type="number" step={0.1} value={r.area} onChange={e => update(idx, 'area', Number(e.target.value))} /></td>
                  <td><input type="number" value={r.managementFee} onChange={e => update(idx, 'managementFee', Number(e.target.value))} /></td>
                  <td><input type="number" value={r.repairReserve} onChange={e => update(idx, 'repairReserve', Number(e.target.value))} /></td>
                  <td style={{ textAlign: 'center' }}><input type="checkbox" checked={!!r.isActive} onChange={e => update(idx, 'isActive', e.target.checked)} /></td>
                  <td><button onClick={() => removeRow(idx)}>削除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose}>キャンセル</button>
          <button onClick={save}>変更を保存</button>
        </div>
      </div>
    </div>
  )
}
