# Phase 6: デッドコード削除と責務の明確化

**実施日**: 2025-01-18

## 作業内容

### 実施事項
- 未使用サービスファイルの削除（4個）
- src/servicesフォルダの削除（2ファイル）
- 各ファイルへの責務コメント追加
- ビジネスロジックドキュメント作成

### 削除ファイル
**domain/services/**
- AccountingServiceProvider.ts
- LLMJournalService.ts
- JournalPatternService.ts
- TransferService.ts

**src/services/**
- journalService.ts
- llmClient.ts

### 成果
- サービスファイル: 16個 → 12個（-25%）
- 不要コード: 約1,460行削除
- アーキテクチャの明確化
- ビジネスロジックの体系的文書化

### 主要ドキュメント
- `ARCHITECTURE_LAYERS.md` - レイヤー責務説明
- `SERVICES_ARCHITECTURE_COMPARISON.md` - サービス比較
- `DEAD_CODE_ANALYSIS.md` - デッドコード分析
- `../BUSINESS_LOGIC_DOCUMENTATION.md` - ビジネスロジック仕様書