import { CoreFacade } from './CoreFacade';
import { ReportingFacade } from './ReportingFacade';
import { IOFacade } from './IOFacade';
import { HelperFacade } from './HelperFacade';

/**
 * 会計システム全体を統括するメインファサード
 * 各サブファサードへのアクセスポイントを提供
 */
export class AccountingFacade {
  private _core: CoreFacade;
  private _reporting: ReportingFacade;
  private _io: IOFacade;
  private _helper: HelperFacade;

  constructor() {
    // 各ファサードの初期化
    this._core = new CoreFacade();
    this._reporting = new ReportingFacade(this._core);
    this._io = new IOFacade(this._core);
    this._helper = new HelperFacade(this._core);
  }

  /**
   * コア業務機能（勘定科目、仕訳、取引、会計区分）
   */
  get core() {
    return this._core;
  }

  /**
   * レポート機能（試算表、財務諸表）
   */
  get reporting() {
    return this._reporting;
  }

  /**
   * 入出力機能（インポート、エクスポート）
   */
  get io() {
    return this._io;
  }

  /**
   * 補助機能（補助元帳、決算、サンプルデータ）
   */
  get helper() {
    return this._helper;
  }

  // 後方互換性のためのエイリアス
  get accounts() {
    return this._core.accounts;
  }

  get journals() {
    return this._core.journals;
  }

  get divisions() {
    return this._core.divisions;
  }

  get transactions() {
    return this._core.transactions;
  }

  // システム初期化
  initialize(): void {
    this._core.initialize();
  }

  // システムリセット
  reset(): void {
    this._helper.resetAllData();
  }

  // バージョン情報
  getVersion(): string {
    return '2.0.0'; // ファサード分割版
  }

  // システム情報の取得
  getSystemInfo(): {
    version: string;
    accounts: number;
    journals: number;
    divisions: number;
  } {
    return {
      version: this.getVersion(),
      accounts: this.accounts.getAll().length,
      journals: this.journals.getAllJournals().length,
      divisions: this.divisions.getAll().length
    };
  }
}

// デフォルトエクスポート
export default AccountingFacade;