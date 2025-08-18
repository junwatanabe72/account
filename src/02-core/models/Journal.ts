import { UnifiedJournal, JournalLine, JournalStatus } from '../../01-types/journal';
import { ID, DateString, Amount } from '../../01-types/core';

export class Journal {
  private readonly journal: UnifiedJournal;

  constructor(journal: UnifiedJournal) {
    this.journal = Object.freeze({ ...journal });
  }

  get id(): ID {
    return this.journal.id;
  }

  get journalNumber(): string {
    return this.journal.journalNumber;
  }

  get date(): DateString {
    return this.journal.date;
  }

  get division(): UnifiedJournal['division'] {
    return this.journal.division;
  }

  get status(): JournalStatus {
    return this.journal.status;
  }

  get lines(): ReadonlyArray<JournalLine> {
    return Object.freeze([...this.journal.lines]);
  }

  get description(): string {
    return this.journal.description || '';
  }

  getTotalDebits(): Amount {
    return this.journal.lines
      .reduce((sum, line) => sum + line.debitAmount, 0);
  }

  getTotalCredits(): Amount {
    return this.journal.lines
      .reduce((sum, line) => sum + line.creditAmount, 0);
  }

  isBalanced(): boolean {
    return this.getTotalDebits() === this.getTotalCredits();
  }

  canPost(): boolean {
    return this.status === 'DRAFT' && this.isBalanced();
  }

  post(): Journal {
    if (!this.canPost()) {
      throw new Error('仕訳を転記できません。ステータスまたは貸借バランスを確認してください。');
    }

    return new Journal({
      ...this.journal,
      status: 'POSTED',
      postedAt: new Date().toISOString(),
      postedBy: 'system'
    });
  }

  cancel(reason: string): Journal {
    if (this.status === 'CANCELLED') {
      throw new Error('既にキャンセルされた仕訳です。');
    }

    return new Journal({
      ...this.journal,
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      cancelledBy: 'system',
      cancellationReason: reason
    });
  }

  updateLines(lines: JournalLine[]): Journal {
    if (this.status !== 'DRAFT') {
      throw new Error('下書き状態の仕訳のみ編集できます。');
    }

    return new Journal({
      ...this.journal,
      lines: lines,
      updatedAt: new Date().toISOString()
    });
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.journal.date) {
      errors.push('日付が設定されていません');
    }

    if (!this.journal.division) {
      errors.push('会計区分が設定されていません');
    }

    if (this.journal.lines.length === 0) {
      errors.push('仕訳明細がありません');
    }

    if (this.journal.lines.length === 1) {
      errors.push('仕訳には最低2行必要です');
    }

    if (!this.isBalanced()) {
      const debitTotal = this.getTotalDebits();
      const creditTotal = this.getTotalCredits();
      errors.push(`貸借が一致しません（借方: ¥${debitTotal.toLocaleString()}, 貸方: ¥${creditTotal.toLocaleString()}）`);
    }

    this.journal.lines.forEach((line, index) => {
      if (line.amount <= 0) {
        errors.push(`${index + 1}行目: 金額は正の値である必要があります`);
      }
      if (!line.accountCode) {
        errors.push(`${index + 1}行目: 勘定科目コードが設定されていません`);
      }
    });

    return errors;
  }

  toJSON(): UnifiedJournal {
    return { ...this.journal };
  }

  static fromJSON(data: UnifiedJournal): Journal {
    return new Journal(data);
  }

  static createDraft(
    date: DateString,
    division: 'KANRI' | 'SHUZEN',
    lines: JournalLine[],
    description?: string
  ): Journal {
    return new Journal({
      id: `journal_${Date.now()}`,
      journalNumber: `J${Date.now()}`,
      date,
      division,
      status: 'DRAFT',
      lines,
      description,
      createdAt: new Date().toISOString(),
      createdBy: 'system'
    });
  }
}