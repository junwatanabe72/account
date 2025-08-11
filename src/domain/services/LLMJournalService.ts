// LLM連携による仕訳生成サービス

import { JournalPatternService, JournalPatternForLLM } from './JournalPatternService'
import { AccountService } from './AccountService'
import { AuxiliaryService } from './AuxiliaryService'
import { DivisionService } from './DivisionService'
import { StandardizedBankTransaction, JournalSuggestion } from '../../types/master'

// LLMプロンプト生成クラス
export class LLMPromptGenerator {
  constructor(
    private patternService: JournalPatternService,
    private accountService: AccountService,
    private auxiliaryService: AuxiliaryService,
    private divisionService: DivisionService
  ) {}

  // データ正規化用プロンプト生成
  generateNormalizationPrompt(rawData: string, hints?: {
    bankName?: string
    expectedFormat?: string
    dateRange?: string
  }): string {
    const systemPrompt = `
あなたは銀行取引明細を解析する専門家です。
以下のデータを分析し、標準JSON形式に変換してください。

【出力形式】
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:mm:ss",
      "description": "取引内容（原文を保持）",
      "amount": 数値（入金は正、出金は負）,
      "balance": 残高（分かる場合）,
      "category": "推定カテゴリ",
      "payee": "支払先/受取先",
      "referenceNumber": "取引番号",
      "notes": "補足情報",
      "confidence": 0-100（信頼度）
    }
  ],
  "metadata": {
    "bankName": "推定した銀行名",
    "accountNumber": "口座番号（マスキング済み）",
    "period": {
      "from": "YYYY-MM-DD",
      "to": "YYYY-MM-DD"
    },
    "importedAt": "${new Date().toISOString()}",
    "originalFormat": "元ファイル形式"
  }
}

【処理ルール】
1. 日付は必ずYYYY-MM-DD形式に統一
2. 金額は入金を正の数、出金を負の数で表現
3. 摘要は可能な限り原文を保持
4. 不明な項目はnullを設定
5. 信頼度を0-100で評価
6. 必ずJSON形式で出力（説明文は不要）

【注意事項】
- 残高が連続性を持つかチェック
- 同じ取引の重複を検出
- 明らかな誤りがあれば confidence を下げる
${hints ? `
【ヒント情報】
- 銀行名: ${hints.bankName || '不明'}
- 期待フォーマット: ${hints.expectedFormat || '不明'}
- 期間: ${hints.dateRange || '不明'}
` : ''}
`;

    const userPrompt = `
以下のデータを解析してください：

${rawData}
`;

    return systemPrompt + '\n\n' + userPrompt;
  }

  // 仕訳生成用プロンプト生成
  generateJournalPrompt(
    transaction: StandardizedBankTransaction['transactions'][0],
    options: {
      includePatterns?: boolean
      maxPatterns?: number
      includeContext?: boolean
    } = {}
  ): string {
    const patterns = options.includePatterns !== false ? 
      this.patternService.generatePatternsForLLM(options.maxPatterns || 30) : []
    
    const accounts = this.accountService.getAccounts()
      .filter(acc => acc.isActive)
      .map(acc => `${acc.code}:${acc.name}`)
    
    const unitOwners = this.auxiliaryService.getUnitOwners()
      .filter(owner => owner.isActive)
      .map(owner => `${owner.unitNumber}号室 ${owner.ownerName}`)

    const vendors = this.auxiliaryService.getVendors()
      .map(vendor => `${vendor.vendorName}（${vendor.category || 'その他'}）`)

    const divisions = Array.from(this.divisionService.divisions.values())
      .map(div => `${div.code}:${div.name}`)

    const systemPrompt = `
あなたはマンション管理組合の会計専門家です。
以下の取引データから適切な仕訳を生成してください。

【使用可能な勘定科目】
${accounts.join('\n')}

【区分経理】
${divisions.join('\n')}

【区分所有者リスト】
${unitOwners.join('\n')}

【登録業者リスト】
${vendors.join('\n')}

${patterns.length > 0 ? `
【過去の仕訳パターン（${patterns.length}件）】
${patterns.map(p => this.formatPatternForPrompt(p)).join('\n\n')}

【仕訳生成ルール】
1. まず過去の仕訳パターンから類似するものを検索
2. 類似パターン（similarity >= 70）がある場合は、そのパターンを適用
3. 類似パターンがない場合は、新規仕訳として以下を考慮：
   - 区分所有者からの入金 → 普通預金/管理費収入・修繕積立金収入
   - 業者への支払い → 該当費用科目/普通預金
   - 不明な取引 → 仮払金または仮受金を使用
4. 新規パターンの場合は isNewPattern: true を設定
` : `
【基本仕訳ルール】
- 区分所有者からの管理費入金: 借方:普通預金 / 貸方:管理費収入・修繕積立金収入
- 業者への支払い: 借方:該当費用科目 / 貸方:普通預金
- 水道光熱費: 借方:水道光熱費 / 貸方:普通預金
- 不明な取引: 借方:仮払金 または 貸方:仮受金
`}

【出力形式】
{
  "suggestions": [
    {
      "confidence": 0-100,
      "journal": {
        "date": "取引日",
        "description": "仕訳摘要",
        "entries": [
          {
            "debit": {
              "account": "勘定科目コード",
              "accountName": "勘定科目名",
              "amount": 金額
            },
            "credit": {
              "account": "勘定科目コード", 
              "accountName": "勘定科目名",
              "amount": 金額
            },
            "division": "区分コード",
            "auxiliaryCode": "補助科目コード"
          }
        ]
      },
      "patternMatch": {
        "matchedPatternId": "マッチしたパターンID（該当なしの場合はnull）",
        "similarity": 0-100,
        "isNewPattern": true/false
      },
      "reasoning": "判断理由"
    }
  ]
}
`;

    const userPrompt = `
【対象取引】
日付: ${transaction.date}
摘要: ${transaction.description}
金額: ${transaction.amount}円
支払先/受取先: ${transaction.payee || '不明'}
カテゴリ: ${transaction.category || '不明'}

上記取引の仕訳を生成してください。
`;

    return systemPrompt + '\n\n' + userPrompt;
  }

