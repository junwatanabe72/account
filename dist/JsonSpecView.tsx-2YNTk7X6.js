import{j as e}from"./assets/index-DNcHv8Gn.js";import"./chunk-DJ1oPbzn.js";import"./chunk-B6LuprgX.js";function i(n,r,c="application/json"){const o=new Blob([r],{type:c+";charset=utf-8"}),s=URL.createObjectURL(o),t=document.createElement("a");t.href=s,t.download=n,document.body.appendChild(t),t.click(),t.remove(),URL.revokeObjectURL(s)}const u=({engine:n})=>{const r=()=>{const t={clearExisting:!0,journals:[{date:new Date().toISOString().split("T")[0],description:"管理費請求（サンプル）",details:[{accountCode:"1121",debitAmount:5e5},{accountCode:"4111",creditAmount:5e5}]}]};i("import-sample-min.json",JSON.stringify(t,null,2))},c=()=>{const t={clearExisting:!0,openingBalances:{date:new Date().toISOString().split("T")[0],entries:n.exportCurrentBalancesAsOpeningDetails()},unitOwners:Array.from(n.unitOwners.values()),vendors:Array.from(n.vendors.values()),journals:[{date:new Date().toISOString().split("T")[0],description:"管理費・修繕積立金一括請求（サンプル）",details:[{accountCode:"1121",debitAmount:5e5},{accountCode:"1122",debitAmount:3e5},{accountCode:"4111",creditAmount:5e5},{accountCode:"4211",creditAmount:3e5}]}]};i("import-sample-comprehensive.json",JSON.stringify(t,null,2))},o=()=>{const t=n.serialize();i("backup-format-sample.json",JSON.stringify(t,null,2))},s=Array.from(n.accounts.values()).filter(t=>t.level>=4).sort((t,a)=>t.code.localeCompare(a.code));return e.jsxs("div",{className:"card mt-3",children:[e.jsxs("div",{className:"card-header d-flex justify-content-between align-items-center",children:[e.jsx("strong",{children:"JSONインポート仕様"}),e.jsxs("div",{className:"d-flex gap-2",children:[e.jsx("button",{className:"btn btn-sm btn-primary",onClick:r,children:"最小サンプル"}),e.jsx("button",{className:"btn btn-sm btn-primary",onClick:c,children:"総合サンプル（期首/マスタ含む）"}),e.jsx("button",{className:"btn btn-sm btn-outline-secondary",onClick:o,children:"バックアップ形式サンプル"})]})]}),e.jsxs("div",{className:"card-body",children:[e.jsx("h6",{children:"基本構造"}),e.jsx("pre",{className:"bg-light p-2",children:e.jsx("code",{children:`{
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
}`})}),e.jsx("h6",{className:"mt-3",children:"勘定科目コード一覧（レベル4以上）"}),e.jsx("div",{className:"row",children:e.jsx("div",{className:"col-12",children:e.jsx("div",{className:"table-responsive",children:e.jsxs("table",{className:"table table-sm table-striped",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"コード"}),e.jsx("th",{children:"名称"}),e.jsx("th",{children:"種別"}),e.jsx("th",{children:"区分"})]})}),e.jsx("tbody",{children:s.map(t=>e.jsxs("tr",{children:[e.jsx("td",{children:t.code}),e.jsx("td",{children:t.name}),e.jsx("td",{children:t.type}),e.jsx("td",{children:t.division??"-"})]},t.code))})]})})})}),e.jsxs("div",{className:"alert alert-info mt-3 mb-0",children:[e.jsx("strong",{children:"注意事項:"}),e.jsxs("ul",{className:"mb-0",children:[e.jsx("li",{children:"各仕訳は借方合計=貸方合計となる必要があります"}),e.jsx("li",{children:"金額は0以上の数値で指定してください"}),e.jsx("li",{children:"存在しない勘定科目コードを指定するとエラーになります"}),e.jsx("li",{children:"日付は YYYY-MM-DD 形式です"})]})]})]})]})};export{u as JsonSpecView};
