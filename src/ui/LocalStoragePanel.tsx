import React from 'react'
import { AccountingEngine } from '../domain/accountingEngine'

const STORAGE_KEY = 'civicaide-zaimu:v1'

export const LocalStoragePanel: React.FC<{ engine: AccountingEngine, onLoaded: () => void }> = ({ engine, onLoaded }) => {
  const save = () => {
    const data = engine.serialize()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    alert('ローカルに保存しました')
  }
  const load = () => {
    const text = localStorage.getItem(STORAGE_KEY)
    if (!text) { alert('保存データがありません'); return }
    try {
      const json = JSON.parse(text)
      engine.restore(json)
      onLoaded()
      alert('ローカルから読み込みました')
    } catch (err: any) {
      alert('読み込みに失敗: ' + (err.message ?? String(err)))
    }
  }
  const clear = () => {
    localStorage.removeItem(STORAGE_KEY)
    alert('ローカル保存データを削除しました')
  }
  return (
    <div className="card mt-3">
      <div className="card-header"><strong>ローカル保存/読込</strong></div>
      <div className="card-body d-flex gap-2">
        <button className="btn btn-sm btn-outline-secondary" onClick={save}>保存</button>
        <button className="btn btn-sm btn-outline-primary" onClick={load}>読込</button>
        <button className="btn btn-sm btn-outline-danger" onClick={clear}>削除</button>
      </div>
    </div>
  )
}
