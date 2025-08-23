import React, { useState } from 'react';
import { AccountingEngine } from '../../domain/accountingEngine';
import { MainLayout } from '../layouts/MainLayout';
import { RouteManager } from './RouteManager';
import { ConfirmDialog } from '../common/ConfirmDialog';

/**
 * リファクタリング後のメインアプリケーションコンポーネント
 * 
 * 責任:
 * - AccountingEngineの初期化と管理
 * - ルート要素の提供
 * - グローバルな確認ダイアログの管理
 */
export const App: React.FC = () => {
  // AccountingEngineのインスタンス管理
  const [engine] = useState(() => new AccountingEngine());
  
  // 強制更新用のstate（段階的に削除予定）
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick((x) => x + 1);

  // 確認ダイアログの状態管理（将来的にZustandへ移行予定）
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  return (
    <MainLayout>
      <RouteManager 
        engine={engine} 
        onUpdate={forceUpdate}
      />
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        isDangerous={confirmDialog.isDangerous}
      />
    </MainLayout>
  );
};