import React, { useState, useEffect } from 'react'
import { FileUploader } from '../data-management/FileUploader'
import { LLMJournalProcessor } from './LLMJournalProcessor'
import { JournalConfirmation } from './JournalConfirmation'
import { ParsedFileData } from '../../utils/fileParser'
import { StandardizedBankTransaction, JournalSuggestion } from '../../types/master'

// 既存のAccountingEngineを使用するための型定義
interface AccountingEngine {
  journalService: any
  accountService: any
  auxiliaryService: any
  divisionService: any
  addJournal: (date: string, description: string, details: any[], division?: string) => void
}

interface ProcessedResults {
  normalizedData: StandardizedBankTransaction
  journalSuggestions: JournalSuggestion[]
  processingTime: number
  stats: {
    totalTransactions: number
    patternMatched: number
    newPatterns: number
    highConfidence: number
    lowConfidence: number
  }
}

interface ApprovedJournal {
  transactionId: string
  originalTransaction: StandardizedBankTransaction['transactions'][0]
  journalEntries: {
    date: string
    description: string
    details: Array<{
      accountCode: string
      accountName: string
      debitAmount: number
      creditAmount: number
      auxiliaryCode?: string
      division?: string
    }>
  }
  confidence: number
  isModified: boolean
  patternId?: string
}

type WizardStep = 'upload' | 'processing' | 'confirmation' | 'complete'

interface BankImportWizardProps {
  accountingEngine: AccountingEngine
  onComplete?: (results: { 
    importedJournals: number
    totalAmount: number
    processingTime: number 
  }) => void
}

