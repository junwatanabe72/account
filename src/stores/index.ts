import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { createAccountingSlice } from "./slices/core/accountingSlice";
import { createBankAccountSlice } from "./slices/auxiliary/bankAccountSlice";
import { createTransactionSlice } from "./slices/transaction/transactionSlice";
import { createJournalSlice } from "./slices/journal/journalSlice";
import { createEnhancedJournalSlice } from "./slices/journal/journalSliceEnhanced";
import { createEnhancedTransactionSlice } from "./slices/transaction/transactionSliceEnhanced";
import { createEnhancedAuxiliarySlice } from "./slices/auxiliary/auxiliarySliceEnhanced";
import { createUISlice } from "./slices/ui/uiSlice";
import { createUnifiedJournalSlice } from "./slices/journal/unifiedJournalSlice";
import { createPaymentSlice } from "./slices/payment/paymentSlice";
import { StoreState } from "./types";

// メインストアの作成
const useStore = create<StoreState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get, api) => ({
          // 各スライスを結合
          ...createUISlice(set, get, api),
          ...createAccountingSlice(set, get, api),
          ...createBankAccountSlice(set, get, api),
          ...createTransactionSlice(set, get, api),
          ...createJournalSlice(set, get, api),
          ...createEnhancedJournalSlice(set, get, api),
          ...createEnhancedTransactionSlice(set, get, api),
          ...createEnhancedAuxiliarySlice(set, get, api),
          ...createUnifiedJournalSlice(set, get, api),
          ...createPaymentSlice(set, get, api),

          // グローバルアクション
          reset: () => {
            // 各サービスをリセット
            get().resetEngine();

            set({
              // UI状態をリセット
              isLoading: false,
              error: null,
              toastMessage: null,

              // 各状態をリセット
              bankAccounts: [],
              transactions: [],
              journals: [],
              selectedTransaction: null,
              selectedJournal: null,
              filterCriteria: {},
              syncResult: null,
            });

            console.log("Store reset");
          },

          // 初期化アクション
          initializeAll: async () => {
            set({ isLoading: true });

            try {
              // エンジンを初期化
              get().initializeEngine();

              // 各サービスを初期化
              get().initializeBankAccounts();
              get().initializeTransactions();
              get().loadJournals();

              set({
                isLoading: false,
                error: null,
              });

              console.log("All services initialized");
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Initialization failed";
              set({
                isLoading: false,
                error: errorMessage,
              });
              console.error("Initialization error:", error);
            }
          },
        }),
        {
          name: "accounting-storage",
          version: 1,
          // 永続化する項目を選択（大きなオブジェクトは除外）
          partialize: (state) => ({
            // UIの設定のみ永続化
            filterCriteria: state.filterCriteria,
            // その他必要に応じて追加
          }),
          // マイグレーション処理
          migrate: (persistedState: any, version: number) => {
            if (version === 0) {
              // v0 -> v1のマイグレーション
              return persistedState;
            }
            return persistedState;
          },
        }
      )
    ),
    {
      name: "AccountingStore",
      trace: true,
    }
  )
);

// セレクター（よく使う派生状態）
export const useActiveAccounts = () =>
  useStore((state) => state.bankAccounts.filter((acc) => acc.isActive));

export const useAccountByCode = (code: string) =>
  useStore((state) => state.bankAccounts.find((acc) => acc.code === code));

export const useFilteredJournals = () =>
  useStore((state) => {
    const { journals, filterCriteria } = state;

    if (!filterCriteria || Object.keys(filterCriteria).length === 0) {
      return journals;
    }

    return journals.filter((j) => {
      if (filterCriteria.status && j.status !== filterCriteria.status)
        return false;
      if (filterCriteria.dateFrom && j.date < filterCriteria.dateFrom)
        return false;
      if (filterCriteria.dateTo && j.date > filterCriteria.dateTo) return false;
      if (filterCriteria.textQuery) {
        const text = (j.description + " " + j.number).toLowerCase();
        if (!text.includes(filterCriteria.textQuery.toLowerCase()))
          return false;
      }
      return true;
    });
  });

export const useTrialBalance = () =>
  useStore((state) => state.engine?.getTrialBalance());

export const useIncomeStatement = () =>
  useStore((state) => state.engine?.getIncomeStatement());

export const useBalanceSheet = () =>
  useStore((state) => state.engine?.getBalanceSheet());

export default useStore;
