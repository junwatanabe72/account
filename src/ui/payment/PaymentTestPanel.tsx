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
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
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
      addTestResult(`  - ファイル: ${selectedFile.name}`)
      addTestResult(`  - サイズ: ${(selectedFile.size / 1024).toFixed(2)} KB`)
      addTestResult(`  - 銀行タイプ: ${selectedBankType}`)
      
      const result = await store.importBankTransactions(selectedFile, selectedBankType)
      
      if (result.imported > 0) {
        addTestResult(`✅ インポート成功！`)
        addTestResult(`  - 総件数: ${result.total}`)
        addTestResult(`  - インポート: ${result.imported}`)
        addTestResult(`  - 重複: ${result.duplicates}`)
        addTestResult(`  - バッチID: ${result.batchId}`)
      } else {
        addTestResult(`⚠️ インポートされたデータがありません`)
        addTestResult(`  - 総件数: ${result.total}`)
        addTestResult(`  - 重複: ${result.duplicates}`)
      }
      
      if (result.errors && result.errors.length > 0) {
        addTestResult(`⚠️ エラー: ${result.errors.length}件`)
        result.errors.slice(0, 5).forEach(err => {
          addTestResult(`  - Row ${err.row}: ${err.message}`)
        })
        if (result.errors.length > 5) {
          addTestResult(`  ... 他 ${result.errors.length - 5}件のエラー`)
        }
      }
    } catch (error) {
      console.error('インポートエラー:', error)
      addTestResult(`❌ インポートエラー: ${error instanceof Error ? error.message : String(error)}`)
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
      
      if (!response.ok) {
        throw new Error(`HTTPエラー: ${response.status} ${response.statusText}`)
      }
      
      const blob = await response.blob()
      addTestResult(`📁 ファイルサイズ: ${(blob.size / 1024).toFixed(2)} KB`)
      
      const file = new File([blob], 'sample-bank-statement-phase14.csv', { type: 'text/csv' })
      
      setSelectedFile(file)
      addTestResult('✅ サンプルCSV読み込み完了')
      
      // 自動インポート
      const result = await store.importBankTransactions(file, 'generic')
      addTestResult(`✅ 自動インポート完了: ${result.imported}件`)
      
      // 詳細情報
      if (result.imported > 0) {
        addTestResult(`  - バッチID: ${result.batchId}`)
        addTestResult(`  - 重複: ${result.duplicates}件`)
      }
    } catch (error) {
      console.error('サンプル読み込みエラー:', error)
      addTestResult(`❌ サンプル読み込みエラー: ${error instanceof Error ? error.message : String(error)}`)
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
        <h3 className="font-bold mb-2" style={{ color: '#2d3748' }}>銀行取引 ({store.bankTransactions.length}件)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 bg-white">
            <thead className="bg-gray-50 border-b-2 border-gray-300">
              <tr>
                <th className="border border-gray-300 p-2 font-medium" style={{ color: '#4a5568', backgroundColor: '#f7fafc' }}>日付</th>
                <th className="border border-gray-300 p-2 font-medium" style={{ color: '#4a5568', backgroundColor: '#f7fafc' }}>摘要</th>
                <th className="border border-gray-300 p-2 font-medium" style={{ color: '#4a5568', backgroundColor: '#f7fafc' }}>入金</th>
                <th className="border border-gray-300 p-2 font-medium" style={{ color: '#4a5568', backgroundColor: '#f7fafc' }}>状態</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {store.bankTransactions.slice(0, 10).map(txn => (
                <tr key={txn.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2" style={{ color: '#2d3748' }}>{txn.date}</td>
                  <td className="border border-gray-300 p-2" style={{ color: '#2d3748' }}>{txn.description}</td>
                  <td className="border border-gray-300 p-2 text-right" style={{ color: '#2d3748' }}>
                    {txn.amount > 0 ? `¥${txn.amount.toLocaleString()}` : '-'}
                  </td>
                  <td className="border border-gray-300 p-2" style={{ color: '#2d3748' }}>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      txn.status === 'matched' ? 'bg-green-100 text-green-800' :
                      txn.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
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
        <h3 className="font-bold mb-2" style={{ color: '#2d3748' }}>照合結果 ({results.length}件)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 bg-white">
            <thead className="bg-gray-50 border-b-2 border-gray-300">
              <tr>
                <th className="border border-gray-300 p-2 font-medium" style={{ color: '#4a5568', backgroundColor: '#f7fafc' }}>住戸</th>
                <th className="border border-gray-300 p-2 font-medium" style={{ color: '#4a5568', backgroundColor: '#f7fafc' }}>照合タイプ</th>
                <th className="border border-gray-300 p-2 font-medium" style={{ color: '#4a5568', backgroundColor: '#f7fafc' }}>金額</th>
                <th className="border border-gray-300 p-2 font-medium" style={{ color: '#4a5568', backgroundColor: '#f7fafc' }}>差額</th>
                <th className="border border-gray-300 p-2 font-medium" style={{ color: '#4a5568', backgroundColor: '#f7fafc' }}>信頼度</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {results.slice(0, 10).map(match => (
                <tr key={match.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2" style={{ color: '#2d3748' }}>{match.unitNumber || '不明'}</td>
                  <td className="border border-gray-300 p-2" style={{ color: '#2d3748' }}>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      match.matchingType === 'exact' ? 'bg-green-100 text-green-800' :
                      match.matchingType === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      match.matchingType === 'over' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {match.matchingType}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-2 text-right" style={{ color: '#2d3748' }}>¥{match.actualAmount.toLocaleString()}</td>
                  <td className="border border-gray-300 p-2 text-right" style={{ color: '#2d3748' }}>
                    {match.difference !== 0 && (
                      <span className={match.difference > 0 ? 'text-blue-600' : 'text-red-600'}>
                        {match.difference > 0 ? '+' : ''}¥{Math.abs(match.difference).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 p-2 text-center" style={{ color: '#2d3748' }}>{(match.confidence * 100).toFixed(0)}%</td>
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
        <h3 className="font-bold mb-2" style={{ color: '#2d3748' }}>未収金一覧 ({store.receivables.length}件)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 bg-white">
            <thead className="bg-gray-50 border-b-2 border-gray-300">
              <tr>
                <th className="border border-gray-300 p-2 font-medium" style={{ color: '#4a5568', backgroundColor: '#f7fafc' }}>住戸</th>
                <th className="border border-gray-300 p-2 font-medium" style={{ color: '#4a5568', backgroundColor: '#f7fafc' }}>科目</th>
                <th className="border border-gray-300 p-2 font-medium" style={{ color: '#4a5568', backgroundColor: '#f7fafc' }}>金額</th>
                <th className="border border-gray-300 p-2 font-medium" style={{ color: '#4a5568', backgroundColor: '#f7fafc' }}>期日</th>
                <th className="border border-gray-300 p-2 font-medium" style={{ color: '#4a5568', backgroundColor: '#f7fafc' }}>状態</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {store.receivables.slice(0, 10).map(rcv => (
                <tr key={rcv.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2" style={{ color: '#2d3748' }}>{rcv.unitNumber}号室</td>
                  <td className="border border-gray-300 p-2" style={{ color: '#2d3748' }}>
                    {rcv.accountCode === '1301' ? '管理費' :
                     rcv.accountCode === '1302' ? '修繕積立金' :
                     '駐車場'}
                  </td>
                  <td className="border border-gray-300 p-2 text-right" style={{ color: '#2d3748' }}>¥{rcv.amount.toLocaleString()}</td>
                  <td className="border border-gray-300 p-2" style={{ color: '#2d3748' }}>{rcv.dueDate}</td>
                  <td className="border border-gray-300 p-2" style={{ color: '#2d3748' }}>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      rcv.status === 'paid' ? 'bg-green-100 text-green-800' :
                      rcv.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
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
          <div className="mt-4 p-4 bg-white rounded border border-gray-300 shadow-sm">
            <h4 className="font-bold mb-2" style={{ color: '#2d3748' }}>未収金サマリー</h4>
            <div className="grid grid-cols-2 gap-2">
              <div style={{ color: '#718096' }}>総未収金額:</div>
              <div className="text-right font-bold" style={{ color: '#1a202c' }}>¥{store.receivableSummary.totalOutstanding.toLocaleString()}</div>
              <div style={{ color: '#718096' }}>対象住戸数:</div>
              <div className="text-right" style={{ color: '#2d3748' }}>{store.receivableSummary.unitCount}戸</div>
              <div style={{ color: '#718096' }}>当月分:</div>
              <div className="text-right" style={{ color: '#2d3748' }}>¥{store.receivableSummary.byAge.current.toLocaleString()}</div>
              <div style={{ color: '#718096' }}>1ヶ月延滞:</div>
              <div className="text-right" style={{ color: '#2d3748' }}>¥{store.receivableSummary.byAge.oneMonth.toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Phase 14 テストパネル</h2>
      
      {/* タブナビゲーション */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-2 rounded font-medium ${activeTab === 'test' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          テスト実行
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded font-medium ${activeTab === 'import' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          インポート
        </button>
        <button
          onClick={() => setActiveTab('matching')}
          className={`px-4 py-2 rounded font-medium ${activeTab === 'matching' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          照合結果
        </button>
        <button
          onClick={() => setActiveTab('receivables')}
          className={`px-4 py-2 rounded font-medium ${activeTab === 'receivables' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          未収金
        </button>
      </div>

      {/* テスト実行タブ */}
      {activeTab === 'test' && (
        <div>
          <div className="bg-white p-4 rounded border border-gray-300 mb-4 shadow-sm">
            <h3 className="font-bold mb-4" style={{ color: '#2d3748' }}>クイックテスト</h3>
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
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto border border-gray-700">
            <div className="mb-2 text-yellow-400">== Phase 14 Test Console ==</div>
            {testResults.map((result, index) => (
              <div key={index} className="mb-1">{result}</div>
            ))}
            {testResults.length === 0 && (
              <div className="text-gray-400">テストを実行してください...</div>
            )}
          </div>
        </div>
      )}

      {/* インポートタブ */}
      {activeTab === 'import' && (
        <div>
          <div className="bg-white p-4 rounded border border-gray-300 mb-4 shadow-sm">
            <h3 className="font-bold mb-4" style={{ color: '#2d3748' }}>CSVインポート</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium" style={{ color: '#4a5568' }}>銀行タイプ:</label>
              <select 
                value={selectedBankType}
                onChange={(e) => setSelectedBankType(e.target.value as any)}
                className="border border-gray-300 p-2 rounded w-full bg-white"
                style={{ color: '#2d3748' }}
              >
                <option value="generic">汎用</option>
                <option value="mufg">三菱UFJ銀行</option>
                <option value="smbc">三井住友銀行</option>
                <option value="mizuho">みずほ銀行</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium" style={{ color: '#4a5568' }}>CSVファイル:</label>
              <input 
                type="file" 
                accept=".csv"
                onChange={handleFileSelect}
                className="border border-gray-300 p-2 rounded w-full bg-white"
                style={{ color: '#2d3748' }}
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