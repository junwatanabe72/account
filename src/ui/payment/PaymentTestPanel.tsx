/**
 * Phase 14 テスト用パネル
 * 銀行入金処理と未収金管理のテスト機能
 */

import React, { useState, useEffect } from 'react'
import useStore from '../../stores'
import { 
  BankTransaction, 
  PaymentMatching, 
  Receivable,
  ReceivableSummary 
} from '../../types/payment'

const PaymentTestPanel: React.FC = () => {
  const store = useStore()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedBankType, setSelectedBankType] = useState<'generic' | 'mufg' | 'smbc' | 'mizuho'>('generic')
  const [testResults, setTestResults] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'import' | 'matching' | 'receivables' | 'test'>('test')

  // 初期化
  useEffect(() => {
    if (store.engine && store.engine.journalService && store.engine.accountService) {
      store.initializePaymentServices(
        store.engine.journalService,
        store.engine.accountService
      )
      addTestResult('✅ Payment Services初期化完了')
    }
  }, [store.engine])

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`)
  }

  // CSVインポートテスト
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      addTestResult(`📁 ファイル選択: ${file.name}`)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      addTestResult('❌ ファイルが選択されていません')
      return
    }

    try {
      addTestResult('🔄 インポート開始...')
      const result = await store.importBankTransactions(selectedFile, selectedBankType)
      
      addTestResult(`✅ インポート成功！`)
      addTestResult(`  - 総件数: ${result.total}`)
      addTestResult(`  - インポート: ${result.imported}`)
      addTestResult(`  - 重複: ${result.duplicates}`)
      addTestResult(`  - バッチID: ${result.batchId}`)
      
      if (result.errors.length > 0) {
        addTestResult(`⚠️ エラー: ${result.errors.length}件`)
        result.errors.forEach(err => {
          addTestResult(`  - Row ${err.row}: ${err.message}`)
        })
      }
    } catch (error) {
      addTestResult(`❌ インポートエラー: ${error}`)
    }
  }

  // 照合処理テスト
  const handleMatchAll = async () => {
    try {
      addTestResult('🔄 全取引の照合処理開始...')
      await store.processAllUnmatched()
      addTestResult('✅ 照合処理完了')
      
      const matchingResults = store.matchingResults
      if (matchingResults.size > 0) {
        addTestResult(`📊 照合結果: ${matchingResults.size}件`)
        matchingResults.forEach(result => {
          addTestResult(`  - ${result.unitNumber || '不明'}: ${result.matchingType} (信頼度: ${(result.confidence * 100).toFixed(0)}%)`)
        })
      }
    } catch (error) {
      addTestResult(`❌ 照合エラー: ${error}`)
    }
  }

  // 未収金作成テスト
  const handleCreateReceivable = () => {
    try {
      const receivable = store.createReceivable(
        '101',
        '1301',
        15000,
        '2024-04-30',
        'テスト未収金'
      )
      addTestResult(`✅ 未収金作成: ${receivable.id}`)
      addTestResult(`  - 住戸: ${receivable.unitNumber}号室`)
      addTestResult(`  - 金額: ¥${receivable.amount.toLocaleString()}`)
    } catch (error) {
      addTestResult(`❌ 未収金作成エラー: ${error}`)
    }
  }

  // サンプルCSV読み込み
  const loadSampleCSV = async () => {
    try {
      addTestResult('🔄 サンプルCSV読み込み中...')
      const response = await fetch('/sample-bank-statement-phase14.csv')
      const blob = await response.blob()
      const file = new File([blob], 'sample-bank-statement-phase14.csv', { type: 'text/csv' })
      
      setSelectedFile(file)
      addTestResult('✅ サンプルCSV読み込み完了')
      
      // 自動インポート
      const result = await store.importBankTransactions(file, 'generic')
      addTestResult(`✅ 自動インポート完了: ${result.imported}件`)
    } catch (error) {
      addTestResult(`❌ サンプル読み込みエラー: ${error}`)
    }
  }

  // 完全テストフロー
  const runFullTest = async () => {
    addTestResult('🚀 完全テストフロー開始')
    
    // 1. データクリア
    store.clearAllData()
    addTestResult('1️⃣ データクリア完了')
    
    // 2. サンプルCSV読み込み
    await loadSampleCSV()
    
    // 3. 照合処理
    await new Promise(resolve => setTimeout(resolve, 1000))
    await handleMatchAll()
    
    // 4. 未収金作成
    handleCreateReceivable()
    
    // 5. サマリー更新
    store.updateReceivableSummary()
    addTestResult('5️⃣ サマリー更新完了')
    
    addTestResult('🎉 完全テストフロー完了！')
  }

  // データ表示
  const renderBankTransactions = () => {
    return (
      <div className="mt-4">
        <h3 className="font-bold mb-2">銀行取引 ({store.bankTransactions.length}件)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-2">日付</th>
                <th className="border p-2">摘要</th>
                <th className="border p-2">入金</th>
                <th className="border p-2">状態</th>
              </tr>
            </thead>
            <tbody>
              {store.bankTransactions.slice(0, 10).map(txn => (
                <tr key={txn.id}>
                  <td className="border p-2">{txn.date}</td>
                  <td className="border p-2">{txn.description}</td>
                  <td className="border p-2 text-right">
                    {txn.amount > 0 ? `¥${txn.amount.toLocaleString()}` : '-'}
                  </td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      txn.status === 'matched' ? 'bg-green-100' :
                      txn.status === 'processed' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderMatchingResults = () => {
    const results = Array.from(store.matchingResults.values())
    return (
      <div className="mt-4">
        <h3 className="font-bold mb-2">照合結果 ({results.length}件)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-2">住戸</th>
                <th className="border p-2">照合タイプ</th>
                <th className="border p-2">金額</th>
                <th className="border p-2">差額</th>
                <th className="border p-2">信頼度</th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 10).map(match => (
                <tr key={match.id}>
                  <td className="border p-2">{match.unitNumber || '不明'}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      match.matchingType === 'exact' ? 'bg-green-100' :
                      match.matchingType === 'partial' ? 'bg-yellow-100' :
                      match.matchingType === 'over' ? 'bg-blue-100' :
                      'bg-red-100'
                    }`}>
                      {match.matchingType}
                    </span>
                  </td>
                  <td className="border p-2 text-right">¥{match.actualAmount.toLocaleString()}</td>
                  <td className="border p-2 text-right">
                    {match.difference !== 0 && (
                      <span className={match.difference > 0 ? 'text-blue-600' : 'text-red-600'}>
                        {match.difference > 0 ? '+' : ''}¥{Math.abs(match.difference).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="border p-2 text-center">{(match.confidence * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderReceivables = () => {
    return (
      <div className="mt-4">
        <h3 className="font-bold mb-2">未収金一覧 ({store.receivables.length}件)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-2">住戸</th>
                <th className="border p-2">科目</th>
                <th className="border p-2">金額</th>
                <th className="border p-2">期日</th>
                <th className="border p-2">状態</th>
              </tr>
            </thead>
            <tbody>
              {store.receivables.slice(0, 10).map(rcv => (
                <tr key={rcv.id}>
                  <td className="border p-2">{rcv.unitNumber}号室</td>
                  <td className="border p-2">
                    {rcv.accountCode === '1301' ? '管理費' :
                     rcv.accountCode === '1302' ? '修繕積立金' :
                     '駐車場'}
                  </td>
                  <td className="border p-2 text-right">¥{rcv.amount.toLocaleString()}</td>
                  <td className="border p-2">{rcv.dueDate}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      rcv.status === 'paid' ? 'bg-green-100' :
                      rcv.status === 'partially_paid' ? 'bg-yellow-100' :
                      'bg-red-100'
                    }`}>
                      {rcv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {store.receivableSummary && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-bold mb-2">未収金サマリー</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>総未収金額:</div>
              <div className="text-right font-bold">¥{store.receivableSummary.totalOutstanding.toLocaleString()}</div>
              <div>対象住戸数:</div>
              <div className="text-right">{store.receivableSummary.unitCount}戸</div>
              <div>当月分:</div>
              <div className="text-right">¥{store.receivableSummary.byAge.current.toLocaleString()}</div>
              <div>1ヶ月延滞:</div>
              <div className="text-right">¥{store.receivableSummary.byAge.oneMonth.toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Phase 14 テストパネル</h2>
      
      {/* タブナビゲーション */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-2 rounded ${activeTab === 'test' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          テスト実行
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded ${activeTab === 'import' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          インポート
        </button>
        <button
          onClick={() => setActiveTab('matching')}
          className={`px-4 py-2 rounded ${activeTab === 'matching' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          照合結果
        </button>
        <button
          onClick={() => setActiveTab('receivables')}
          className={`px-4 py-2 rounded ${activeTab === 'receivables' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          未収金
        </button>
      </div>

      {/* テスト実行タブ */}
      {activeTab === 'test' && (
        <div>
          <div className="bg-white p-4 rounded border mb-4">
            <h3 className="font-bold mb-4">クイックテスト</h3>
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={runFullTest}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                🚀 完全テスト実行
              </button>
              <button 
                onClick={loadSampleCSV}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                📁 サンプルCSV読込
              </button>
              <button 
                onClick={handleMatchAll}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                🔍 全取引照合
              </button>
              <button 
                onClick={handleCreateReceivable}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                💰 未収金作成
              </button>
              <button 
                onClick={() => store.clearAllData()}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                🗑️ データクリア
              </button>
            </div>
          </div>

          {/* テスト結果ログ */}
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
            <div className="mb-2 text-yellow-400">== Phase 14 Test Console ==</div>
            {testResults.map((result, index) => (
              <div key={index}>{result}</div>
            ))}
            {testResults.length === 0 && (
              <div className="text-gray-500">テストを実行してください...</div>
            )}
          </div>
        </div>
      )}

      {/* インポートタブ */}
      {activeTab === 'import' && (
        <div>
          <div className="bg-white p-4 rounded border mb-4">
            <h3 className="font-bold mb-4">CSVインポート</h3>
            <div className="mb-4">
              <label className="block mb-2">銀行タイプ:</label>
              <select 
                value={selectedBankType}
                onChange={(e) => setSelectedBankType(e.target.value as any)}
                className="border p-2 rounded w-full"
              >
                <option value="generic">汎用</option>
                <option value="mufg">三菱UFJ銀行</option>
                <option value="smbc">三井住友銀行</option>
                <option value="mizuho">みずほ銀行</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">CSVファイル:</label>
              <input 
                type="file" 
                accept=".csv"
                onChange={handleFileSelect}
                className="border p-2 rounded w-full"
              />
            </div>
            
            <button 
              onClick={handleImport}
              disabled={!selectedFile}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              インポート実行
            </button>
          </div>

          {renderBankTransactions()}
        </div>
      )}

      {/* 照合結果タブ */}
      {activeTab === 'matching' && renderMatchingResults()}

      {/* 未収金タブ */}
      {activeTab === 'receivables' && renderReceivables()}
    </div>
  )
}

export default PaymentTestPanel