  // パターンをプロンプト用にフォーマット
  private formatPatternForPrompt(pattern: JournalPatternForLLM): string {
    const entries = pattern.entries.map(entry => {
      const parts = []
      if (entry.debit) {
        parts.push(`借方:${entry.debit.account}:${entry.debit.accountName}`)
      }
      if (entry.credit) {
        parts.push(`貸方:${entry.credit.account}:${entry.credit.accountName}`)
      }
      if (entry.auxiliaryCode) {
        parts.push(`補助:${entry.auxiliaryCode}`)
      }
      return parts.join(' ')
    }).join(', ')

    const examples = pattern.examples.length > 0 ? 
      `\n  摘要例: ${pattern.examples.join(', ')}` : ''

    return `◆ パターンID: ${pattern.patternId}
  キーワード: ${pattern.keywords.join(', ')}
  仕訳: ${entries}
  使用回数: ${pattern.frequency}回
  成功率: ${pattern.successRate}%${examples}`;
  }

  // バッチ処理用プロンプト生成
  generateBatchJournalPrompt(
    transactions: StandardizedBankTransaction['transactions'],
    maxPatterns: number = 50
  ): string {
    if (transactions.length === 0) return '';

    const patterns = this.patternService.generatePatternsForLLM(maxPatterns);
    const accounts = this.accountService.getAccounts()
      .filter(acc => acc.isActive)
      .map(acc => `${acc.code}:${acc.name}`);

    const systemPrompt = `
あなたはマンション管理組合の会計専門家です。
複数の取引データを一括で仕訳に変換してください。

【使用可能な勘定科目】
${accounts.join('\n')}

【過去の仕訳パターン】
${patterns.map(p => this.formatPatternForPrompt(p)).join('\n\n')}

【処理方針】
1. 各取引に対してパターンマッチングを実行
2. マッチした場合はそのパターンを適用
3. マッチしない場合は新規仕訳を生成
4. 効率化のため、同じパターンは再利用

【出力形式】
{
  "results": [
    {
      "transactionIndex": インデックス番号,
      "confidence": 0-100,
      "journal": { /* 仕訳データ */ },
      "patternMatch": { /* パターンマッチ情報 */ },
      "reasoning": "判断理由"
    }
  ],
  "summary": {
    "total": 処理件数,
    "matched": パターンマッチした件数,
    "newPatterns": 新規パターン件数
  }
}
`;

    const transactionsText = transactions.map((tx, index) => 
      `${index}: ${tx.date} ${tx.description} ${tx.amount}円`
    ).join('\n');

    const userPrompt = `
【対象取引（${transactions.length}件）】
${transactionsText}

上記取引を一括で仕訳に変換してください。
`;

    return systemPrompt + '\n\n' + userPrompt;
  }
}

