export type DivisionCode = 'KANRI' | 'SHUZEN' | 'COMMON';

export class Division {
  private readonly code: DivisionCode;
  private readonly name: string;
  private readonly description: string;

  constructor(code: DivisionCode, name: string, description: string) {
    this.code = code;
    this.name = name;
    this.description = description;
  }

  getCode(): DivisionCode {
    return this.code;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  isManagement(): boolean {
    return this.code === 'KANRI';
  }

  isMaintenance(): boolean {
    return this.code === 'SHUZEN';
  }

  isCommon(): boolean {
    return this.code === 'COMMON';
  }

  canUseAccount(accountDivision: DivisionCode): boolean {
    if (this.code === 'COMMON') {
      return true;
    }
    return accountDivision === this.code || accountDivision === 'COMMON';
  }

  static KANRI = new Division('KANRI', '管理会計', '管理組合の一般会計');
  static SHUZEN = new Division('SHUZEN', '修繕積立金会計', '修繕積立金の管理会計');
  static COMMON = new Division('COMMON', '共通', '両会計で使用可能');

  static fromCode(code: string): Division {
    switch (code) {
      case 'KANRI':
        return Division.KANRI;
      case 'SHUZEN':
        return Division.SHUZEN;
      case 'COMMON':
        return Division.COMMON;
      default:
        throw new Error(`不明な会計区分: ${code}`);
    }
  }

  static getAll(): Division[] {
    return [Division.KANRI, Division.SHUZEN, Division.COMMON];
  }

  toJSON(): { code: DivisionCode; name: string; description: string } {
    return {
      code: this.code,
      name: this.name,
      description: this.description
    };
  }
}