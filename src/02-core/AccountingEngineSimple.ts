// Minimal AccountingEngine for testing

export class AccountingEngineSimple {
  private name: string = 'Simple Accounting Engine'
  private version: string = '1.0.0'
  private journals: any[] = []

  constructor() {
    console.log('AccountingEngineSimple initialized')
  }

  // Basic methods
  getName(): string {
    return this.name
  }

  getVersion(): string {
    return this.version
  }

  // Simple journal management
  addJournal(date: string, description: string, amount: number): void {
    const journal = {
      id: Date.now().toString(),
      date,
      description,
      amount,
      createdAt: new Date().toISOString()
    }
    this.journals.push(journal)
    console.log('Journal added:', journal)
  }

  getJournals(): any[] {
    return this.journals
  }

  clearJournals(): void {
    this.journals = []
    console.log('All journals cleared')
  }

  // Simple summary
  getSummary(): object {
    return {
      engineName: this.name,
      version: this.version,
      journalCount: this.journals.length,
      totalAmount: this.journals.reduce((sum, j) => sum + j.amount, 0)
    }
  }
}