export const BankImportWizard: React.FC<BankImportWizardProps> = ({
  accountingEngine,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload')
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null)
  const [processedResults, setProcessedResults] = useState<ProcessedResults | null>(null)
  const [finalResults, setFinalResults] = useState<{
    importedJournals: number
    totalAmount: number
    processingTime: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ステップの進行状況
  const steps = [
    { id: 'upload', name: 'ファイル選択', icon: '📁' },
    { id: 'processing', name: 'LLM処理', icon: '🤖' },
    { id: 'confirmation', name: '仕訳確認', icon: '🔍' },
    { id: 'complete', name: '完了', icon: '✅' }
  ]

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep)
  }

  const handleFileProcessed = (data: ParsedFileData) => {
    setParsedData(data)
    setCurrentStep('processing')
  }

  const handleProcessingComplete = (results: ProcessedResults) => {
    setProcessedResults(results)
    setCurrentStep('confirmation')
  }

  const handleJournalsApproved = async (approvedJournals: ApprovedJournal[]) => {
    try {
      setCurrentStep('complete')
      
      // 仕訳の登録処理
      let importedCount = 0
      let totalAmount = 0
      
      for (const approvedJournal of approvedJournals) {
        try {
          // 仕訳データを作成
          const journalData = {
            date: approvedJournal.journalEntries.date,
            description: approvedJournal.journalEntries.description,
            details: approvedJournal.journalEntries.details.map(detail => ({
              accountCode: detail.accountCode,
              debitAmount: detail.debitAmount,
              creditAmount: detail.creditAmount,
              auxiliaryCode: detail.auxiliaryCode,
              division: detail.division
            }))
          }
          
          // AccountingEngineのcreateJournalメソッドを直接使用
          const result = accountingEngine.createJournal(journalData)
          
          // 仕訳を投稿状態にする
          if (result.success && result.journal) {
            accountingEngine.postJournalById(result.journal.id)
          }
          
          importedCount++
          totalAmount += Math.abs(approvedJournal.originalTransaction.amount)
          
        } catch (journalError) {
          console.error('仕訳登録エラー:', journalError)
        }
      }
      
      const results = {
        importedJournals: importedCount,
        totalAmount,
        processingTime: processedResults?.processingTime || 0
      }
      
      setFinalResults(results)
      
      if (onComplete) {
        onComplete(results)
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(`仕訳登録エラー: ${errorMessage}`)
    }
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handleReset = () => {
    setCurrentStep('upload')
    setParsedData(null)
    setProcessedResults(null)
    setFinalResults(null)
    setError(null)
  }

  const handleBackToConfirmation = () => {
    setCurrentStep('confirmation')
  }

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP').format(amount)
  }

  return (
    <div className="bank-import-wizard">
      <div className="wizard-header">
        <h1>🏦 銀行明細インポート</h1>
        <p>LLMを活用した自動仕訳生成システム</p>
      </div>

      {/* プログレス表示 */}
      <div className="wizard-progress">
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div key={step.id} className={`progress-step ${
              index < getCurrentStepIndex() ? 'completed' : 
              index === getCurrentStepIndex() ? 'current' : 'pending'
            }`}>
              <div className="step-icon">{step.icon}</div>
              <div className="step-info">
                <div className="step-name">{step.name}</div>
                <div className="step-number">{index + 1}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${(getCurrentStepIndex() / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="error-alert">
          <div className="error-icon">❌</div>
          <div className="error-content">
            <h3>エラーが発生しました</h3>
            <p>{error}</p>
            <button onClick={handleReset} className="retry-button">
              最初からやり直す
            </button>
          </div>
        </div>
      )}

      {/* ステップ別コンテンツ */}
      <div className="wizard-content">
        {currentStep === 'upload' && (
          <div className="step-content">
            <div className="step-description">
              <h2>📁 銀行明細ファイルを選択</h2>
              <p>CSV、Excel、テキストファイルなど、様々な形式に対応しています。<br />
              ファイルをドラッグ&ドロップするか、クリックして選択してください。</p>
            </div>
            <FileUploader
              onFileProcessed={handleFileProcessed}
              onError={handleError}
              maxSizeInMB={10}
              acceptedFormats={['.csv', '.xlsx', '.xls', '.txt', '.tsv']}
            />
            
            {/* デモモード用ボタン */}
            <div className="demo-section">
              <div className="demo-divider">
                <span>または</span>
              </div>
              <button
                className="demo-button"
                onClick={async () => {
                  try {
                    // サンプルファイルを取得
                    const response = await fetch('/account/sample-bank-statement.csv')
                    const text = await response.text()
                    
                    // FileUploaderが期待する形式でデータを作成
                    const mockParsedData = {
                      fileName: 'sample-bank-statement.csv',
                      format: 'csv' as const,
                      encoding: 'UTF-8',
                      rawText: text,
                      structured: {
                        headers: ['日付', '摘要', '出金', '入金', '残高'],
                        rows: text.split('\n').slice(1).filter(line => line.trim()).map(line => 
                          line.split(',').map(cell => cell.trim())
                        )
                      }
                    }
                    
                    handleFileProcessed(mockParsedData)
                  } catch (error) {
                    handleError('デモデータの読み込みに失敗しました')
                  }
                }}
              >
                🎭 デモデータで試す
              </button>
              <p className="demo-description">
                サンプルの銀行明細データを使って、システムの動作をお試しいただけます
              </p>
            </div>
          </div>
        )}

        {currentStep === 'processing' && parsedData && (
          <div className="step-content">
            <div className="step-description">
              <h2>🤖 LLMによる自動処理中</h2>
              <p>データを正規化し、既存の仕訳パターンと照合して仕訳を生成しています。</p>
            </div>
            <LLMJournalProcessor
              parsedData={parsedData}
              accountingEngine={accountingEngine}
              onProcessingComplete={handleProcessingComplete}
              onError={handleError}
            />
          </div>
        )}

        {currentStep === 'confirmation' && processedResults && (
          <div className="step-content">
            <JournalConfirmation
              results={processedResults}
              onApprove={handleJournalsApproved}
              onBack={handleBackToConfirmation}
              accountingEngine={accountingEngine}
            />
          </div>
        )}

        {currentStep === 'complete' && finalResults && (
          <div className="step-content">
            <div className="completion-screen">
              <div className="completion-icon">🎉</div>
              <h2>インポート完了！</h2>
              <p>銀行明細の仕訳生成が完了しました。</p>
              
              <div className="completion-stats">
                <div className="stat-card">
                  <div className="stat-value">{finalResults.importedJournals}</div>
                  <div className="stat-label">登録された仕訳</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">¥{formatAmount(finalResults.totalAmount)}</div>
                  <div className="stat-label">総取引金額</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{(finalResults.processingTime / 1000).toFixed(1)}s</div>
                  <div className="stat-label">処理時間</div>
                </div>
              </div>

              <div className="completion-actions">
                <button onClick={handleReset} className="new-import-button">
                  新しいファイルをインポート
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="view-journals-button"
                >
                  仕訳一覧を確認
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .bank-import-wizard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
        }

        .wizard-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .wizard-header h1 {
          margin: 0;
          color: #24292f;
          font-size: 32px;
        }

        .wizard-header p {
          margin: 8px 0 0 0;
          color: #656d76;
          font-size: 16px;
        }

        .wizard-progress {
          margin-bottom: 32px;
        }

        .progress-steps {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          position: relative;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
          position: relative;
        }

        .progress-step::after {
          content: '';
          position: absolute;
          top: 16px;
          left: 60%;
          width: 80%;
          height: 2px;
          background-color: #d0d7de;
          z-index: 0;
        }

        .progress-step:last-child::after {
          display: none;
        }

        .progress-step.completed::after {
          background-color: #1f883d;
        }

        .step-icon {
          font-size: 24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f6f8fa;
          border: 2px solid #d0d7de;
          position: relative;
          z-index: 1;
        }

        .progress-step.current .step-icon {
          background-color: #0969da;
          border-color: #0969da;
          color: white;
          animation: pulse 2s infinite;
        }

        .progress-step.completed .step-icon {
          background-color: #1f883d;
          border-color: #1f883d;
          color: white;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .step-info {
          text-align: center;
        }

        .step-name {
          font-size: 12px;
          font-weight: 600;
          color: #24292f;
        }

        .step-number {
          font-size: 10px;
          color: #656d76;
        }

        .progress-bar {
          height: 4px;
          background-color: #d0d7de;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #1f883d, #0969da);
          transition: width 0.5s ease;
          border-radius: 2px;
        }

        .error-alert {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background-color: #fff5f5;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .error-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .error-content h3 {
          margin: 0 0 4px 0;
          color: #dc2626;
          font-size: 16px;
        }

        .error-content p {
          margin: 0 0 12px 0;
          color: #dc2626;
          font-size: 14px;
        }

        .retry-button {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .retry-button:hover {
          background: #b91c1c;
        }

        .wizard-content {
          background: white;
          border: 1px solid #d0d7de;
          border-radius: 12px;
          overflow: hidden;
        }

        .step-content {
          padding: 32px;
        }

        .step-description {
          text-align: center;
          margin-bottom: 32px;
        }

        .step-description h2 {
          margin: 0 0 8px 0;
          color: #24292f;
          font-size: 24px;
        }

        .step-description p {
          margin: 0;
          color: #656d76;
          font-size: 16px;
          line-height: 1.5;
        }

        .completion-screen {
          text-align: center;
          padding: 40px 20px;
        }

        .completion-icon {
          font-size: 72px;
          margin-bottom: 24px;
        }

        .completion-screen h2 {
          margin: 0 0 8px 0;
          color: #1f883d;
          font-size: 32px;
        }

        .completion-screen > p {
          margin: 0 0 32px 0;
          color: #656d76;
          font-size: 18px;
        }

        .completion-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: #f6f8fa;
          border: 1px solid #d0d7de;
          border-radius: 12px;
          padding: 24px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #24292f;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #656d76;
        }

        .completion-actions {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .new-import-button,
        .view-journals-button {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .new-import-button {
          background: #0969da;
          color: white;
          border: none;
        }

        .new-import-button:hover {
          background: #0550ae;
        }

        .view-journals-button {
          background: white;
          color: #24292f;
          border: 1px solid #d0d7de;
        }

        .view-journals-button:hover {
          background: #f6f8fa;
        }

        .demo-section {
          margin-top: 32px;
          padding-top: 32px;
          border-top: 1px solid #d0d7de;
        }

        .demo-divider {
          text-align: center;
          position: relative;
          margin-bottom: 24px;
        }

        .demo-divider span {
          background: white;
          padding: 0 16px;
          color: #656d76;
          font-size: 14px;
          position: relative;
        }

        .demo-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #d0d7de;
          z-index: -1;
        }

        .demo-button {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .demo-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .demo-description {
          text-align: center;
          margin-top: 12px;
          color: #656d76;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .bank-import-wizard {
            padding: 16px;
          }

          .progress-steps {
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }

          .progress-step::after {
            display: none;
          }

          .step-content {
            padding: 20px;
          }

          .completion-stats {
            grid-template-columns: 1fr;
          }

          .completion-actions {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  )
}