# 05-ui - UIコンポーネント層

## 概要
ユーザーインターフェースを構成するReactコンポーネントです。
表示とユーザー操作のみを担当し、ビジネスロジックは含みません。

## ディレクトリ構成

### components/
再利用可能なUIコンポーネント
- forms/: フォーム部品（入力、選択、ボタン等）
- tables/: テーブル部品（一覧表示、ソート、フィルタ等）
- common/: 共通部品（モーダル、トースト、ローディング等）

### pages/
ページレベルのコンポーネント
- JournalPage.tsx: 仕訳入力ページ
- ReportPage.tsx: 報告書ページ
- MasterPage.tsx: マスタ管理ページ

### hooks/
カスタムフック
- useJournal.ts: 仕訳操作用フック
- useReport.ts: 報告書用フック

## 設計原則

1. **表示に専念**: ビジネスロジックを含まない
2. **Store経由**: データ取得・更新はStore経由
3. **再利用可能**: 汎用的なコンポーネント設計
4. **関心の分離**: 見た目と振る舞いを分離

## 実装パターン

```typescript
/**
 * @fileoverview 仕訳入力フォームコンポーネント
 * @module JournalForm
 * @description
 * 仕訳データの入力UIを提供します。
 * バリデーションとデータ送信はStoreに委譲します。
 */

import { useJournalStore } from '@/04-stores';

export const JournalForm: React.FC = () => {
  const { createJournal, isLoading } = useJournalStore();
  
  const handleSubmit = async (data) => {
    // Storeのアクションを呼ぶだけ
    await createJournal(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* 純粋な表示ロジック */}
    </form>
  );
};
```

## スタイリング

- CSS Modules: コンポーネントスコープのスタイル
- Bootstrap: 基本的なUIフレームワーク
- カスタムCSS: 必要に応じて追加

## 禁止事項

- ビジネスロジックの実装
- 直接的なAPI呼び出し
- サービス層への直接アクセス
- グローバル状態の直接操作
- 複雑な計算処理