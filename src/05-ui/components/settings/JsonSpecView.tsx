import React from 'react'
import { AccountingEngine } from '../../02-core/accountingEngine'

function download(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type: type + ';charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export const JsonSpecView: React.FC<{ engine: AccountingEngine }> = ({ engine }) => {
  const exportSimpleSample = () => {
    const payload = {
      clearExisting: true,
      journals: [
        {
          date: new Date().toISOString().split('T')[0],
          description: '管理費請求（サンプル）',
          details: [
            { accountCode: '1121', debitAmount: 500000 },
            { accountCode: '4111', creditAmount: 500000 },
          ],
        },
      ],
    }
    download('import-sample-min.json', JSON.stringify(payload, null, 2))
  }
  const exportComprehensiveSample = () => {
    const payload = {
      clearExisting: true,
      openingBalances: {
        date: new Date().toISOString().split('T')[0],
        entries: engine.exportCurrentBalancesAsOpeningDetails(),
      },
      unitOwners: Array.from(engine.unitOwners.values()),
      vendors: Array.from(engine.vendors.values()),
      journals: [
        {
          date: new Date().toISOString().split('T')[0],
          description: '管理費・修繕積立金一括請求（サンプル）',
          details: [
            { accountCode: '1121', debitAmount: 500000 },
            { accountCode: '1122', debitAmount: 300000 },
            { accountCode: '4111', creditAmount: 500000 },
            { accountCode: '4211', creditAmount: 300000 },
          ],
        },
      ],
    }
    download('import-sample-comprehensive.json', JSON.stringify(payload, null, 2))
  }
  const exportBackupFormat = () => {
    const payload = engine.serialize()
    download('backup-format-sample.json', JSON.stringify(payload, null, 2))
  }

  const accounts = Array.from(engine.accounts.values())
    .filter(a => a.level >= 4)
    .sort((a, b) => a.code.localeCompare(b.code))

  return (
    <div className="card mt-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <strong>JSONインポート仕様</strong>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-primary" onClick={exportSimpleSample}>最小サンプル</button>
          <button className="btn btn-sm btn-primary" onClick={exportComprehensiveSample}>総合サンプル（期首/マスタ含む）</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={exportBackupFormat}>バックアップ形式サンプル</button>
        </div>
      </div>
      <div className="card-body">
        <h6>基本構造</h6>
        <pre className="bg-light p-2"><code>{`{
  "clearExisting": true,
  "journals": [
    {
      "date": "YYYY-MM-DD",
      "description": "摘要",
      "reference": "J001",
      "details": [
        { "accountCode": "1121", "debitAmount": 100000 },
        { "accountCode": "4111", "creditAmount": 100000 }
      ]
    }
  ],
  "unitOwners": [
    { "unitNumber": "101", "ownerName": "田中太郎", "floor": 1, "area": 70.5, "managementFee": 25000, "repairReserve": 15000 }
  ],
  "vendors": [
    { "vendorCode": "V001", "vendorName": "管理会社A", "category": "管理会社" }
  ],
  "openingBalances": {
    "date": "YYYY-04-01",
    "entries": [ { "accountCode": "1112", "debitAmount": 5000000 }, { "accountCode": "3111", "creditAmount": 5000000 } ]
  }
}`}</code></pre>

        <h6 className="mt-3">勘定科目コード一覧（レベル4以上）</h6>
        <div className="row">
          <div className="col-12">
            <div className="table-responsive">
              <table className="table table-sm table-striped">
                <thead>
                  <tr>
                    <th>コード</th>
                    <th>名称</th>
                    <th>種別</th>
                    <th>区分</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(a => (
                    <tr key={a.code}>
                      <td>{a.code}</td>
                      <td>{a.name}</td>
                      <td>{a.type}</td>
                      <td>{a.division ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="alert alert-info mt-3 mb-0">
          <strong>注意事項:</strong>
          <ul className="mb-0">
            <li>各仕訳は借方合計=貸方合計となる必要があります</li>
            <li>金額は0以上の数値で指定してください</li>
            <li>存在しない勘定科目コードを指定するとエラーになります</li>
            <li>日付は YYYY-MM-DD 形式です</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