// LLM仕訳生成サービス
export class LLMJournalService {
  private promptGenerator: LLMPromptGenerator;

  constructor(
    patternService: JournalPatternService,
    accountService: AccountService,
    auxiliaryService: AuxiliaryService,
    divisionService: DivisionService
  ) {
    this.promptGenerator = new LLMPromptGenerator(
      patternService,
      accountService,
      auxiliaryService,
      divisionService
    );
  }

  // データ正規化処理（模擬実装）
  async normalizeData(rawData: string, hints?: {
    bankName?: string
    expectedFormat?: string
    dateRange?: string
  }): Promise<StandardizedBankTransaction> {
    const prompt = this.promptGenerator.generateNormalizationPrompt(rawData, hints);
    
    // 実際の実装では、ここでLLM APIを呼び出し
    // const response = await this.callLLMAPI(prompt);
    
    // 模擬レスポンス
    const mockResponse = this.generateMockNormalizeResponse(rawData);
    
    return mockResponse;
  }

  // 仕訳生成処理（模擬実装）
  async generateJournal(
    transaction: StandardizedBankTransaction['transactions'][0],
    options?: {
      includePatterns?: boolean
      maxPatterns?: number
    }
  ): Promise<JournalSuggestion> {
    const prompt = this.promptGenerator.generateJournalPrompt(transaction, options);
    
    // 実際の実装では、ここでLLM APIを呼び出し
    // const response = await this.callLLMAPI(prompt);
    
    // 模擬レスポンス
    const mockResponse = this.generateMockJournalResponse(transaction);
    
    return mockResponse;
  }

  // プロンプト取得（デバッグ用）
  getPromptForTransaction(
    transaction: StandardizedBankTransaction['transactions'][0]
  ): string {
    return this.promptGenerator.generateJournalPrompt(transaction);
  }

  // プロンプトジェネレーターの取得（テスト用）
  getPromptGenerator(): LLMPromptGenerator {
    return this.promptGenerator;
  }

  // 模擬的な正規化レスポンス生成（デモ用の詳細データ）
  private generateMockNormalizeResponse(rawData: string): StandardizedBankTransaction {
    const lines = rawData.split('\n').filter(line => line.trim());
    const transactions = [];
    
    // ヘッダー行をスキップ
    let hasHeader = false;
    if (lines[0] && lines[0].includes('日付')) {
      hasHeader = true;
    }
    
    const startIndex = hasHeader ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(',').map(p => p.trim());
      
      if (parts.length >= 3) {
        const dateMatch = parts[0].match(/\d{4}[/-]\d{1,2}[/-]\d{1,2}/);
        if (dateMatch) {
          const date = dateMatch[0].replace(/\//g, '-');
          const description = parts[1] || '';
          const withdrawal = parseFloat(parts[2]?.replace(/[^\d.-]/g, '') || '0');
          const deposit = parseFloat(parts[3]?.replace(/[^\d.-]/g, '') || '0');
          const amount = deposit > 0 ? deposit : -withdrawal;
          
          // カテゴリを推定
          let category = 'その他';
          let payee = '';
          let confidence = 75;
          
          if (description.includes('管理費') || description.includes('修繕積立金')) {
            category = '管理費収入';
            payee = description.match(/\d+号室/)?.[0] || '';
            confidence = 95;
          } else if (description.includes('駐車場')) {
            category = '駐車場収入';
            confidence = 90;
          } else if (description.includes('清掃')) {
            category = '清掃費';
            payee = description.replace('清掃業務委託', '').trim();
            confidence = 95;
          } else if (description.includes('エレベーター')) {
            category = '設備保守費';
            payee = description.replace('エレベーター保守点検', '').trim();
            confidence = 95;
          } else if (description.includes('電気') || description.includes('水道')) {
            category = '水道光熱費';
            confidence = 95;
          } else if (description.includes('保険')) {
            category = '保険料';
            confidence = 90;
          } else if (description.includes('修繕') || description.includes('工事')) {
            category = '修繕費';
            confidence = 90;
          } else if (description.includes('管理会社')) {
            category = '管理委託費';
            confidence = 95;
          } else if (description.includes('手数料')) {
            category = '支払手数料';
            confidence = 95;
          }
          
          transactions.push({
            date,
            description,
            amount,
            category,
            payee,
            confidence
          });
        }
      }
    }

    return {
      transactions,
      metadata: {
        bankName: '三菱UFJ銀行',
        accountNumber: '****1234',
        period: transactions.length > 0 ? {
          from: transactions[0].date,
          to: transactions[transactions.length - 1].date
        } : undefined,
        importedAt: new Date().toISOString(),
        originalFormat: 'CSV'
      }
    };
  }

