import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { defaultBankAccounts, BankAccount } from '../../data/bankAccounts'
import { BankAccountService, BankAccountChangeEvent, AccountSyncResult } from '../../domain/services/BankAccountService'
import { ToastNotification } from '../common/ToastNotification'
import './BankAccountPanel.css'

interface BankAccountPanelProps {
  engine?: any
  onChanged?: () => void
}

export const BankAccountPanel: React.FC<BankAccountPanelProps> = ({ engine, onChanged }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>(defaultBankAccounts)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [isAddMode, setIsAddMode] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [bankAccountService] = useState(() => new BankAccountService(defaultBankAccounts))
  const [syncResult, setSyncResult] = useState<AccountSyncResult | null>(null)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)

  // BankAccountServiceのリスナー設定
  useEffect(() => {
    const handleAccountChange = (event: BankAccountChangeEvent) => {
      // 口座変更イベントを受けて、UIを更新
      setAccounts(bankAccountService.getAccounts(true))
      onChanged?.()
    }
    
    bankAccountService.addChangeListener(handleAccountChange)
    
    return () => {
      bankAccountService.removeChangeListener(handleAccountChange)
    }
  }, [bankAccountService, onChanged])
  
  // 表示する口座（アクティブ/非アクティブ）
  const displayAccounts = useMemo(() => {
    return showInactive ? accounts : accounts.filter(acc => acc.isActive)
  }, [accounts, showInactive])

  // 新規口座の初期値
  const getNewAccount = (): BankAccount => ({
    id: `account_${Date.now()}`,
    code: '',
    name: '',
    shortName: '',
    accountType: 'savings',
    division: 'KANRI',
    bankName: '',
    branchName: '',
    accountNumber: '',
    accountHolder: '',
    balance: 0,
    isActive: true,
    description: '',
    displayOrder: accounts.length + 1
  })

  // 同期結果の表示
  const showSyncResult = useCallback((result: AccountSyncResult) => {
    if (!result.success) {
      setToastMessage({
        type: 'error',
        message: result.errors?.join('\n') || '処理に失敗しました'
      })
      return
    }
    
    let message = '処理が完了しました。'
    
    if (result.affectedTransactions && result.affectedTransactions.length > 0) {
      message += `\n${result.affectedTransactions.length}件の取引が影響を受けます。`
    }
    
    if (result.affectedAccounts && result.affectedAccounts.length > 1) {
      message += `\n${result.affectedAccounts.length}件の関連口座が更新されました。`
    }
    
    if (result.errors && result.errors.length > 0) {
      setToastMessage({
        type: 'warning',
        message: message + '\n警告: ' + result.errors.join('\n')
      })
    } else {
      setToastMessage({
        type: 'success',
        message
      })
    }
    
    setSyncResult(result)
  }, [])
  
  // 口座の保存
  const handleSave = () => {
    if (!editingAccount) return

    // バリデーション
    if (!editingAccount.code || !editingAccount.name) {
      setToastMessage({
        type: 'error',
        message: '口座コードと口座名は必須です'
      })
      return
    }

    let result: AccountSyncResult
    
    if (isAddMode) {
      // 新規追加
      result = bankAccountService.addAccount(editingAccount)
    } else {
      // 更新
      const originalAccount = accounts.find(acc => acc.id === editingAccount.id)
      if (originalAccount) {
        result = bankAccountService.updateAccount(originalAccount.code, editingAccount)
      } else {
        setToastMessage({
          type: 'error',
          message: '更新対象の口座が見つかりません'
        })
        return
      }
    }
    
    showSyncResult(result)
    
    if (result.success) {
      setEditingAccount(null)
      setIsAddMode(false)
    }
  }

  // 口座の削除（非アクティブ化）
  const handleDelete = (account: BankAccount) => {
    const result = bankAccountService.disableAccount(account.code)
    
    if (result.affectedTransactions && result.affectedTransactions.length > 0) {
      const confirmMessage = `${account.name}を非アクティブにしますか？\n\n` +
        `警告: この口座は${result.affectedTransactions.length}件の取引で使用されています。\n` +
        `非アクティブ化すると、これらの取引の決済口座として使用できなくなります。`
      
      if (!confirm(confirmMessage)) {
        return
      }
    } else {
      if (!confirm(`${account.name}を非アクティブにしますか？`)) {
        return
      }
    }
    
    showSyncResult(result)
  }

  // 口座の復活（アクティブ化）
  const handleRestore = (account: BankAccount) => {
    const result = bankAccountService.enableAccount(account.code)
    showSyncResult(result)
  }
  
  // 口座の完全削除
  const handlePermanentDelete = (account: BankAccount) => {
    const result = bankAccountService.deleteAccount(account.code, false)
    
    if (!result.success && result.affectedTransactions && result.affectedTransactions.length > 0) {
      const confirmMessage = `${account.name}を完全に削除しますか？\n\n` +
        `警告: この口座は${result.affectedTransactions.length}件の取引で使用されています。\n` +
        `強制的に削除する場合、これらの取引の参照が無効になります。\n\n` +
        `続行しますか？`
      
      if (confirm(confirmMessage)) {
        const forceResult = bankAccountService.deleteAccount(account.code, true)
        showSyncResult(forceResult)
      }
    } else {
      if (confirm(`${account.name}を完全に削除しますか？この操作は取り消せません。`)) {
        showSyncResult(result)
      }
    }
  }

  return (
    <div className="bank-account-panel">
      <div className="panel-header">
        <h2>🏦 口座管理</h2>
        <div className="header-controls">
          <label className="show-inactive-toggle">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            非アクティブも表示
          </label>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingAccount(getNewAccount())
              setIsAddMode(true)
            }}
          >
            ➕ 新規口座追加
          </button>
        </div>
      </div>

      <div className="accounts-grid">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>コード</th>
              <th>口座名</th>
              <th>種別</th>
              <th>区分</th>
              <th>銀行名</th>
              <th>支店名</th>
              <th>口座番号</th>
              <th>状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {displayAccounts.map(account => (
              <tr key={account.id} className={!account.isActive ? 'inactive' : ''}>
                <td>{account.code}</td>
                <td>
                  <div className="account-name">
                    <strong>{account.name}</strong>
                    {account.shortName && (
                      <span className="short-name">({account.shortName})</span>
                    )}
                  </div>
                </td>
                <td>
                  {account.accountType === 'cash' && '現金'}
                  {account.accountType === 'savings' && '普通預金'}
                  {account.accountType === 'checking' && '当座預金'}
                  {account.accountType === 'time_deposit' && '定期預金'}
                </td>
                <td>
                  <span className={`division-badge ${account.division.toLowerCase()}`}>
                    {account.division === 'KANRI' && '管理'}
                    {account.division === 'SHUZEN' && '修繕'}
                    {account.division === 'BOTH' && '共通'}
                  </span>
                </td>
                <td>{account.bankName || '-'}</td>
                <td>{account.branchName || '-'}</td>
                <td>{account.accountNumber || '-'}</td>
                <td>
                  <span className={`status-badge ${account.isActive ? 'active' : 'inactive'}`}>
                    {account.isActive ? '有効' : '無効'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setEditingAccount(account)
                        setIsAddMode(false)
                      }}
                    >
                      編集
                    </button>
                    {account.isActive ? (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(account)}
                      >
                        無効化
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => handleRestore(account)}
                      >
                        有効化
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {displayAccounts.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-muted">
                  {showInactive ? '口座が登録されていません' : 'アクティブな口座がありません'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 編集モーダル */}
      {editingAccount && (
        <div className="modal-backdrop" onClick={() => setEditingAccount(null)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isAddMode ? '新規口座追加' : '口座編集'}</h3>
              <button className="close-btn" onClick={() => setEditingAccount(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    口座コード <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingAccount.code}
                    onChange={(e) => setEditingAccount({
                      ...editingAccount,
                      code: e.target.value
                    })}
                    placeholder="例: 1105"
                  />
                </div>

                <div className="form-group">
                  <label>
                    口座名 <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingAccount.name}
                    onChange={(e) => setEditingAccount({
                      ...editingAccount,
                      name: e.target.value
                    })}
                    placeholder="例: 普通預金（管理）"
                  />
                </div>

                <div className="form-group">
                  <label>略称</label>
                  <input
                    type="text"
                    value={editingAccount.shortName}
                    onChange={(e) => setEditingAccount({
                      ...editingAccount,
                      shortName: e.target.value
                    })}
                    placeholder="例: 管理口座"
                  />
                </div>

                <div className="form-group">
                  <label>口座種別</label>
                  <select
                    value={editingAccount.accountType}
                    onChange={(e) => setEditingAccount({
                      ...editingAccount,
                      accountType: e.target.value as BankAccount['accountType']
                    })}
                  >
                    <option value="cash">現金</option>
                    <option value="savings">普通預金</option>
                    <option value="checking">当座預金</option>
                    <option value="time_deposit">定期預金</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>会計区分</label>
                  <select
                    value={editingAccount.division}
                    onChange={(e) => setEditingAccount({
                      ...editingAccount,
                      division: e.target.value as BankAccount['division']
                    })}
                  >
                    <option value="KANRI">管理会計</option>
                    <option value="SHUZEN">修繕会計</option>
                    <option value="BOTH">共通</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>銀行名</label>
                  <input
                    type="text"
                    value={editingAccount.bankName || ''}
                    onChange={(e) => setEditingAccount({
                      ...editingAccount,
                      bankName: e.target.value
                    })}
                    placeholder="例: 三菱UFJ銀行"
                  />
                </div>

                <div className="form-group">
                  <label>支店名</label>
                  <input
                    type="text"
                    value={editingAccount.branchName || ''}
                    onChange={(e) => setEditingAccount({
                      ...editingAccount,
                      branchName: e.target.value
                    })}
                    placeholder="例: ○○支店"
                  />
                </div>

                <div className="form-group">
                  <label>口座番号</label>
                  <input
                    type="text"
                    value={editingAccount.accountNumber || ''}
                    onChange={(e) => setEditingAccount({
                      ...editingAccount,
                      accountNumber: e.target.value
                    })}
                    placeholder="例: 1234567"
                  />
                </div>

                <div className="form-group">
                  <label>名義人</label>
                  <input
                    type="text"
                    value={editingAccount.accountHolder || ''}
                    onChange={(e) => setEditingAccount({
                      ...editingAccount,
                      accountHolder: e.target.value
                    })}
                    placeholder="例: ○○マンション管理組合"
                  />
                </div>

                <div className="form-group full-width">
                  <label>説明・備考</label>
                  <textarea
                    value={editingAccount.description || ''}
                    onChange={(e) => setEditingAccount({
                      ...editingAccount,
                      description: e.target.value
                    })}
                    rows={3}
                    placeholder="この口座の用途や注意事項など"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setEditingAccount(null)}
              >
                キャンセル
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 同期結果の詳細表示 */}
      {syncResult && syncResult.affectedTransactions && syncResult.affectedTransactions.length > 0 && (
        <div className="sync-result-details">
          <div className="alert alert-warning">
            <h4>影響を受ける取引</h4>
            <p>{syncResult.affectedTransactions.length}件の取引が影響を受けます。</p>
            <details>
              <summary>詳細を表示</summary>
              <ul>
                {syncResult.affectedTransactions.map(transId => (
                  <li key={transId}>取引ID: {transId}</li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      )}
      
      {/* トーストメッセージ */}
      {toastMessage && (
        <ToastNotification
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  )
}