import React, { useMemo, useState } from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'
import { useToast } from '../common/Toast'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { HierarchicalAccountSelect } from './HierarchicalAccountSelect'

export const ImprovedJournalForm: React.FC<{ engine: AccountingEngine, onChange: () => void }> = ({ engine, onChange }) => {
  const accounts = useMemo(() => engine.getAccounts(), [engine])
  const getToday = () => {
    const today = new Date().toISOString()
    return today.split('T')[0] || ''
  }
  const [date, setDate] = useState<string>(getToday())
  const [description, setDescription] = useState<string>('')
  const [reference, setReference] = useState<string>('')
  const [rows, setRows] = useState<Array<{ debit?: string, debitAmount?: number, credit?: string, creditAmount?: number }>>([
    {}
  ])
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const addRow = () => setRows((r) => [...r, {}])
  const removeRow = (idx: number) => setRows((r) => r.length > 1 ? r.filter((_, i) => i !== idx) : r)

  const toast = useToast()
  
  const handleSubmitClick = () => {
    const details: Array<{ accountCode: string, debitAmount: number, creditAmount: number }> = []
    let rowError = ''
    rows.forEach((r, idx) => {
      const debitAmount = r.debitAmount || 0
      const creditAmount = r.creditAmount || 0
      const hasDebit = !!r.debit && debitAmount > 0
      const hasCredit = !!r.credit && creditAmount > 0
      
      if (r.debit && r.credit) {
        rowError = `${idx+1}行目: 1つの行には借方か貸方のどちらか一方のみ入力してください`
      }
      if (!hasDebit && !hasCredit) return
      if (hasDebit) details.push({ accountCode: r.debit!, debitAmount: debitAmount, creditAmount: 0 })
      if (hasCredit) details.push({ accountCode: r.credit!, debitAmount: 0, creditAmount: creditAmount })
    })
    
    if (rowError) { 
      setError(rowError); 
      toast.show(rowError,'danger'); 
      return 
    }
    
    setShowConfirm(true)
  }
  
  const submit = () => {
    const details: Array<{ accountCode: string, debitAmount: number, creditAmount: number }> = []
    rows.forEach((r) => {
      const debitAmount = r.debitAmount || 0
      const creditAmount = r.creditAmount || 0
      const hasDebit = !!r.debit && debitAmount > 0
      const hasCredit = !!r.credit && creditAmount > 0
      
      if (!hasDebit && !hasCredit) return
      if (hasDebit) details.push({ accountCode: r.debit!, debitAmount: debitAmount, creditAmount: 0 })
      if (hasCredit) details.push({ accountCode: r.credit!, debitAmount: 0, creditAmount: creditAmount })
    })
    
    const result = engine.createJournal({ date, description, reference, details })
    if (result.success) {
      setDescription('')
      setReference('')
      setRows([{}])
      setError(null)
      onChange()
      toast.show('仕訳を作成しました','success')
    } else {
      setError(result.errors?.join('\n') || 'エラーが発生しました')
      toast.show(result.errors?.join(', ') || 'エラーが発生しました','danger')
    }
    setShowConfirm(false)
  }

  const totals = rows.reduce((acc, r) => {
    acc.debit += r.debitAmount ?? 0
    acc.credit += r.creditAmount ?? 0
    return acc
  }, { debit: 0, credit: 0 })

  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01
  const balanceDiff = totals.debit - totals.credit

  // 金額のフォーマット
  const formatAmount = (amount: number | undefined) => {
    if (!amount) return ''
    return amount.toLocaleString()
  }

  // 金額の入力処理
  const handleAmountChange = (value: string) => {
    const num = value.replace(/,/g, '')
    return isNaN(Number(num)) ? 0 : Number(num)
  }

  return (
    <>
      <div className="card">
        <div className="card-header"><h3 className="mb-0">仕訳入力</h3></div>
        <div className="card-body">
          {/* 基本情報セクション */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label fw-bold">日付 <span className="text-danger">*</span></label>
              <input 
                className="form-control form-control-lg" 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
            <div className="col-md-8">
              <label className="form-label fw-bold">摘要 <span className="text-danger">*</span></label>
              <input 
                className="form-control form-control-lg" 
                type="text" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="例：3月分管理費収入" 
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">伝票番号（任意）</label>
            <input 
              className="form-control" 
              type="text" 
              value={reference} 
              onChange={(e) => setReference(e.target.value)} 
              placeholder="自動生成されます" 
            />
          </div>

          <hr className="my-4" />

          <h5 className="mb-3">仕訳明細</h5>
          
          {/* 改善された明細入力 */}
          <div className="journal-entries">
            {rows.map((r, idx) => (
              <div key={idx} className="journal-entry-row mb-4 p-3 border rounded">
                <div className="row g-3">
                  {/* 借方セクション */}
                  <div className="col-md-6">
                    <div className="debit-section p-3 bg-light rounded">
                      <h6 className="text-primary mb-3">借方</h6>
                      <div className="mb-3">
                        <label className="form-label small">勘定科目</label>
                        <HierarchicalAccountSelect
                          accounts={accounts}
                          value={r.debit ?? ''}
                          onChange={(value) => setRows((rs) => rs.map((x, i) => i === idx ? { ...x, debit: value, credit: '' } : x))}
                          placeholder="借方科目を選択"
                        />
                      </div>
                      <div>
                        <label className="form-label small">金額</label>
                        <div className="input-group">
                          <span className="input-group-text">¥</span>
                          <input 
                            className="form-control form-control-lg text-end" 
                            type="text" 
                            value={formatAmount(r.debitAmount)} 
                            onChange={(e) => setRows((rs) => rs.map((x, i) => 
                              i === idx ? { ...x, debitAmount: handleAmountChange(e.target.value) } : x
                            ))} 
                            placeholder="0" 
                            disabled={!!r.credit}
                            style={{ fontSize: '1.2rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 貸方セクション */}
                  <div className="col-md-6">
                    <div className="credit-section p-3 bg-light rounded">
                      <h6 className="text-danger mb-3">貸方</h6>
                      <div className="mb-3">
                        <label className="form-label small">勘定科目</label>
                        <HierarchicalAccountSelect
                          accounts={accounts}
                          value={r.credit ?? ''}
                          onChange={(value) => setRows((rs) => rs.map((x, i) => i === idx ? { ...x, credit: value, debit: '' } : x))}
                          placeholder="貸方科目を選択"
                        />
                      </div>
                      <div>
                        <label className="form-label small">金額</label>
                        <div className="input-group">
                          <span className="input-group-text">¥</span>
                          <input 
                            className="form-control form-control-lg text-end" 
                            type="text" 
                            value={formatAmount(r.creditAmount)} 
                            onChange={(e) => setRows((rs) => rs.map((x, i) => 
                              i === idx ? { ...x, creditAmount: handleAmountChange(e.target.value) } : x
                            ))} 
                            placeholder="0" 
                            disabled={!!r.debit}
                            style={{ fontSize: '1.2rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 削除ボタン */}
                {rows.length > 1 && (
                  <div className="text-end mt-3">
                    <button 
                      className="btn btn-sm btn-outline-danger" 
                      onClick={() => removeRow(idx)}
                    >
                      <i className="bi bi-trash"></i> この行を削除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mb-4">
            <button className="btn btn-secondary" onClick={addRow}>
              <i className="bi bi-plus-circle"></i> 明細行を追加
            </button>
          </div>

          {/* 合計表示 */}
          <div className="card bg-light mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 text-center">
                  <h6 className="text-primary">借方合計</h6>
                  <h3 className="mb-0">¥{totals.debit.toLocaleString()}</h3>
                </div>
                <div className="col-md-6 text-center">
                  <h6 className="text-danger">貸方合計</h6>
                  <h3 className="mb-0">¥{totals.credit.toLocaleString()}</h3>
                </div>
              </div>
              
              {/* バランスチェック */}
              <div className="mt-3">
                {!isBalanced && (
                  <div className="alert alert-warning mb-0">
                    <i className="bi bi-exclamation-triangle"></i> 
                    貸借が一致していません（差額: ¥{Math.abs(balanceDiff).toLocaleString()}）
                  </div>
                )}
                {isBalanced && totals.debit > 0 && (
                  <div className="alert alert-success mb-0">
                    <i className="bi bi-check-circle"></i> 貸借が一致しています
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              <h6 className="alert-heading">エラー</h6>
              <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
            </div>
          )}

          {/* 登録ボタン */}
          <div className="d-grid">
            <button 
              className="btn btn-primary btn-lg" 
              onClick={handleSubmitClick}
              disabled={!isBalanced || totals.debit === 0}
            >
              仕訳を登録
            </button>
          </div>
        </div>
      </div>

      {/* 確認ダイアログ */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="仕訳登録の確認"
        message={`日付: ${date}\n摘要: ${description}\n借方合計: ¥${totals.debit.toLocaleString()}\n貸方合計: ¥${totals.credit.toLocaleString()}\n\nこの内容で登録しますか？`}
        confirmText="登録"
        onConfirm={submit}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}