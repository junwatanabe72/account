import { ImportExportService } from '../io/ImportExportService';
import { CoreFacade } from './CoreFacade';
import { ImportJson, ExportJson } from '../../01-types';

/**
 * 入出力機能を管理するファサード
 * データのインポート・エクスポートを担当
 */
export class IOFacade {
  private importExportService: ImportExportService;

  constructor(private core: CoreFacade) {
    this.importExportService = new ImportExportService(
      core.accounts,
      core.journals,
      core.divisions
    );
  }

  // JSONインポート
  importFromJSON(json: ImportJson): void {
    return this.importExportService.importFromJSON(json);
  }

  // JSONエクスポート
  exportToJSON(): ExportJson {
    return this.importExportService.exportToJSON();
  }

  // CSVインポート（勘定科目）
  importAccountsFromCSV(csvData: string): void {
    return this.importExportService.importAccountsFromCSV(csvData);
  }

  // CSVインポート（仕訳）
  importJournalsFromCSV(csvData: string): void {
    return this.importExportService.importJournalsFromCSV(csvData);
  }

  // CSVエクスポート（勘定科目）
  exportAccountsToCSV(): string {
    return this.importExportService.exportAccountsToCSV();
  }

  // CSVエクスポート（仕訳）
  exportJournalsToCSV(): string {
    return this.importExportService.exportJournalsToCSV();
  }

  // Excelエクスポート用データ生成
  generateExcelData(): {
    accounts: any[];
    journals: any[];
    trialBalance: any[];
  } {
    return {
      accounts: this.core.accounts.getAll(),
      journals: this.core.journals.getAllJournals(),
      trialBalance: []
    };
  }

  // バックアップの作成
  createBackup(): {
    timestamp: string;
    data: ExportJson;
  } {
    return {
      timestamp: new Date().toISOString(),
      data: this.exportToJSON()
    };
  }

  // バックアップの復元
  restoreFromBackup(backup: { data: ImportJson }): void {
    this.importFromJSON(backup.data);
  }

  // データの検証
  validateImportData(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('無効なデータ形式です');
    }

    if (data.accounts && !Array.isArray(data.accounts)) {
      errors.push('勘定科目データが配列ではありません');
    }

    if (data.journals && !Array.isArray(data.journals)) {
      errors.push('仕訳データが配列ではありません');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