  // 模擬的な仕訳レスポンス生成（デモ用の詳細データ）
  private generateMockJournalResponse(
    transaction: StandardizedBankTransaction['transactions'][0]
  ): JournalSuggestion {
    let debitAccount = '';
    let debitAccountName = '';
    let creditAccount = '';
    let creditAccountName = '';
    let confidence = 70;
    let reasoning = '';
    let division = '1'; // 管理費会計
    
    const amount = Math.abs(transaction.amount);

    if (transaction.amount > 0) {
      // 入金取引
      debitAccount = '1112'; // 普通預金
      debitAccountName = '普通預金';
      
      if (transaction.description.includes('管理費') && transaction.description.includes('修繕積立金')) {
        // 管理費と修繕積立金を分ける
        const unitMatch = transaction.description.match(/(\d+)号室/);
        if (unitMatch) {
          // 実際は複合仕訳だが、簡略化のため管理費として処理
          creditAccount = '4111';
          creditAccountName = '管理費収入';
          confidence = 95;
          reasoning = `${unitMatch[0]}からの管理費・修繕積立金の入金と判断。過去の同様のパターンから自動認識。`;
        }
      } else if (transaction.description.includes('駐車場')) {
        creditAccount = '4121';
        creditAccountName = '駐車場使用料収入';
        confidence = 90;
        reasoning = '駐車場使用料の一括入金と判断。';
      } else {
        creditAccount = '4191';
        creditAccountName = '雑収入';
        confidence = 60;
        reasoning = 'カテゴリが特定できないため雑収入として処理。';
      }
    } else {
      // 支出取引
      creditAccount = '1112';
      creditAccountName = '普通預金';
      
      if (transaction.description.includes('清掃')) {
        debitAccount = '5121';
        debitAccountName = '清掃費';
        confidence = 95;
        reasoning = '定期清掃業務の支払いと判断。業者名も特定済み。';
      } else if (transaction.description.includes('エレベーター')) {
        debitAccount = '5131';
        debitAccountName = '設備保守費';
        confidence = 95;
        reasoning = 'エレベーター定期保守点検費用と判断。';
      } else if (transaction.description.includes('電気')) {
        debitAccount = '5141';
        debitAccountName = '水道光熱費';
        confidence = 95;
        reasoning = '共用部電気料金の支払いと判断。';
      } else if (transaction.description.includes('水道')) {
        debitAccount = '5141';
        debitAccountName = '水道光熱費';
        confidence = 95;
        reasoning = '水道料金の支払いと判断。';
      } else if (transaction.description.includes('保険')) {
        debitAccount = '5161';
        debitAccountName = '損害保険料';
        confidence = 90;
        reasoning = '火災保険等の保険料支払いと判断。';
      } else if (transaction.description.includes('植栽') || transaction.description.includes('剪定')) {
        debitAccount = '5122';
        debitAccountName = '植栽管理費';
        confidence = 90;
        reasoning = '植栽の剪定・管理作業費用と判断。';
      } else if (transaction.description.includes('修繕') || transaction.description.includes('工事')) {
        debitAccount = '5151';
        debitAccountName = '修繕費';
        division = '2'; // 修繕積立金会計
        confidence = 90;
        reasoning = '給水ポンプ交換等の修繕工事費用と判断。修繕積立金会計で処理。';
      } else if (transaction.description.includes('管理会社')) {
        debitAccount = '5111';
        debitAccountName = '管理委託費';
        confidence = 95;
        reasoning = '管理会社への月次委託費と判断。';
      } else if (transaction.description.includes('手数料')) {
        debitAccount = '5181';
        debitAccountName = '支払手数料';
        confidence = 95;
        reasoning = '銀行振込手数料と判断。';
      } else {
        debitAccount = '5191';
        debitAccountName = 'その他費用';
        confidence = 60;
        reasoning = 'カテゴリが特定できないためその他費用として処理。要確認。';
      }
    }

    return {
      transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      confidence,
      suggestedJournal: {
        date: transaction.date,
        description: transaction.description,
        debitAccount,
        debitAccountName,
        creditAccount,
        creditAccountName,
        amount,
        division
      },
      reasoning
    };
  }
}