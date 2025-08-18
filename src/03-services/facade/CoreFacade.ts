import { AccountService as DomainAccountService } from '../account/AccountService';
import { JournalService } from '../journal/JournalService';
import { TransactionService } from '../transaction/TransactionService';
import { DivisionService } from '../division/DivisionService';

/**
 * コア業務機能を管理するファサード
 * 勘定科目、仕訳、取引、会計区分の管理を担当
 */
export class CoreFacade {
  private accountService: DomainAccountService;
  private journalService: JournalService;
  private transactionService: TransactionService;
  private divisionService: DivisionService;

  constructor() {
    // サービスの初期化（依存関係の順序に注意）
    this.accountService = new DomainAccountService();
    this.divisionService = new DivisionService();
    this.journalService = new JournalService(
      this.accountService,
      this.divisionService
    );
    this.transactionService = new TransactionService(
      this.accountService,
      this.journalService
    );
  }

  // 勘定科目関連
  get accounts() {
    return this.accountService;
  }

  // 仕訳関連
  get journals() {
    return this.journalService;
  }

  // 取引関連
  get transactions() {
    return this.transactionService;
  }

  // 会計区分関連
  get divisions() {
    return this.divisionService;
  }

  // 初期化メソッド
  initialize(): void {
    this.accountService.initialize();
    this.divisionService.initialize();
  }

  // リセットメソッド
  reset(): void {
    this.journalService.reset();
    this.transactionService.reset();
  }
}
