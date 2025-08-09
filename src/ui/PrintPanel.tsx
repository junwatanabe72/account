import React from 'react'

export const PrintPanel: React.FC = () => {
  return (
    <div className="card mt-3 no-print">
      <div className="card-header d-flex justify-content-between align-items-center">
        <strong>印刷</strong>
        <div>
          <button className="btn btn-sm btn-primary" onClick={() => window.print()}>現在の画面を印刷</button>
        </div>
      </div>
      <div className="card-body">
        <ul className="mb-0">
          <li>印刷時はボタン/ナビゲーションなどを自動で非表示にし、帳票の見栄えを整えます。</li>
          <li>必要に応じて各ビューを拡大し、印刷プレビューで調整してください。</li>
        </ul>
      </div>
    </div>
  )
}
