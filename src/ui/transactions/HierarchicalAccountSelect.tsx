import React, { useMemo, useState, useEffect } from 'react'
import { HierarchicalAccount } from '../../domain/services/AccountService'

interface HierarchicalAccountSelectProps {
  accounts: HierarchicalAccount[]
  value: string
  onChange: (accountCode: string) => void
  placeholder?: string
  className?: string
}

export const HierarchicalAccountSelect: React.FC<HierarchicalAccountSelectProps> = ({
  accounts,
  value,
  onChange,
  placeholder = '科目を選択',
  className = ''
}) => {
  // コード規則に基づく分類判定
  const isMajor = (a: HierarchicalAccount) => a.code.endsWith('000') && !a.isPostable
  const isMiddle = (a: HierarchicalAccount) => a.code.endsWith('00') && !a.code.endsWith('000') && !a.isPostable

  const byCode = useMemo(() => {
    const map = new Map<string, HierarchicalAccount>()
    accounts.forEach(a => map.set(a.code, a))
    return map
  }, [accounts])

  // 大分類（x000）
  const majorAccounts = useMemo(() => {
    return accounts.filter(isMajor).sort((a, b) => a.code.localeCompare(b.code))
  }, [accounts])

  // major -> middles, middle -> smalls のマップ
  const middleByMajor = useMemo(() => {
    const map = new Map<string, HierarchicalAccount[]>()
    accounts.forEach(a => {
      if (isMiddle(a) && a.parentCode) {
        if (!map.has(a.parentCode)) map.set(a.parentCode, [])
        map.get(a.parentCode)!.push(a)
      }
    })
    map.forEach(list => list.sort((a,b) => a.code.localeCompare(b.code)))
    return map
  }, [accounts])

  const smallByMiddle = useMemo(() => {
    const map = new Map<string, HierarchicalAccount[]>()
    accounts.forEach(a => {
      if (a.isPostable && a.parentCode) {
        if (!map.has(a.parentCode)) map.set(a.parentCode, [])
        map.get(a.parentCode)!.push(a)
      }
    })
    map.forEach(list => list.sort((a,b) => a.code.localeCompare(b.code)))
    return map
  }, [accounts])

  // 現在値から大分類/中分類を逆算
  const inferSelectedMajor = useMemo(() => {
    if (!value) return ''
    const acc = byCode.get(value)
    if (!acc) return ''
    const mid = acc.parentCode ? byCode.get(acc.parentCode) : undefined
    const major = mid?.parentCode ? byCode.get(mid.parentCode) : undefined
    return major?.code || ''
  }, [value, byCode])

  const inferSelectedMiddle = useMemo(() => {
    if (!value) return ''
    const acc = byCode.get(value)
    if (!acc) return ''
    const mid = acc.parentCode ? byCode.get(acc.parentCode) : undefined
    return mid?.code || ''
  }, [value, byCode])

  const [selectedMajor, setSelectedMajor] = useState<string>(inferSelectedMajor)
  const [selectedMiddle, setSelectedMiddle] = useState<string>(inferSelectedMiddle)

  useEffect(() => { setSelectedMajor(inferSelectedMajor) }, [inferSelectedMajor])
  useEffect(() => { setSelectedMiddle(inferSelectedMiddle) }, [inferSelectedMiddle])

  // 中分類の候補（大分類に応じて）
  const middleOptions = useMemo(() => {
    if (!selectedMajor) return [] as HierarchicalAccount[]
    return middleByMajor.get(selectedMajor) || []
  }, [selectedMajor, middleByMajor])

  // 小分類の候補（中分類が選択されていればその配下、未選択なら大分類配下すべて）
  const smallOptions = useMemo(() => {
    if (!selectedMajor) return [] as HierarchicalAccount[]
    if (selectedMiddle) return smallByMiddle.get(selectedMiddle) || []
    // 中分類未選択: 大分類配下の全小分類を集約
    const mids = middleByMajor.get(selectedMajor) || []
    return mids.flatMap(m => smallByMiddle.get(m.code) || [])
  }, [selectedMajor, selectedMiddle, middleByMajor, smallByMiddle])

  const handleMajorChange = (majorCode: string) => {
    setSelectedMajor(majorCode)
    setSelectedMiddle('')
    onChange('')
  }

  const handleMiddleChange = (middleCode: string) => {
    setSelectedMiddle(middleCode)
    onChange('')
  }

  const handleSmallChange = (smallCode: string) => {
    onChange(smallCode)
  }

  return (
    <div className={`d-flex gap-2 ${className}`}>
      {/* 大分類（x000） */}
      <select
        className="form-select"
        style={{ maxWidth: '160px' }}
        value={selectedMajor}
        onChange={(e) => handleMajorChange(e.target.value)}
      >
        <option value="">大分類</option>
        {majorAccounts.map(maj => (
          <option key={maj.code} value={maj.code}>{maj.name}</option>
        ))}
      </select>

      {/* 中分類（xy00） */}
      <select
        className="form-select"
        style={{ maxWidth: '160px' }}
        value={selectedMiddle}
        onChange={(e) => handleMiddleChange(e.target.value)}
        disabled={!selectedMajor}
      >
        <option value="">中分類（すべて）</option>
        {middleOptions.map(mid => (
          <option key={mid.code} value={mid.code}>{mid.name}</option>
        ))}
      </select>

      {/* 小分類（勘定科目として選択） */}
      <select
        className="form-select flex-grow-1"
        value={value}
        onChange={(e) => handleSmallChange(e.target.value)}
        disabled={!selectedMajor}
      >
        <option value="">{selectedMajor ? placeholder : '大分類を先に選択'}</option>
        {smallOptions.map(acc => (
          <option key={acc.code} value={acc.code}>
            {acc.code} - {acc.name}
            {acc.division && acc.division !== 'COMMON' ? ` [${acc.division}]` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
