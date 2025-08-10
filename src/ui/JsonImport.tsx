import React, { useRef } from 'react'
import { AccountingEngine } from '../domain/accountingEngine'
import { ImportJson } from '../types'
import { useToast } from './Toast'

export const JsonImport: React.FC<{ engine: AccountingEngine, onImported: () => void }> = ({ engine, onImported }) => {
  const fileRef = useRef<HTMLInputElement>(null)

  const toast = useToast()
  const onClick = () => fileRef.current?.click()
  const onChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text) as ImportJson
      // unitOwners/vendorsがあれば反映
      if (json.unitOwners && Array.isArray(json.unitOwners)) {
        engine.unitOwners = json.unitOwners
        engine.rebuildAuxiliaryAccounts()
      }
      if (json.vendors && Array.isArray(json.vendors)) {
        engine.vendors = json.vendors
      }
      const result = engine.importJsonData(json)
      if (!result.success) toast.show(`JSONデータの読み込みに失敗: ${result.error}`,'danger')
      else toast.show(`JSONデータを読み込みました`,'success')
      onImported()
    } catch (err: any) {
      toast.show(`JSON解析に失敗: ${err.message ?? String(err)}`,'danger')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={onClick}>JSON読込</button>
      <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={onChange} />
    </div>
  )
}
