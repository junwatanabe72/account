# Phase 2: サービス層の依存性改善計画

*作成日: 2025-01-18*  
*目的: サービス間の依存を抽象化し、テスタビリティと保守性を向上*

## 🎯 Phase 2の目標

1. **残りのコアサービスへのインタフェース適用**
   - JournalServiceへのIJournalService実装
   - DivisionServiceへのIDivisionService実装

2. **依存関係の抽象化**
   - 具象クラスへの依存をインタフェースへの依存に変更
   - 依存性注入パターンの段階的導入

3. **テストカバレッジの向上**
   - モック可能な構造への移行
   - 単体テストの追加

## 📋 実施タスク

### Task 2.1: JournalServiceのインタフェース実装
- [ ] JournalServiceにIJournalServiceを実装
- [ ] 内部実装の最適化
- [ ] テスト実行と動作確認
- [ ] コミット & プッシュ

### Task 2.2: DivisionServiceのインタフェース実装
- [ ] DivisionServiceにIDivisionServiceを実装
- [ ] 内部実装の最適化
- [ ] テスト実行と動作確認
- [ ] コミット & プッシュ

### Task 2.3: サービス間依存の抽象化（優先度順）

#### 2.3.1 JournalServiceの依存改善
```typescript
// 現在
constructor(
  private accountService: AccountService,
  private divisionService: DivisionService
)

// 改善後
constructor(
  private accountService: IAccountService,
  private divisionService: IDivisionService
)
```

#### 2.3.2 ReportServiceの依存改善
```typescript
// 現在
constructor(
  private accountService: AccountService,
  private journalService: JournalService,
  private divisionService: DivisionService
)

// 改善後
constructor(
  private accountService: IAccountService,
  private journalService: IJournalService,
  private divisionService: IDivisionService
)
```

#### 2.3.3 その他のサービス
- AuxiliaryService
- TransactionService
- ImportExportService
- ClosingService
- SampleDataService

### Task 2.4: AccountingEngineの改善
- [ ] 依存性注入コンテナの検討
- [ ] ファクトリーパターンの導入
- [ ] サービスプロバイダーの実装

## 🔄 実施手順（各タスク共通）

1. **現状確認**
   ```bash
   npm run test:run  # ベースラインの確認
   ```

2. **変更実施**
   - 小さな変更単位で実施
   - 古いコードはコメントで残す

3. **動作確認**
   ```bash
   npm run dev      # アプリ起動確認
   npm run test:run # テスト確認
   ```

4. **コミット**
   ```bash
   git add .
   git commit -m "refactor: [具体的な変更内容]"
   ```

5. **プッシュ**
   ```bash
   git push origin refactor/architecture-improvement
   ```

## ⚠️ 注意事項

1. **破壊的変更を避ける**
   - 既存のAPIは維持
   - 段階的な移行パス提供

2. **テスト駆動**
   - 変更前後でテストが通ることを確認
   - 新しいテストケースの追加

3. **ドキュメント更新**
   - 各変更をREFACTORING_LOG.mdに記録
   - 依存関係の変化をDEPENDENCY_ANALYSIS.mdに反映

## 📊 成功指標

- [ ] 全てのコアサービスがインタフェースを実装
- [ ] サービス間の直接依存が50%以上削減
- [ ] テストのモック化が可能
- [ ] 既存機能の動作維持

## 🚀 期待される効果

1. **テスタビリティ向上**
   - モックを使った単体テストが可能
   - 依存関係の分離によるテスト高速化

2. **保守性向上**
   - サービスの置き換えが容易
   - 影響範囲の限定

3. **拡張性向上**
   - 新しい実装の追加が容易
   - デコレーターパターンの適用可能

---

*次の更新: Task 2.1完了時*