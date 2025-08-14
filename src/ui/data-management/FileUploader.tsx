import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileParser, ParsedFileData, FileParseError, fileParserUtils } from '../../utils/fileParser'

interface FileUploaderProps {
  onFileProcessed: (data: ParsedFileData) => void
  onError: (error: string) => void
  maxSizeInMB?: number
  acceptedFormats?: string[]
}

interface UploadState {
  isDragActive: boolean
  isProcessing: boolean
  uploadedFile?: File
  parseResult?: ParsedFileData
  validationResult?: {
    isValid: boolean
    warnings: string[]
    errors: string[]
  }
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileProcessed,
  onError,
  maxSizeInMB = 10,
  acceptedFormats = ['.csv', '.tsv', '.xlsx', '.xls', '.txt']
}) => {
  const [state, setState] = useState<UploadState>({
    isDragActive: false,
    isProcessing: false
  })

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // 拒否されたファイルの処理
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      const errorMessages: string[] = []
      
      rejection.errors.forEach((error: any) => {
        switch (error.code) {
          case 'file-too-large':
            errorMessages.push(`ファイルサイズが${maxSizeInMB}MBを超えています`)
            break
          case 'file-invalid-type':
            errorMessages.push(`対応していないファイル形式です（対応形式: ${acceptedFormats.join(', ')}）`)
            break
          default:
            errorMessages.push(error.message)
        }
      })
      
      onError(errorMessages.join(', '))
      return
    }

    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      uploadedFile: file,
      parseResult: undefined,
      validationResult: undefined
    }))

    try {
      // ファイルサイズチェック
      if (!FileParser.validateFileSize(file, maxSizeInMB)) {
        throw new Error(`ファイルサイズが${maxSizeInMB}MBを超えています`)
      }

      // ファイル解析
      const parseResult = await FileParser.parseFile(file)
      
      // データ妥当性チェック
      const validationResult = fileParserUtils.validateParsedData(parseResult)
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        parseResult,
        validationResult
      }))

      // エラーがある場合は処理を中断
      if (!validationResult.isValid) {
        onError(`データ解析エラー: ${validationResult.errors.join(', ')}`)
        return
      }

      // 警告がある場合はユーザーに通知（処理は継続）
      if (validationResult.warnings.length > 0) {
        console.warn('データ警告:', validationResult.warnings)
      }

      // 成功時のコールバック
      onFileProcessed(parseResult)

    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }))
      
      if (error instanceof FileParseError) {
        onError(`解析エラー: ${error.message}`)
      } else {
        onError(`処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }, [onFileProcessed, onError, maxSizeInMB, acceptedFormats])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/tab-separated-values': ['.tsv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/plain': ['.txt']
    },
    maxSize: maxSizeInMB * 1024 * 1024,
    multiple: false
  })

  const clearFile = () => {
    setState({
      isDragActive: false,
      isProcessing: false
    })
  }

  return (
    <div className="file-uploader">
      {!state.uploadedFile ? (
        <div
          {...getRootProps()}
          className={`upload-area ${isDragActive ? 'drag-active' : ''} ${state.isProcessing ? 'processing' : ''}`}
        >
          <input {...getInputProps()} />
          
          <div className="upload-content">
            <div className="upload-icon">📁</div>
            
            {state.isProcessing ? (
              <div className="processing-state">
                <div className="spinner"></div>
                <p>ファイルを解析中...</p>
              </div>
            ) : isDragActive ? (
              <div className="drag-state">
                <p>ファイルをドロップしてください</p>
              </div>
            ) : (
              <div className="idle-state">
                <p><strong>ファイルをドラッグ&ドロップ</strong></p>
                <p>または<span className="browse-text">クリックして選択</span></p>
                <div className="file-info">
                  <p>対応形式: {acceptedFormats.join(', ')}</p>
                  <p>最大サイズ: {maxSizeInMB}MB</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="upload-result">
          <div className="file-summary">
            <div className="file-header">
              <h3>📄 アップロード完了</h3>
              <button onClick={clearFile} className="clear-button">✕</button>
            </div>
            
            <div className="file-details">
              <div className="file-info-grid">
                <div className="info-item">
                  <span className="label">ファイル名:</span>
                  <span className="value">{state.uploadedFile.name}</span>
                </div>
                <div className="info-item">
                  <span className="label">サイズ:</span>
                  <span className="value">{FileParser.getFileInfo(state.uploadedFile).size}</span>
                </div>
                <div className="info-item">
                  <span className="label">形式:</span>
                  <span className="value">{state.parseResult?.format || 'unknown'}</span>
                </div>
                {state.parseResult?.encoding && (
                  <div className="info-item">
                    <span className="label">文字コード:</span>
                    <span className="value">{state.parseResult.encoding}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {state.parseResult && (
            <div className="parse-summary">
              <h4>解析結果</h4>
              <div className="parse-stats">
                {state.parseResult.structured && (
                  <>
                    <div className="stat-item">
                      <span className="stat-label">データ行数:</span>
                      <span className="stat-value">{state.parseResult.structured.rows.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">列数:</span>
                      <span className="stat-value">{state.parseResult.structured.headers?.length || 'N/A'}</span>
                    </div>
                  </>
                )}
              </div>

              {/* データプレビュー */}
              {state.parseResult.structured && state.parseResult.structured.rows.length > 0 && (
                <div className="data-preview">
                  <h5>データプレビュー (最初の3行)</h5>
                  <div className="preview-table">
                    <table>
                      {state.parseResult.structured.headers && (
                        <thead>
                          <tr>
                            {state.parseResult.structured.headers.map((header, index) => (
                              <th key={index}>{header || `列${index + 1}`}</th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {state.parseResult.structured.rows.slice(0, 3).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex}>{cell || '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 警告・エラーメッセージ */}
              {state.validationResult && (
                <div className="validation-result">
                  {state.validationResult.warnings.length > 0 && (
                    <div className="warnings">
                      <h5>⚠️ 警告</h5>
                      <ul>
                        {state.validationResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {state.validationResult.errors.length > 0 && (
                    <div className="errors">
                      <h5>❌ エラー</h5>
                      <ul>
                        {state.validationResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .file-uploader {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .upload-area {
          border: 2px dashed #d0d7de;
          border-radius: 8px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: #f6f8fa;
        }

        .upload-area:hover {
          border-color: #0969da;
          background-color: #f0f6ff;
        }

        .upload-area.drag-active {
          border-color: #0969da;
          background-color: #e6f2ff;
          transform: scale(1.02);
        }

        .upload-area.processing {
          border-color: #fb8500;
          background-color: #fff4e6;
          cursor: wait;
        }

        .upload-content {
          pointer-events: none;
        }

        .upload-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .processing-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #0969da;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .drag-state p {
          font-size: 18px;
          color: #0969da;
          font-weight: 600;
        }

        .idle-state p {
          margin: 8px 0;
          color: #24292f;
        }

        .browse-text {
          color: #0969da;
          text-decoration: underline;
        }

        .file-info {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #d0d7de;
        }

        .file-info p {
          font-size: 12px;
          color: #656d76;
          margin: 4px 0;
        }

        .upload-result {
          background: #f6f8fa;
          border: 1px solid #d0d7de;
          border-radius: 8px;
          padding: 20px;
        }

        .file-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .file-header h3 {
          margin: 0;
          color: #1f883d;
        }

        .clear-button {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #656d76;
          padding: 4px;
        }

        .clear-button:hover {
          color: #d1242f;
        }

        .file-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
        }

        .label {
          font-weight: 600;
          color: #24292f;
        }

        .value {
          color: #656d76;
        }

        .parse-summary {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #d0d7de;
        }

        .parse-summary h4 {
          margin: 0 0 12px 0;
          color: #24292f;
        }

        .parse-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 16px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #656d76;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #24292f;
        }

        .data-preview {
          margin-top: 16px;
        }

        .data-preview h5 {
          margin: 0 0 8px 0;
          color: #24292f;
        }

        .preview-table {
          max-height: 200px;
          overflow: auto;
          border: 1px solid #d0d7de;
          border-radius: 4px;
        }

        .preview-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .preview-table th,
        .preview-table td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #d0d7de;
        }

        .preview-table th {
          background-color: #f6f8fa;
          font-weight: 600;
        }

        .validation-result {
          margin-top: 16px;
        }

        .warnings,
        .errors {
          margin-top: 12px;
          padding: 12px;
          border-radius: 4px;
        }

        .warnings {
          background-color: #fff8dc;
          border: 1px solid #f4c430;
        }

        .errors {
          background-color: #ffe6e6;
          border: 1px solid #dc3545;
        }

        .warnings h5,
        .errors h5 {
          margin: 0 0 8px 0;
        }

        .warnings ul,
        .errors ul {
          margin: 0;
          padding-left: 20px;
        }

        .warnings li,
        .errors li {
          margin: 4px 0;
        }
      `}</style>
    </div>
  )
}