import React, { useState } from 'react'

export const ManualView: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview')

  const sections = [
    { id: 'overview', title: '概要', icon: '📋' },
    { id: 'journal', title: '仕訳管理', icon: '📝' },
    { id: 'reports', title: '帳票・レポート', icon: '📊' },
    { id: 'master', title: 'マスタ管理', icon: '⚙️' },
    { id: 'data', title: 'データ管理', icon: '💾' },
    { id: 'tips', title: '便利な使い方', icon: '💡' },
  ]

  const manualContent: { [key: string]: string } = {
    overview: `
# マンション管理組合会計システム マニュアル

## システム概要
このシステムは、マンション管理組合の会計業務を支援するWebアプリケーションです。
複式簿記による仕訳入力から、各種帳票の自動生成まで、会計業務全般をサポートします。

### 主な特徴
- **複式簿記対応**: 借方・貸方による正確な仕訳入力
- **区分経理**: 管理費、修繕積立金、駐車場会計の区分管理
- **自動集計**: 入力したデータから各種帳票を自動生成
- **データバックアップ**: JSON形式でのエクスポート/インポート
- **印刷対応**: すべての帳票を印刷可能

### システム要件
- モダンなWebブラウザ（Chrome, Firefox, Safari, Edge）
- インターネット接続は不要（ローカルで動作）
- データはブラウザのローカルストレージに保存

### データの安全性
- すべてのデータはお使いのブラウザ内に保存されます
- 外部サーバーへのデータ送信は一切ありません
- 定期的なバックアップを推奨します
`,

    journal: `
# 仕訳管理

## 仕訳入力・仕訳帳
日々の取引を仕訳として入力し、仕訳帳で確認できます。

### 機能
- **仕訳入力**: 日付、借方/貸方科目、金額、摘要を入力
- **区分選択**: 管理費/修繕積立金/駐車場の区分を選択
- **補助科目**: 必要に応じて補助科目を設定可能
- **仕訳帳表示**: 入力した仕訳を時系列で表示
- **編集・削除**: 登録済み仕訳の修正や削除が可能

### 入力手順
1. 日付を選択（デフォルトは当日）
2. 借方科目と金額を入力
3. 貸方科目と金額を入力
4. 摘要欄に取引内容を記載
5. 区分を選択（管理費/修繕積立金/駐車場）
6. 「仕訳登録」ボタンをクリック

## 銀行明細インポート
銀行の取引明細（CSV）から自動で仕訳を生成します。

### 対応形式
- CSV形式の銀行明細
- 日付、摘要、入金額、出金額の列が必要

### 自動仕訳機能
- AIによる摘要解析で適切な勘定科目を自動提案
- パターン学習により精度が向上
- 手動での科目変更も可能

## 補助元帳
特定の勘定科目の詳細な取引履歴を確認できます。

### 機能
- 科目別の取引明細表示
- 期間指定での絞り込み
- 残高推移の確認
- CSV出力対応
`,

    reports: `
# 帳票・レポート

## 収入明細表
期間内の収入を科目別に集計した明細表です。

### 表示内容
- 収入科目別の金額集計
- 前年同期比較
- グラフによる視覚化
- 区分別集計（管理費/修繕積立金/駐車場）

## 支出明細表
期間内の支出を科目別に集計した明細表です。

### 表示内容
- 支出科目別の金額集計
- 予算対比分析
- 主要支出項目のランキング
- 区分別集計

## 収支報告書（区分別）
年度ごとの収支を区分別に表示する総合報告書です。

### 特徴
- 予算/決算対比表
- 収支差額の自動計算
- 次期繰越金の算出
- 印刷用レイアウト対応

### レスポンシブデザイン
- PC: 収入・支出を横並び表示
- スマートフォン: 縦並びで見やすく表示
- タブレット: 最適化された中間レイアウト

## 試算表/PL/BS
### 試算表
全勘定科目の借方/貸方残高を一覧表示

### 損益計算書（PL）
- 収益・費用の詳細
- 当期利益の算出
- 前期比較分析

### 貸借対照表（BS）
- 資産・負債・純資産の状況
- 流動比率等の財務指標
- 期末残高の確認
`,

    master: `
# マスタ管理

## 科目マスタ
勘定科目の追加・編集・削除を行います。

### 科目体系
- **1000番台**: 資産
- **2000番台**: 負債
- **3000番台**: 純資産
- **4000番台**: 収益
- **5000番台**: 費用

### カスタマイズ
- 新規科目の追加
- 既存科目名の変更
- 補助科目の設定
- 使用停止設定

## 設定・期首
会計期間と期首残高を設定します。

### 設定項目
- 会計期間（4月1日〜3月31日）
- 組合名称
- 住所・連絡先
- 決算承認日

### 期首残高
- 前期末残高の入力
- 貸借一致の確認
- 繰越処理の実行

## 期末処理
年度末の決算処理を行います。

### 処理内容
1. 仮締め処理
2. 決算整理仕訳
3. 損益振替
4. 繰越処理
5. 次期への移行

### 注意事項
- 期末処理は取り消しできません
- 処理前にバックアップを推奨
- 監査終了後に実行してください
`,

    data: `
# データ管理

## バックアップ/CSV

### JSONエクスポート
システムの全データをJSON形式で出力します。

#### 用途
- 定期バックアップ
- 他システムへの移行
- 監査資料の保管

#### 出力内容
- 全仕訳データ
- マスタ設定
- 期首残高
- システム設定

### CSVエクスポート
各種帳票をCSV形式で出力します。

#### 対応帳票
- 仕訳帳
- 総勘定元帳
- 試算表
- 収支報告書

### インポート機能
- JSON形式のデータ取り込み
- 既存データとのマージ/置換選択
- エラーチェック機能

## JSON仕様
システムで使用するJSONデータの仕様書です。

### データ構造
\`\`\`json
{
  "journals": [...],     // 仕訳データ
  "accounts": {...},     // 勘定科目
  "settings": {...},     // システム設定
  "balances": {...}      // 残高情報
}
\`\`\`

### 仕訳データ形式
\`\`\`json
{
  "id": "uuid",
  "date": "2024-04-01",
  "debit": {
    "account": "1111",
    "amount": 100000
  },
  "credit": {
    "account": "4111",
    "amount": 100000
  },
  "description": "管理費収入",
  "division": "KANRI"
}
\`\`\`

## ローカルストレージ
ブラウザのローカルストレージを使用した自動保存機能。

### 特徴
- リアルタイム自動保存
- ブラウザを閉じてもデータ保持
- 複数タブでの同期

### 管理機能
- データサイズの確認
- キャッシュクリア
- 手動保存/読込
`,

    tips: `
# 便利な使い方

## ショートカットキー
- **Ctrl + S**: データ保存
- **Ctrl + N**: 新規仕訳
- **Ctrl + P**: 印刷
- **Esc**: ダイアログを閉じる

## 効率的な入力方法

### 定型仕訳の活用
よく使う仕訳パターンを登録して再利用
1. 仕訳入力時に「定型登録」を選択
2. パターン名を付けて保存
3. 次回から選択するだけで入力完了

### 一括入力
複数の類似仕訳をまとめて入力
- Excelからコピー&ペースト対応
- CSVファイルの一括取り込み

## トラブルシューティング

### データが表示されない
1. ブラウザのキャッシュをクリア
2. ローカルストレージを確認
3. バックアップから復元

### 印刷がうまくいかない
- 印刷プレビューで確認
- 用紙サイズをA4に設定
- 余白を調整（推奨: 上下左右10mm）

### 計算が合わない
- 仕訳の貸借一致を確認
- 期首残高の設定を確認
- 区分設定の確認

## おすすめの運用方法

### 月次処理
1. 月初: 前月の仕訳確認
2. 月中: 日次での仕訳入力
3. 月末: 月次試算表の作成
4. 翌月5日: 月次報告書の作成

### 年次処理
1. 3月末: 仮締め処理
2. 4月: 決算整理
3. 5月: 決算書作成
4. 6月: 総会報告

### バックアップ推奨頻度
- 日次: ローカルストレージ（自動）
- 週次: JSONエクスポート
- 月次: 外部メディアへ保存
- 年次: クラウドストレージへ保管

## サポート情報

### よくある質問
- Q: データはどこに保存されますか？
- A: お使いのブラウザのローカルストレージに保存されます

- Q: 複数のPCで使えますか？
- A: JSONエクスポート/インポートで データを移行できます

- Q: 印刷時にレイアウトが崩れます
- A: 印刷設定で「背景グラフィック」を有効にしてください

### アップデート情報
最新バージョンの機能追加や不具合修正情報は、システムの「お知らせ」欄でご確認ください。
`
  }

  return (
    <div className="container-fluid">
      <h2 className="mb-4">📚 システムマニュアル</h2>
      
      <div className="row">
        {/* サイドナビゲーション */}
        <div className="col-md-3 mb-4">
          <div className="list-group">
            {sections.map(section => (
              <button
                key={section.id}
                className={`list-group-item list-group-item-action d-flex align-items-center ${
                  activeSection === section.id ? 'active' : ''
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="me-2">{section.icon}</span>
                <span>{section.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* マニュアルコンテンツ */}
        <div className="col-md-9">
          <div className="card">
            <div className="card-body">
              <div 
                className="manual-content"
                dangerouslySetInnerHTML={{ 
                  __html: convertMarkdownToHtml(manualContent[activeSection] || '') 
                }}
                style={{
                  lineHeight: '1.8',
                  fontSize: '15px'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .manual-content h1 {
          color: #2c3e50;
          border-bottom: 3px solid #3498db;
          padding-bottom: 10px;
          margin-bottom: 20px;
          font-size: 1.8rem;
        }
        
        .manual-content h2 {
          color: #34495e;
          border-bottom: 2px solid #ecf0f1;
          padding-bottom: 8px;
          margin-top: 30px;
          margin-bottom: 15px;
          font-size: 1.4rem;
        }
        
        .manual-content h3 {
          color: #7f8c8d;
          margin-top: 20px;
          margin-bottom: 10px;
          font-size: 1.2rem;
        }
        
        .manual-content ul {
          margin-bottom: 15px;
        }
        
        .manual-content li {
          margin-bottom: 8px;
        }
        
        .manual-content code {
          background-color: #f8f9fa;
          padding: 2px 6px;
          border-radius: 3px;
          color: #e83e8c;
          font-size: 0.9em;
        }
        
        .manual-content pre {
          background-color: #f4f4f4;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          overflow-x: auto;
        }
        
        .manual-content pre code {
          background-color: transparent;
          color: #333;
          padding: 0;
        }
        
        .manual-content strong {
          color: #2c3e50;
          font-weight: 600;
        }
        
        .manual-content blockquote {
          border-left: 4px solid #3498db;
          padding-left: 15px;
          margin: 15px 0;
          color: #555;
          font-style: italic;
        }
        
        .list-group-item.active {
          background-color: #3498db;
          border-color: #3498db;
        }
        
        @media (max-width: 768px) {
          .manual-content h1 { font-size: 1.5rem; }
          .manual-content h2 { font-size: 1.2rem; }
          .manual-content h3 { font-size: 1.1rem; }
          .manual-content { font-size: 14px; }
        }
      `}</style>
    </div>
  )
}

// 簡易的なMarkdown→HTML変換関数
function convertMarkdownToHtml(markdown: string): string {
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Lists
    .replace(/^\* (.+)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^\d+\. (.+)/gim, '<li>$1</li>')
    // Code blocks
    .replace(/```json([^`]+)```/g, '<pre><code class="language-json">$1</code></pre>')
    .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    
  // Wrap in paragraphs
  html = '<p>' + html + '</p>'
  
  // Clean up
  html = html
    .replace(/<p><h/g, '<h')
    .replace(/<\/h(\d)><\/p>/g, '</h$1>')
    .replace(/<p><ul>/g, '<ul>')
    .replace(/<\/ul><\/p>/g, '</ul>')
    .replace(/<p><li>/g, '<li>')
    .replace(/<p><\/p>/g, '')
    
  return html
}