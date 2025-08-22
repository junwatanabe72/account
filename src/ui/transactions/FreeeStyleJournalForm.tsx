import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  incomeCategories,
  expenseCategories,
  transferCategories,
  searchAccounts,
  getFrequentAccounts,
  isAccountAvailableForDivision,
  AccountItem,
  AccountCategory,
} from "./accountCategories";
import {
  defaultBankAccounts,
  BankAccount,
  getTransferableCombinations,
} from "../../data/bankAccounts";
import { AccountingEngine } from '../../domain/accountingEngine';
import "./FreeeStyleJournalForm.css";

interface JournalEntry {
  id?: string;
  date: string;
  description: string;
  details: JournalDetail[];
  division: "KANRI" | "SHUZEN" | "PARKING" | "OTHER";
  serviceMonth?: string;
  payerId?: string;
  tags?: string[];
}

interface JournalDetail {
  accountCode: string;
  accountName?: string;
  debitAmount: number;
  creditAmount: number;
  serviceMonth?: string;
  payerId?: string;
}

interface FreeeStyleJournalFormProps {
  engine?: AccountingEngine; // 型安全なAccountingEngine
  onChange?: () => void;
  onSubmit?: (entry: JournalEntry) => void;
}

const FreeeStyleJournalForm: React.FC<FreeeStyleJournalFormProps> = ({
  engine,
  onChange,
  onSubmit,
}) => {
  const [transactionType, setTransactionType] = useState<
    "income" | "expense" | "transfer"
  >("expense");
  const [division, setDivision] = useState<"KANRI" | "SHUZEN" | "PARKING" | "OTHER">("KANRI");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(
    null
  );
  const [accountSearchQuery, setAccountSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [serviceMonth, setServiceMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [payerId, setPayerId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentAccount, setPaymentAccount] = useState<
    "cash" | "kanri_bank" | "shuzen_bank"
  >("kanri_bank");
  const [paymentStatus, setPaymentStatus] = useState<"completed" | "pending">(
    "completed"
  );
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [validationMessage, setValidationMessage] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // 振替用の状態
  const [transferFromAccount, setTransferFromAccount] = useState<string>("");
  const [transferToAccount, setTransferToAccount] = useState<string>("");

  // 現在のカテゴリー
  const currentCategories = useMemo(() => {
    switch (transactionType) {
      case "income":
        return incomeCategories;
      case "expense":
        return expenseCategories;
      case "transfer":
        return transferCategories;
      default:
        return expenseCategories;
    }
  }, [transactionType]);

  // よく使う勘定科目（会計区分でフィルタリング）
  const frequentAccounts = useMemo(() => {
    return getFrequentAccounts(transactionType, division, 5);
  }, [transactionType, division]);

  // 決済口座のオプション（会計区分に応じて変更）
  const paymentAccountOptions = useMemo(() => {
    if (division === "KANRI") {
      return [
        { value: "cash", label: "現金", code: "1101" },
        { value: "kanri_bank", label: "普通預金（管理）", code: "1102" },
      ];
    } else {
      return [
        { value: "shuzen_bank", label: "普通預金（修繕）", code: "1103" },
        {
          value: "kanri_bank",
          label: "普通預金（管理）から振替",
          code: "1102",
        },
      ];
    }
  }, [division]);

  // 決済口座コードの取得
  const getPaymentAccountCode = () => {
    const account = paymentAccountOptions.find(
      (opt) => opt.value === paymentAccount
    );
    return account ? account.code : division === "KANRI" ? "1102" : "1103";
  };

  // 会計区分変更時に決済口座を適切に設定
  useEffect(() => {
    if (division === "KANRI" && paymentAccount === "shuzen_bank") {
      setPaymentAccount("kanri_bank");
    } else if (division === "SHUZEN" && paymentAccount === "cash") {
      setPaymentAccount("shuzen_bank");
    }
  }, [division]);

  // 振替可能な口座リスト
  const transferAccounts = useMemo(() => {
    return defaultBankAccounts.filter((acc) => acc.isActive);
  }, []);

  // 振替先口座の選択肢（振替元が選択されている場合のみ）
  const availableToAccounts = useMemo(() => {
    if (!transferFromAccount) return [];
    const fromAccount = defaultBankAccounts.find(
      (acc) => acc.id === transferFromAccount
    );
    if (!fromAccount) return [];

    return transferAccounts.filter((acc) => {
      if (acc.id === transferFromAccount) return false; // 同じ口座は除外

      // 振替可能なパターンをチェック
      if (fromAccount.division === "KANRI" && acc.division === "SHUZEN")
        return true;
      if (fromAccount.division === "SHUZEN" && acc.division === "KANRI")
        return true;
      if (fromAccount.division === acc.division) return true;

      return false;
    });
  }, [transferFromAccount, transferAccounts]);

  // 検索結果（会計区分でフィルタリング）
  const searchResults = useMemo(() => {
    if (!accountSearchQuery || accountSearchQuery.length < 1) return [];
    return searchAccounts(accountSearchQuery, transactionType, division);
  }, [accountSearchQuery, transactionType, division]);

  // 勘定科目選択
  const handleAccountSelect = useCallback((account: AccountItem) => {
    setSelectedAccount(account);
    setAccountSearchQuery(account.label);
    setShowSuggestions(false);
    setErrors((prev) => ({ ...prev, accountCode: "" }));
  }, []);

  // タグの追加
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // タグの削除
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (transactionType === "transfer") {
      // 振替の場合のバリデーション
      if (!transferFromAccount) {
        newErrors.transferFrom = "振替元口座を選択してください";
      }
      if (!transferToAccount) {
        newErrors.transferTo = "振替先口座を選択してください";
      }
    } else {
      // 収入・支出の場合のバリデーション
      if (!selectedAccount) {
        newErrors.accountCode = "勘定科目を選択してください";
      }
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "金額を入力してください";
    }
    if (!date) {
      newErrors.date = "日付を入力してください";
    }
    if (!description.trim()) {
      newErrors.description = "摘要を入力してください";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setValidationMessage({
        type: "error",
        message: "必須項目を入力してください",
      });
      return false;
    }

    setValidationMessage({ type: "success", message: "登録可能です" });
    return true;
  };

  // 未収金科目の取得
  const getReceivableAccountCode = (incomeAccountCode: string): string => {
    // 収入科目コードに基づいて未収金科目を決定
    if (incomeAccountCode.startsWith("51")) {
      return "1301"; // 管理費未収金
    } else if (incomeAccountCode.startsWith("52")) {
      return "1302"; // 修繕積立金未収金
    } else if (incomeAccountCode.startsWith("53")) {
      return "1303"; // 使用料未収金
    } else {
      return "1301"; // デフォルトは管理費未収金
    }
  };

  // 未収金科目名の取得
  const getReceivableAccountName = (accountCode: string): string => {
    switch (accountCode) {
      case "1301":
        return "管理費未収金";
      case "1302":
        return "修繕積立金未収金";
      case "1303":
        return "使用料未収金";
      default:
        return "未収金";
    }
  };

  // 仕訳プレビューの生成
  const generateJournalPreview = () => {
    if (transactionType === "transfer") {
      // 振替の場合
      if (!transferFromAccount || !transferToAccount || !amount) return null;

      const fromAccount = defaultBankAccounts.find(
        (acc) => acc.id === transferFromAccount
      );
      const toAccount = defaultBankAccounts.find(
        (acc) => acc.id === transferToAccount
      );
      if (!fromAccount || !toAccount) return null;

      const numAmount = parseFloat(amount) || 0;
      const preview: JournalEntry = {
        date,
        description,
        division,  // ユーザーが選択した区分を使用
        tags: tags.length > 0 ? tags : undefined,
        details: [
          {
            accountCode: toAccount.code,
            accountName: toAccount.name,
            debitAmount: numAmount,
            creditAmount: 0,
          },
          {
            accountCode: fromAccount.code,
            accountName: fromAccount.name,
            debitAmount: 0,
            creditAmount: numAmount,
          },
        ],
      };
      return preview;
    } else {
      // 収入・支出の場合
      if (!selectedAccount || !amount) return null;

      const numAmount = parseFloat(amount) || 0;
      const preview: JournalEntry = {
        date,
        description,
        division,
        serviceMonth:
          transactionType !== "transfer" ? `${serviceMonth}-01` : undefined,
        payerId: transactionType === "income" ? payerId : undefined,
        tags: tags.length > 0 ? tags : undefined,
        details: [],
      };

      const paymentCode = getPaymentAccountCode();

      if (transactionType === "income") {
        if (paymentStatus === "pending") {
          // 未決済の場合：未収金を計上
          const receivableCode = getReceivableAccountCode(selectedAccount.code);
          const receivableName = getReceivableAccountName(receivableCode);
          preview.details = [
            {
              accountCode: receivableCode,
              accountName: receivableName,
              debitAmount: numAmount,
              creditAmount: 0,
            },
            {
              accountCode: selectedAccount.code,
              accountName: selectedAccount.label,
              debitAmount: 0,
              creditAmount: numAmount,
              serviceMonth: `${serviceMonth}-01`,
              payerId,
            },
          ];
        } else {
          // 決済済みの場合：通常の仕訳
          preview.details = [
            {
              accountCode: paymentCode,
              accountName: paymentAccountOptions.find(
                (opt) => opt.code === paymentCode
              )?.label,
              debitAmount: numAmount,
              creditAmount: 0,
            },
            {
              accountCode: selectedAccount.code,
              accountName: selectedAccount.label,
              debitAmount: 0,
              creditAmount: numAmount,
              serviceMonth: `${serviceMonth}-01`,
              payerId,
            },
          ];
        }
      } else if (transactionType === "expense") {
        if (paymentStatus === "pending") {
          // 未決済の場合：未払金を計上
          preview.details = [
            {
              accountCode: selectedAccount.code,
              accountName: selectedAccount.label,
              debitAmount: numAmount,
              creditAmount: 0,
              serviceMonth: `${serviceMonth}-01`,
            },
            {
              accountCode: "2101",
              accountName: "未払金",
              debitAmount: 0,
              creditAmount: numAmount,
            },
          ];
        } else {
          // 決済済みの場合：通常の仕訳
          preview.details = [
            {
              accountCode: selectedAccount.code,
              accountName: selectedAccount.label,
              debitAmount: numAmount,
              creditAmount: 0,
              serviceMonth: `${serviceMonth}-01`,
            },
            {
              accountCode: paymentCode,
              accountName: paymentAccountOptions.find(
                (opt) => opt.code === paymentCode
              )?.label,
              debitAmount: 0,
              creditAmount: numAmount,
            },
          ];
        }
      }

      return preview;
    }
  };

  // フォーム送信
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const journalEntry = generateJournalPreview();
    if (!journalEntry) return;

    // JSON形式をコンソールに出力
    console.log("=== 仕訳データ (JSON) ===");
    console.log(JSON.stringify(journalEntry, null, 2));
    console.log("=========================");

    // タグを追加
    journalEntry.tags = tags.length > 0 ? tags : undefined;

    // 既存のエンジンに追加
    if (engine) {
      try {
        const result = engine.createJournal({
          date,
          description,
          details: journalEntry.details,
          division,
        });

        if (result.success) {
          if (onChange) onChange();

          // フォームをリセット
          setAmount("");
          setDescription("");
          setSelectedAccount(null);
          setAccountSearchQuery("");
          setPayerId("");
          setTags([]);
          setTagInput("");
          setValidationMessage({
            type: "success",
            message: "仕訳を登録しました",
          });

          setTimeout(() => {
            setValidationMessage(null);
          }, 3000);
        } else {
          const errorMessage =
            result.errors?.join(", ") || "エラーが発生しました";
          setValidationMessage({ type: "error", message: errorMessage });
        }
      } catch (error) {
        setValidationMessage({ type: "error", message: `エラー: ${error}` });
      }
    }

    // 新しいコールバック
    if (onSubmit) {
      onSubmit(journalEntry);
    }
  };

  return (
    <div className="freee-journal-form">
      {/* ヘッダー部分 */}
      <div className="form-header">
        <h2>📝 かんたん仕訳入力</h2>
        {transactionType !== "transfer" && (
          <div className="division-toggle">
            <button
              className={`division-btn ${division === "KANRI" ? "active" : ""}`}
              onClick={() => {
                if (division !== "KANRI") {
                  // 会計区分を変更時に入力をリセット
                  setDivision("KANRI");
                  setAmount("");
                  setDescription("");
                  setSelectedAccount(null);
                  setAccountSearchQuery("");
                  setPayerId("");
                  setTags([]);
                  setTagInput("");
                  setPaymentAccount("kanri_bank"); // 管理口座をデフォルトに
                  setErrors({});
                  setValidationMessage({
                    type: "info",
                    message:
                      "管理会計に切り替えました。入力がリセットされました。",
                  });
                  setTimeout(() => setValidationMessage(null), 2000);
                }
              }}
            >
              管理会計
            </button>
            <button
              className={`division-btn ${
                division === "SHUZEN" ? "active" : ""
              }`}
              onClick={() => {
                if (division !== "SHUZEN") {
                  // 会計区分を変更時に入力をリセット
                  setDivision("SHUZEN");
                  setAmount("");
                  setDescription("");
                  setSelectedAccount(null);
                  setAccountSearchQuery("");
                  setPayerId("");
                  setTags([]);
                  setTagInput("");
                  setPaymentAccount("shuzen_bank"); // 修繕口座をデフォルトに
                  setErrors({});
                  setValidationMessage({
                    type: "info",
                    message:
                      "修繕会計に切り替えました。入力がリセットされました。",
                  });
                  setTimeout(() => setValidationMessage(null), 2000);
                }
              }}
            >
              修繕会計
            </button>
            <button
              className={`division-btn ${
                division === "PARKING" ? "active" : ""
              }`}
              onClick={() => {
                if (division !== "PARKING") {
                  // 会計区分を変更時に入力をリセット
                  setDivision("PARKING");
                  setAmount("");
                  setDescription("");
                  setSelectedAccount(null);
                  setAccountSearchQuery("");
                  setPayerId("");
                  setTags([]);
                  setTagInput("");
                  setPaymentAccount("kanri_bank"); // デフォルト口座
                  setErrors({});
                  setValidationMessage({
                    type: "info",
                    message:
                      "駐車場会計に切り替えました。入力がリセットされました。",
                  });
                  setTimeout(() => setValidationMessage(null), 2000);
                }
              }}
            >
              駐車場会計
            </button>
            <button
              className={`division-btn ${
                division === "OTHER" ? "active" : ""
              }`}
              onClick={() => {
                if (division !== "OTHER") {
                  // 会計区分を変更時に入力をリセット
                  setDivision("OTHER");
                  setAmount("");
                  setDescription("");
                  setSelectedAccount(null);
                  setAccountSearchQuery("");
                  setPayerId("");
                  setTags([]);
                  setTagInput("");
                  setPaymentAccount("kanri_bank"); // デフォルト口座
                  setErrors({});
                  setValidationMessage({
                    type: "info",
                    message:
                      "その他特別会計に切り替えました。入力がリセットされました。",
                  });
                  setTimeout(() => setValidationMessage(null), 2000);
                }
              }}
            >
              その他特別会計
            </button>
          </div>
        )}
      </div>

      {/* 取引タイプタブ */}
      <div className="transaction-tabs">
        <button
          className={`tab-btn ${
            transactionType === "income" ? "active income" : ""
          }`}
          onClick={() => {
            setTransactionType("income");
            setSelectedAccount(null);
            setAccountSearchQuery("");
            setTransferFromAccount("");
            setTransferToAccount("");
          }}
        >
          <span className="tab-icon">💰</span>
          収入
        </button>
        <button
          className={`tab-btn ${
            transactionType === "expense" ? "active expense" : ""
          }`}
          onClick={() => {
            setTransactionType("expense");
            setSelectedAccount(null);
            setAccountSearchQuery("");
            setTransferFromAccount("");
            setTransferToAccount("");
          }}
        >
          <span className="tab-icon">💸</span>
          支出
        </button>
        <button
          className={`tab-btn ${
            transactionType === "transfer" ? "active transfer" : ""
          }`}
          onClick={() => {
            setTransactionType("transfer");
            setSelectedAccount(null);
            setAccountSearchQuery("");
            setTransferFromAccount("");
            setTransferToAccount("");
          }}
        >
          <span className="tab-icon">🔄</span>
          振替
        </button>
      </div>

      <form onSubmit={handleSubmit} className="journal-form">
        {/* 日付入力 */}
        <div className="form-group">
          <label>
            取引日 <span className="required">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={errors.date ? "error" : ""}
          />
          {errors.date && <span className="error-message">{errors.date}</span>}
        </div>

        {/* 振替元・振替先口座選択（振替タブの場合） */}
        {transactionType === "transfer" ? (
          <>
            <div className="form-group">
              <label>
                振替元口座 <span className="required">*</span>
              </label>
              <select
                value={transferFromAccount}
                onChange={(e) => {
                  setTransferFromAccount(e.target.value);
                  setTransferToAccount(""); // 振替元を変更したら振替先をリセット
                  setErrors((prev) => ({ ...prev, transferFrom: "" }));
                }}
                className={`form-select ${errors.transferFrom ? "error" : ""}`}
              >
                <option value="">口座を選択してください</option>
                {transferAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}{" "}
                    {account.bankName ? `(${account.bankName})` : ""}
                  </option>
                ))}
              </select>
              {errors.transferFrom && (
                <span className="error-message">{errors.transferFrom}</span>
              )}
            </div>

            <div className="form-group">
              <label>
                振替先口座 <span className="required">*</span>
              </label>
              <select
                value={transferToAccount}
                onChange={(e) => {
                  setTransferToAccount(e.target.value);
                  setErrors((prev) => ({ ...prev, transferTo: "" }));
                }}
                className={`form-select ${errors.transferTo ? "error" : ""}`}
                disabled={!transferFromAccount}
              >
                <option value="">
                  {transferFromAccount
                    ? "口座を選択してください"
                    : "まず振替元を選択してください"}
                </option>
                {availableToAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}{" "}
                    {account.bankName ? `(${account.bankName})` : ""}
                  </option>
                ))}
              </select>
              {errors.transferTo && (
                <span className="error-message">{errors.transferTo}</span>
              )}
            </div>
          </>
        ) : (
          /* 勘定科目選択（収入・支出タブの場合） */
          <div className="form-group">
            <label>
              勘定科目 <span className="required">*</span>
            </label>
            <div className="account-search-wrapper">
              <input
                type="text"
                value={accountSearchQuery}
                onChange={(e) => {
                  setAccountSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={`${
                  transactionType === "income" ? "収入" : "支出"
                }科目を検索...`}
                className={errors.accountCode ? "error" : ""}
              />
              <button
                type="button"
                className="category-btn"
                onClick={() => setShowAccountModal(true)}
                title="カテゴリーから選択"
              >
                📁
              </button>
            </div>

            {/* 検索サジェスト */}
            {showSuggestions && searchResults.length > 0 && (
              <div className="suggestions-dropdown">
                {searchResults.slice(0, 5).map((account) => (
                  <div
                    key={account.code}
                    className="suggestion-item"
                    onClick={() => handleAccountSelect(account)}
                  >
                    <span className="suggestion-label">{account.label}</span>
                    <span className="suggestion-code">{account.code}</span>
                  </div>
                ))}
              </div>
            )}

            {/* よく使う項目 */}
            {!accountSearchQuery && frequentAccounts.length > 0 && (
              <div className="frequent-accounts">
                <div className="frequent-label">
                  よく使う項目（{division === "KANRI" ? "管理会計" : "修繕会計"}
                  ）
                </div>
                <div className="frequent-buttons">
                  {frequentAccounts.map((account) => (
                    <button
                      key={account.code}
                      type="button"
                      className="frequent-btn"
                      onClick={() => handleAccountSelect(account)}
                      title={account.label}
                    >
                      {account.shortLabel || account.label}
                      {account.divisions?.includes("BOTH") && " ⚡"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {errors.accountCode && (
              <span className="error-message">{errors.accountCode}</span>
            )}
          </div>
        )}

        {/* 金額入力 */}
        <div className="form-group">
          <label>
            金額 <span className="required">*</span>
          </label>
          <div className="amount-input">
            <span className="currency">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="1"
              className={errors.amount ? "error" : ""}
            />
          </div>
          {errors.amount && (
            <span className="error-message">{errors.amount}</span>
          )}
        </div>

        {/* 対象月（収入・支出の場合） */}
        {transactionType !== "transfer" && (
          <div className="form-group">
            <label>対象月</label>
            <input
              type="month"
              value={serviceMonth}
              onChange={(e) => setServiceMonth(e.target.value)}
            />
          </div>
        )}

        {/* 支払者（収入の場合） */}
        {transactionType === "income" && (
          <div className="form-group">
            <label>支払者・部屋番号</label>
            <input
              type="text"
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              placeholder="例: 101号室"
            />
          </div>
        )}

        {/* 摘要 */}
        <div className="form-group">
          <label>
            摘要 <span className="required">*</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="取引の説明を入力"
            className={errors.description ? "error" : ""}
          />
          {errors.description && (
            <span className="error-message">{errors.description}</span>
          )}
        </div>

        {/* 決済口座（振替以外） */}
        {transactionType !== "transfer" && (
          <div className="form-group">
            <label>決済口座</label>
            <select
              value={paymentAccount}
              onChange={(e) => setPaymentAccount(e.target.value)}
              className="form-select"
            >
              {paymentAccountOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.code})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 決済ステータス（振替以外） */}
        {transactionType !== "transfer" && (
          <div className="form-group">
            <label>決済ステータス</label>
            <div className="payment-status-toggle">
              <button
                type="button"
                className={`status-btn ${
                  paymentStatus === "completed" ? "active" : ""
                }`}
                onClick={() => setPaymentStatus("completed")}
              >
                ✅ 完了
              </button>
              <button
                type="button"
                className={`status-btn ${
                  paymentStatus === "pending" ? "active" : ""
                }`}
                onClick={() => setPaymentStatus("pending")}
              >
                ⏳ 未決済
              </button>
            </div>
          </div>
        )}

        {/* タグ */}
        <div className="form-group">
          <label>タグ</label>
          <div className="tag-input-wrapper">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="タグを入力してEnterキー"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="add-tag-btn"
            >
              追加
            </button>
          </div>
          {tags.length > 0 && (
            <div className="tags-display">
              {tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 仕訳プレビュー */}
        {((transactionType === "transfer" &&
          transferFromAccount &&
          transferToAccount &&
          amount) ||
          (transactionType !== "transfer" && selectedAccount && amount)) && (
          <div className="journal-preview">
            <h4>
              📋 仕訳プレビュー
              {paymentStatus === "pending" && transactionType !== "transfer" && (
                <span className="preview-badge pending">未決済</span>
              )}
            </h4>
            <table className="preview-table">
              <thead>
                <tr>
                  <th>借方科目</th>
                  <th>借方金額</th>
                  <th>貸方科目</th>
                  <th>貸方金額</th>
                </tr>
              </thead>
              <tbody>
                {generateJournalPreview()?.details.map((detail, index) => (
                  <tr key={index}>
                    <td>
                      {detail.debitAmount > 0
                        ? `${detail.accountName || detail.accountCode}`
                        : "-"}
                    </td>
                    <td className="amount">
                      {detail.debitAmount > 0
                        ? `¥${detail.debitAmount.toLocaleString()}`
                        : "-"}
                    </td>
                    <td>
                      {detail.creditAmount > 0
                        ? `${detail.accountName || detail.accountCode}`
                        : "-"}
                    </td>
                    <td className="amount">
                      {detail.creditAmount > 0
                        ? `¥${detail.creditAmount.toLocaleString()}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paymentStatus === "pending" && transactionType !== "transfer" && (
              <div className="preview-note">
                <small>
                  {transactionType === "income" 
                    ? "※ 未決済のため、未収金を計上します" 
                    : "※ 未決済のため、未払金を計上します"}
                </small>
              </div>
            )}
          </div>
        )}

        {/* バリデーションメッセージ */}
        {validationMessage && (
          <div className={`validation-message ${validationMessage.type}`}>
            {validationMessage.type === "success" && "✅ "}
            {validationMessage.type === "error" && "❌ "}
            {validationMessage.type === "info" && "ℹ️ "}
            {validationMessage.message}
          </div>
        )}

        {/* 送信ボタン */}
        <div className="form-actions">
          <button type="submit" className="submit-btn">
            仕訳を登録
          </button>
        </div>
      </form>

      {/* カテゴリー選択モーダル */}
      {showAccountModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAccountModal(false)}
        >
          <div className="account-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>勘定科目を選択</h3>
              <button
                className="close-btn"
                onClick={() => setShowAccountModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              {currentCategories.map((category) => (
                <div key={category.id} className="category-section">
                  <h4 style={{ color: category.color }}>{category.label}</h4>
                  {category.description && (
                    <p className="category-desc">{category.description}</p>
                  )}
                  <div className="account-grid">
                    {category.accounts.map((account) => {
                      const isAvailable = isAccountAvailableForDivision(
                        account,
                        division
                      );
                      return (
                        <button
                          key={account.code}
                          className={`account-btn ${
                            !isAvailable ? "disabled" : ""
                          }`}
                          onClick={() => {
                            if (isAvailable) {
                              handleAccountSelect(account);
                              setShowAccountModal(false);
                            }
                          }}
                          disabled={!isAvailable}
                          title={
                            !isAvailable
                              ? `この科目は${
                                  division === "KANRI" ? "管理" : "修繕"
                                }会計では使用できません`
                              : ""
                          }
                        >
                          <span className="account-label">
                            {account.shortLabel || account.label}
                          </span>
                          <span className="account-code">{account.code}</span>
                          {account.divisions?.includes("BOTH") && (
                            <span
                              className="both-indicator"
                              title="両会計で使用可能"
                            >
                              ⚡
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreeeStyleJournalForm;
