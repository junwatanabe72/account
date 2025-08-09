import React from 'react'
import { AccountingEngine } from '../domain/accountingEngine'
import { useToast } from './Toast'

function buildUnitNumber(floor: number, indexOnFloor: number) {
  const room = String(indexOnFloor).padStart(2, '0')
  return `${floor}${room}`
}

export const SampleDataPanel: React.FC<{ engine: AccountingEngine, onChange: () => void }>
= ({ engine, onChange }) => {
  const toast = useToast()

  const generate = (count: number) => {
    // 分布: 最大10階まで、1フロアあたり均等
    const maxFloors = Math.min(10, Math.ceil(count / 50)) || 1
    const perFloor = Math.ceil(count / maxFloors)
    const owners = new Map<string, any>()
    let created = 0
    for (let f = 1; f <= maxFloors; f++) {
      for (let i = 1; i <= perFloor && created < count; i++) {
        const unit = buildUnitNumber(f, i)
        const area = 55 + ((created % 10) * 3) // 55〜82
        // スケール別の料金設定
        const managementFee = count <= 50 ? 25000 : count <= 200 ? 22000 : 20000
        const repairReserve = count <= 50 ? 15000 : count <= 200 ? 13000 : 12000
        owners.set(unit, {
          unitNumber: unit,
          ownerName: `入居者${String(created + 1).padStart(3, '0')}`,
          floor: f,
          area,
          managementFee,
          repairReserve,
          contact: '',
          bankAccount: '',
          isActive: true,
        })
        created++
      }
    }
    engine.unitOwners = owners
    engine.rebuildAuxiliaryAccounts()
    onChange()
    toast.show(`${count}戸のサンプル組合員を作成しました`,'success')
  }

  const generateAndBill = (count: number) => {
    generate(count)
    // generate()は非同期ではないが、補助再構築→月次請求の順を確実にするためsetTimeoutで次ティックに実行
    setTimeout(() => {
      // 事前チェック（合計）
      let totalMF = 0, totalRR = 0, activeCount = 0
      engine.unitOwners.forEach((o: any) => { if (o.isActive) { activeCount++; totalMF += Number(o.managementFee)||0; totalRR += Number(o.repairReserve)||0 } })
      if (activeCount === 0 || (totalMF + totalRR) === 0) {
        toast.show('月次請求の作成に失敗しました: 有効な組合員または月額がありません','danger')
        return
      }
      const firstOfMonth = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` })()
      const res = engine.createMonthlyBilling(firstOfMonth)
      if ((res as any).success) {
        onChange()
        toast.show('月次請求仕訳を作成しました','success')
      } else {
        const msg = ((res as any).errors && (res as any).errors.join(', ')) || '原因不明のエラー'
        toast.show(`月次請求の作成に失敗しました: ${msg}`,'danger')
      }
    }, 0)
  }

  return (
    <div className="card mt-3">
      <div className="card-header"><strong>サンプルデータ生成</strong></div>
      <div className="card-body d-flex flex-wrap gap-2">
        <button className="btn btn-sm btn-outline-primary" onClick={() => generate(50)}>50戸（組合員のみ）</button>
        <button className="btn btn-sm btn-outline-primary" onClick={() => generate(200)}>200戸（組合員のみ）</button>
        <button className="btn btn-sm btn-outline-primary" onClick={() => generate(500)}>500戸（組合員のみ）</button>
        <span className="vr"/>
        <button className="btn btn-sm btn-primary" onClick={() => generateAndBill(50)}>50戸＋月次請求</button>
        <button className="btn btn-sm btn-primary" onClick={() => generateAndBill(200)}>200戸＋月次請求</button>
        <button className="btn btn-sm btn-primary" onClick={() => generateAndBill(500)}>500戸＋月次請求</button>
      </div>
      <div className="card-body pt-0 d-flex flex-wrap gap-2">
        <button className="btn btn-sm btn-warning" onClick={() => buildYearSample50()}>50戸・年間サンプル（期首〜12ヶ月・期末）</button>
        <small className="text-muted">注意: 既存の組合員情報は上書きされます。必要に応じてバックアップを取得してください。</small>
      </div>
    </div>
  )

  function fmt(y: number, m: number, d: number) {
    const mm = String(m).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return `${y}-${mm}-${dd}`
  }

  function addMonths(y: number, m: number, add: number) {
    const base = new Date(y, m - 1 + add, 1)
    return { y: base.getFullYear(), m: base.getMonth() + 1 }
  }

  function buildYearSample50() {
    if (!confirm('50戸・年間サンプルを作成します（期首残高、12ヶ月の請求・入金・費用、期末振替を自動生成）。既存データはクリアされます。実行しますか？')) return
    // 基準年度: 今年が4月以降なら当年度、そうでなければ前年4月開始
    const now = new Date()
    const startYear = (now.getMonth() + 1) >= 4 ? now.getFullYear() : now.getFullYear() - 1
    const endYear = startYear + 1

    // 初期化と50戸生成
    engine.clearAll()
    generate(50)

    // 期首残高（4/01）
    const opening = {
      date: fmt(startYear, 4, 1),
      entries: [
        { accountCode: '1112', debitAmount: 5_000_000 }, // 普通預金（管理費）
        { accountCode: '1113', debitAmount: 8_000_000 }, // 普通預金（修繕）
        { accountCode: '3111', creditAmount: 13_000_000 }, // 前期繰越
      ],
    }
    const obRes = engine.createOpeningBalance(opening.date, opening.entries as any)
    if (!(obRes as any).success) {
      toast.show('期首残高の作成に失敗しました','danger'); return
    }

    // 月次処理（請求→入金→費用）
    // 月額合計を事前算定
    let totalMF = 0, totalRR = 0
    engine.unitOwners.forEach((o: any) => { if (o.isActive) { totalMF += Number(o.managementFee)||0; totalRR += Number(o.repairReserve)||0 } })

    for (let k = 0; k < 12; k++) {
      const { y, m } = addMonths(startYear, 4, k)
      const billDate = fmt(y, m, 1)
      const recvDate = fmt(y, m, 5)
      const expDate1 = fmt(y, m, 10)
      const expDate2 = fmt(y, m, 20)

      // 請求（補助付与）
      const billRes = engine.createMonthlyBilling(billDate)
      if (!(billRes as any).success) { toast.show(`月次請求失敗: ${y}/${m}`,'danger'); return }

      // 入金（口座振替）
      if (totalMF > 0) {
        engine.createJournal({ date: recvDate, description: '管理費入金（口座振替）', details: [
          { accountCode: '1112', debitAmount: totalMF },
          { accountCode: '1121', creditAmount: totalMF },
        ] })
      }
      if (totalRR > 0) {
        engine.createJournal({ date: recvDate, description: '修繕積立金入金（口座振替）', details: [
          { accountCode: '1113', debitAmount: totalRR },
          { accountCode: '1122', creditAmount: totalRR },
        ] })
      }

      // 月次費用（管理費会計）
      engine.createJournal({ date: expDate1, description: '管理会社委託費支払い', details: [
        { accountCode: '5111', debitAmount: 500_000 },
        { accountCode: '1112', creditAmount: 500_000 },
      ] })
      engine.createJournal({ date: expDate1, description: '清掃費支払い', details: [
        { accountCode: '5121', debitAmount: 150_000 },
        { accountCode: '1112', creditAmount: 150_000 },
      ] })
      engine.createJournal({ date: expDate2, description: 'エレベーター保守費支払い', details: [
        { accountCode: '5123', debitAmount: 80_000 },
        { accountCode: '1112', creditAmount: 80_000 },
      ] })
      engine.createJournal({ date: expDate2, description: '共用部電気代支払い', details: [
        { accountCode: '5124', debitAmount: 45_000 },
        { accountCode: '1112', creditAmount: 45_000 },
      ] })

      // 修繕会計の大規模工事費（年2回）
      if (k === 5 || k === 10) {
        engine.createJournal({ date: expDate2, description: '大規模修繕工事費支払い', details: [
          { accountCode: '5211', debitAmount: 800_000 },
          { accountCode: '1113', creditAmount: 800_000 },
        ] })
      }
    }

    // 期末振替（3/31）
    const closingDate = fmt(endYear, 3, 31)
    engine.createClosingEntries(closingDate)

    onChange()
    toast.show('50戸・年間サンプルを作成しました','success')
  }
}
