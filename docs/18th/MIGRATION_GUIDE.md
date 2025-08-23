# AppWithSidebar → App.tsx 移行ガイド

## 📋 移行チェックリスト

### Phase 1: 準備（完了）
- [x] 新コンポーネント作成
- [x] Zustandストア作成
- [x] CSS Modules設定
- [x] main.tsxの更新

### Phase 2: 検証（実施中）
- [x] ビルド確認
- [x] 開発サーバー起動確認
- [ ] 各メニュー項目の動作確認
- [ ] レスポンシブ動作確認
- [ ] テーマ切り替え確認

### Phase 3: 最適化
- [ ] forceUpdateパターンの削除
- [ ] AccountingEngineのグローバル化
- [ ] 不要な再レンダリング削減
- [ ] パフォーマンス測定

### Phase 4: クリーンアップ
- [ ] AppWithSidebar.tsxの削除
- [ ] 旧Sidebar.cssの削除
- [ ] 未使用インポートの削除

## 🔍 動作確認項目

### 基本機能
| 機能 | 確認事項 | ステータス |
|------|---------|----------|
| サイドバー開閉 | デスクトップでの開閉動作 | ⏳ |
| モバイルメニュー | モバイルでのメニュー表示 | ⏳ |
| メニュー選択 | 各メニュー項目のクリック | ⏳ |
| ルーティング | 正しいコンポーネント表示 | ⏳ |
| テーマ切り替え | ダーク/ライトモード | ⏳ |

### 各画面の動作
| メニュー | コンポーネント | 動作確認 |
|---------|--------------|----------|
| かんたん入力 | FreeeStyleJournalForm | ⏳ |
| 銀行明細インポート | BankImportWizard | ⏳ |
| 補助元帳 | AuxiliaryLedgerView | ⏳ |
| 収入明細表 | IncomeDetailView | ⏳ |
| 支出明細表 | ExpenseDetailView | ⏳ |
| 収支報告書 | IncomeExpenseReport | ⏳ |
| 試算表/PL/BS | DivisionStatementsPanel | ⏳ |
| 科目マスタ | ChartOfAccountsPanel | ⏳ |
| 口座管理 | BankAccountPanel | ⏳ |
| 設定・期首 | SettingsPanel | ⏳ |
| 期末処理 | ClosingPanel | ⏳ |
| サンプルデータ | SampleDataPanel | ⏳ |
| バックアップ/CSV | ExportPanel | ⏳ |
| JSON仕様 | JsonSpecView | ⏳ |
| Phase14テスト | PaymentTestPanel | ⏳ |
| マニュアル | ManualView | ⏳ |

## 🐛 既知の問題と対応

### 1. window.innerWidth直接参照
**問題**: SSR非対応、リサイズイベント未対応
**対応策**:
```typescript
// カスタムフック作成
export const useWindowSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return size;
};
```

### 2. forceUpdateパターン
**問題**: 不要な再レンダリング
**対応策**:
```typescript
// Zustandストアへ移行
const useAccountingStore = create((set) => ({
  engine: new AccountingEngine(),
  updateEngine: () => set((state) => ({ 
    engine: { ...state.engine } 
  })),
}));
```

### 3. alert使用
**問題**: UX改善の余地
**対応策**: Toast通知への移行

## 🚀 パフォーマンス最適化

### 測定項目
- [ ] 初期ロード時間
- [ ] サイドバー開閉のレスポンス
- [ ] メニュー切り替え速度
- [ ] メモリ使用量

### 最適化手法
1. **React.memo使用**
```typescript
export const Sidebar = React.memo(({ isOpen, onToggle }) => {
  // ...
});
```

2. **遅延ロード**
```typescript
const FreeeStyleJournalForm = lazy(() => 
  import('../transactions/FreeeStyleJournalForm')
);
```

3. **バンドル分割**
```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'zustand': ['zustand'],
        }
      }
    }
  }
};
```

## 📝 トラブルシューティング

### サイドバーが表示されない
1. CSS Modulesのインポート確認
2. navigationSliceの初期状態確認
3. MainLayoutのprops確認

### メニュークリックが反応しない
1. useNavigationStoreのインポート確認
2. setActiveMenuの呼び出し確認
3. RouteManagerのswitch文確認

### スタイルが適用されない
1. CSS Modulesのクラス名確認
2. classNameの記述確認
3. CSS変数の定義確認

## 📊 移行後の効果測定

### コード品質
- [ ] 行数削減率
- [ ] 複雑度削減
- [ ] 型カバレッジ向上

### 開発効率
- [ ] ビルド時間
- [ ] ホットリロード速度
- [ ] デバッグのしやすさ

### ユーザー体験
- [ ] ページ遷移速度
- [ ] レスポンシブ動作
- [ ] アクセシビリティ

## 🔄 ロールバック手順

問題が発生した場合:

1. **main.tsxを元に戻す**
```typescript
// import { App } from './ui/app/App'
import { App } from './ui/app/AppWithSidebar'
```

2. **ビルド確認**
```bash
npm run build
```

3. **動作確認**

## 📅 完全移行スケジュール

| 日付 | タスク | 担当 |
|------|-------|------|
| 8/23 | 新実装作成 | ✅ |
| 8/26 | 動作検証 | ⏳ |
| 8/27 | パフォーマンス測定 | ⏳ |
| 8/28 | 最適化実施 | ⏳ |
| 8/29 | 本番適用 | ⏳ |
| 8/30 | 旧コード削除 | ⏳ |

---

*最終更新: 2025年8月23日*