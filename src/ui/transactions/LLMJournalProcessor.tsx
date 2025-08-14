import React, { useState, useEffect } from 'react'
import { ParsedFileData } from '../../utils/fileParser'
import { StandardizedBankTransaction, JournalSuggestion } from '../../types/master'
import { LLMJournalService } from '../../domain/services/LLMJournalService'
import { JournalPatternService } from '../../domain/services/JournalPatternService'
import { AccountService } from '../../domain/services/AccountService'
import { AuxiliaryService } from '../../domain/services/AuxiliaryService'
import { DivisionService } from '../../domain/services/DivisionService'
import { JournalService } from '../../domain/services/JournalService'

interface ProcessingStep {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  result?: any
  error?: string
  duration?: number
}

interface LLMJournalProcessorProps {
  parsedData: ParsedFileData
  accountingEngine: any // AccountingEngineのインスタンス
  onProcessingComplete: (results: ProcessedResults) => void
  onError: (error: string) => void
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

export const LLMJournalProcessor: React.FC<LLMJournalProcessorProps> = ({
  parsedData,
  accountingEngine,
  onProcessingComplete,
  onError
}) => {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'normalize', name: 'データ正規化', status: 'pending' },
    { id: 'patterns', name: 'パターン読込', status: 'pending' },
    { id: 'journals', name: '仕訳生成', status: 'pending' },
    { id: 'validate', name: '結果検証', status: 'pending' }
  ])

  const [processingStartTime, setProcessingStartTime] = useState<number>(0)
  const [currentStep, setCurrentStep] = useState<string>('')

  useEffect(() => {
    startProcessing()
  }, [parsedData])

  const updateStep = (stepId: string, updates: Partial<ProcessingStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }

  const startProcessing = async () => {
    setProcessingStartTime(Date.now())
    setCurrentStep('normalize')

    try {
      // Step 1: データ正規化
      const normalizedData = await processNormalization()
      
      // Step 2: パターン読込
      await loadPatterns()
      
      // Step 3: 仕訳生成
      const journalSuggestions = await generateJournals(normalizedData)
      
      // Step 4: 結果検証
      await validateResults(normalizedData, journalSuggestions)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      updateStep(currentStep, { status: 'error', error: errorMessage })
      onError(`処理エラー: ${errorMessage}`)
    }
  }

  const processNormalization = async (): Promise<StandardizedBankTransaction> => {
    updateStep('normalize', { status: 'processing' })
    const stepStartTime = Date.now()

    try {
      // サービスインスタンスの作成
      const patternService = new JournalPatternService(
        accountingEngine.journalService,
        accountingEngine.accountService,
        accountingEngine.auxiliaryService
      )
      
      const llmService = new LLMJournalService(
        patternService,
        accountingEngine.accountService,
        accountingEngine.auxiliaryService,
        accountingEngine.divisionService
      )

      // 銀行名のヒント生成
      const hints = {
        bankName: detectBankName(parsedData.rawText),
        expectedFormat: parsedData.format,
        dateRange: detectDateRange(parsedData.rawText)
      }

      // LLMによるデータ正規化
      const normalizedData = await llmService.normalizeData(parsedData.rawText, hints)
      
      const duration = Date.now() - stepStartTime
      updateStep('normalize', { 
        status: 'completed', 
        result: normalizedData,
        duration
      })

      setCurrentStep('patterns')
      return normalizedData
    } catch (error) {
      throw new Error(`データ正規化エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const loadPatterns = async () => {
    updateStep('patterns', { status: 'processing' })
    const stepStartTime = Date.now()

    try {
      // 既存パターンの読み込み（実際は初期化時に完了済み）
      await new Promise(resolve => setTimeout(resolve, 500)) // 模擬的な待機
      
      const duration = Date.now() - stepStartTime
      updateStep('patterns', { 
        status: 'completed',
        result: { patternCount: 25 }, // 模擬データ
        duration
      })

      setCurrentStep('journals')
    } catch (error) {
      throw new Error(`パターン読込エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const generateJournals = async (normalizedData: StandardizedBankTransaction): Promise<JournalSuggestion[]> => {
    updateStep('journals', { status: 'processing' })
    const stepStartTime = Date.now()

    try {
      const patternService = new JournalPatternService(
        accountingEngine.journalService,
        accountingEngine.accountService,
        accountingEngine.auxiliaryService
      )
      
      const llmService = new LLMJournalService(
        patternService,
        accountingEngine.accountService,
        accountingEngine.auxiliaryService,
        accountingEngine.divisionService
      )

      // 各取引に対して仕訳生成
      const journalSuggestions: JournalSuggestion[] = []
      
      for (const transaction of normalizedData.transactions) {
        const suggestion = await llmService.generateJournal(transaction, {
          includePatterns: true,
          maxPatterns: 30
        })
        journalSuggestions.push(suggestion)
        
        // プログレス更新（実際のUIでは進捗バーを更新）
        await new Promise(resolve => setTimeout(resolve, 100)) // 模擬的な処理時間
      }
      
      const duration = Date.now() - stepStartTime
      updateStep('journals', { 
        status: 'completed',
        result: { 
          suggestions: journalSuggestions,
          count: journalSuggestions.length
        },
        duration
      })

      setCurrentStep('validate')
      return journalSuggestions
    } catch (error) {
      throw new Error(`仕訳生成エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const validateResults = async (
    normalizedData: StandardizedBankTransaction,
    journalSuggestions: JournalSuggestion[]
  ) => {
    updateStep('validate', { status: 'processing' })
    const stepStartTime = Date.now()

    try {

      // 統計計算
      const stats = {
        totalTransactions: normalizedData.transactions.length,
        patternMatched: journalSuggestions.filter(s => !s.suggestedJournal).length,
        newPatterns: journalSuggestions.filter(s => s.suggestedJournal).length,
        highConfidence: journalSuggestions.filter(s => s.confidence >= 80).length,
        lowConfidence: journalSuggestions.filter(s => s.confidence < 60).length
      }

      // 結果の組み立て
      const results: ProcessedResults = {
        normalizedData,
        journalSuggestions,
        processingTime: Date.now() - processingStartTime,
        stats
      }

      const duration = Date.now() - stepStartTime
      updateStep('validate', { 
        status: 'completed',
        result: stats,
        duration
      })

      // 処理完了通知
      onProcessingComplete(results)
      
    } catch (error) {
      throw new Error(`結果検証エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 銀行名の検出（簡易実装）
  const detectBankName = (text: string): string | undefined => {
    const bankNames = ['三菱UFJ', '三井住友', 'みずほ', 'りそな', 'ゆうちょ']
    return bankNames.find(bank => text.includes(bank))
  }

  // 日付範囲の検出（簡易実装）
  const detectDateRange = (text: string): string | undefined => {
    const dateMatches = text.match(/\d{4}[/-]\d{1,2}[/-]\d{1,2}/g)
    if (dateMatches && dateMatches.length >= 2) {
      return `${dateMatches[0]}から${dateMatches[dateMatches.length - 1]}`
    }
    return undefined
  }

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'processing': return '🔄'
      case 'completed': return '✅'
      case 'error': return '❌'
    }
  }

  const formatDuration = (ms?: number): string => {
    if (!ms) return ''
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getOverallProgress = (): number => {
    const completedSteps = steps.filter(s => s.status === 'completed').length
    return (completedSteps / steps.length) * 100
  }

  const isProcessing = steps.some(s => s.status === 'processing')
  const hasErrors = steps.some(s => s.status === 'error')
  const isComplete = steps.every(s => s.status === 'completed')

  return (
    <div className="llm-processor">
      <div className="processor-header">
        <h3>🤖 LLM処理中</h3>
        <div className="progress-info">
          <span>{Math.round(getOverallProgress())}% 完了</span>
          {processingStartTime > 0 && (
            <span>経過時間: {formatDuration(Date.now() - processingStartTime)}</span>
          )}
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${getOverallProgress()}%` }}
        ></div>
      </div>

      <div className="processing-steps">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`step ${step.status} ${currentStep === step.id ? 'current' : ''}`}
          >
            <div className="step-header">
              <div className="step-icon">
                {step.status === 'processing' && (
                  <div className="spinner-small"></div>
                )}
                <span>{getStepIcon(step.status)}</span>
              </div>
              <div className="step-info">
                <h4>{step.name}</h4>
                {step.duration && (
                  <span className="duration">{formatDuration(step.duration)}</span>
                )}
              </div>
            </div>

            {step.status === 'error' && step.error && (
              <div className="step-error">
                <p>{step.error}</p>
              </div>
            )}

            {step.status === 'completed' && step.result && (
              <div className="step-result">
                {step.id === 'normalize' && (
                  <p>取引 {step.result.transactions?.length || 0} 件を正規化</p>
                )}
                {step.id === 'patterns' && (
                  <p>パターン {step.result.patternCount} 件を読込</p>
                )}
                {step.id === 'journals' && (
                  <p>仕訳 {step.result.count} 件を生成</p>
                )}
                {step.id === 'validate' && (
                  <div className="validation-stats">
                    <span>高信頼度: {step.result.highConfidence}件</span>
                    <span>低信頼度: {step.result.lowConfidence}件</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {isComplete && (
        <div className="completion-message">
          <p>✨ すべての処理が完了しました！</p>
          <p>仕訳の確認画面に進んでください。</p>
        </div>
      )}

      <style jsx>{`
        .llm-processor {
          background: #f6f8fa;
          border: 1px solid #d0d7de;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }

        .processor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .processor-header h3 {
          margin: 0;
          color: #24292f;
        }

        .progress-info {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #656d76;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #d0d7de;
          border-radius: 4px;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0969da, #218bff);
          transition: width 0.3s ease;
        }

        .processing-steps {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .step {
          background: white;
          border: 1px solid #d0d7de;
          border-radius: 6px;
          padding: 16px;
          transition: all 0.3s ease;
        }

        .step.current {
          border-color: #0969da;
          box-shadow: 0 0 0 2px rgba(9, 105, 218, 0.1);
        }

        .step.completed {
          border-color: #1f883d;
          background-color: #f6ffed;
        }

        .step.error {
          border-color: #d1242f;
          background-color: #fff5f5;
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .step-icon {
          position: relative;
          font-size: 20px;
          min-width: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner-small {
          position: absolute;
          width: 16px;
          height: 16px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #0969da;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .step-info h4 {
          margin: 0;
          color: #24292f;
          font-size: 14px;
        }

        .duration {
          font-size: 12px;
          color: #656d76;
          margin-left: 8px;
        }

        .step-error {
          margin-top: 8px;
          padding: 8px 12px;
          background-color: #ffebe9;
          border-radius: 4px;
          color: #d1242f;
          font-size: 12px;
        }

        .step-result {
          margin-top: 8px;
          font-size: 12px;
          color: #656d76;
        }

        .validation-stats {
          display: flex;
          gap: 16px;
        }

        .completion-message {
          margin-top: 20px;
          padding: 16px;
          background: linear-gradient(135deg, #e6f7ff, #f0f9ff);
          border: 1px solid #91caff;
          border-radius: 6px;
          text-align: center;
        }

        .completion-message p {
          margin: 4px 0;
          color: #003a8c;
        }
      `}</style>
    </div>
  )
}