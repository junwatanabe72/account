/**
 * Runtime type validation schemas using Zod
 * These schemas replace 'any' types with validated types
 */

import { z } from 'zod';

// ===== Basic validation schemas =====

/**
 * ISO date string (YYYY-MM-DD)
 */
export const DateStringSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format'
);

/**
 * ISO datetime string
 */
export const DateTimeStringSchema = z.string().datetime();

/**
 * Positive number
 */
export const PositiveNumberSchema = z.number().positive();

/**
 * Non-negative number (0 or positive)
 */
export const NonNegativeNumberSchema = z.number().nonnegative();

/**
 * Money amount (positive number with max 2 decimal places)
 */
export const MoneyAmountSchema = z.number()
  .positive()
  .multipleOf(0.01, 'Amount must have at most 2 decimal places');

/**
 * Optional money amount
 */
export const OptionalMoneyAmountSchema = MoneyAmountSchema.nullable();

/**
 * Email validation
 */
export const EmailSchema = z.string().email();

/**
 * UUID validation
 */
export const UuidSchema = z.string().uuid();

/**
 * Non-empty string
 */
export const NonEmptyStringSchema = z.string().min(1, 'Cannot be empty');

// ===== Domain-specific schemas =====

/**
 * Account code schema
 */
export const AccountCodeSchema = z.string().regex(
  /^\d{4}$/,
  'Account code must be 4 digits'
);

/**
 * Division code schema
 */
export const DivisionCodeSchema = z.string().min(1).max(50);

/**
 * Journal status schema
 */
export const JournalStatusSchema = z.enum([
  'DRAFT',
  'PENDING',
  'APPROVED',
  'POSTED',
  'CANCELLED'
]);

/**
 * Account type schema
 */
export const AccountTypeSchema = z.enum([
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE'
]);

/**
 * Normal balance schema
 */
export const NormalBalanceSchema = z.enum(['DEBIT', 'CREDIT']);

/**
 * Transaction type schema
 */
export const TransactionTypeSchema = z.enum([
  'income',
  'expense',
  'transfer'
]);

// ===== Complex schemas =====

/**
 * Journal detail schema
 */
export const JournalDetailSchema = z.object({
  accountCode: AccountCodeSchema,
  accountName: z.string().optional(),
  debitAmount: OptionalMoneyAmountSchema,
  creditAmount: OptionalMoneyAmountSchema,
  description: z.string().optional(),
  taxInfo: z.object({
    rate: z.number(),
    amount: z.number()
  }).optional()
}).refine(
  (detail) => {
    // Either debit or credit must be specified, not both
    const hasDebit = detail.debitAmount !== null && detail.debitAmount > 0;
    const hasCredit = detail.creditAmount !== null && detail.creditAmount > 0;
    return (hasDebit && !hasCredit) || (!hasDebit && hasCredit);
  },
  { message: 'Either debit or credit must be specified, not both' }
);

/**
 * Journal entry schema
 */
export const JournalEntrySchema = z.object({
  id: z.string().optional(),
  date: DateStringSchema,
  description: NonEmptyStringSchema.max(200),
  division: DivisionCodeSchema,
  status: JournalStatusSchema.default('DRAFT'),
  details: z.array(JournalDetailSchema).min(2, 'At least 2 details required'),
  metadata: z.object({
    createdBy: z.string(),
    createdAt: DateTimeStringSchema,
    updatedBy: z.string().optional(),
    updatedAt: DateTimeStringSchema.optional(),
    source: z.enum(['manual', 'import', 'api']).default('manual'),
    importBatch: z.string().optional()
  }).optional()
}).refine(
  (journal) => {
    // Validate that debits equal credits
    const totalDebit = journal.details.reduce(
      (sum, detail) => sum + (detail.debitAmount || 0), 
      0
    );
    const totalCredit = journal.details.reduce(
      (sum, detail) => sum + (detail.creditAmount || 0), 
      0
    );
    return Math.abs(totalDebit - totalCredit) < 0.01;
  },
  { message: 'Total debits must equal total credits' }
);

/**
 * Account schema
 */
export const AccountSchema = z.object({
  code: AccountCodeSchema,
  name: NonEmptyStringSchema.max(100),
  type: AccountTypeSchema,
  normalBalance: NormalBalanceSchema,
  description: z.string().optional(),
  parentCode: AccountCodeSchema.optional(),
  isActive: z.boolean().default(true),
  order: z.number().int().optional()
});

/**
 * Bank transaction import schema
 */
export const BankTransactionSchema = z.object({
  date: DateStringSchema,
  description: NonEmptyStringSchema,
  amount: z.number(),
  balance: z.number().optional(),
  category: z.string().optional(),
  reference: z.string().optional(),
  payee: z.string().optional()
});

/**
 * API response wrapper schema
 */
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional()
    }).optional(),
    metadata: z.object({
      timestamp: DateTimeStringSchema,
      requestId: z.string().optional(),
      version: z.string().optional()
    }).optional()
  });

// ===== Type exports =====

export type DateString = z.infer<typeof DateStringSchema>;
export type JournalStatus = z.infer<typeof JournalStatusSchema>;
export type AccountType = z.infer<typeof AccountTypeSchema>;
export type NormalBalance = z.infer<typeof NormalBalanceSchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type JournalDetail = z.infer<typeof JournalDetailSchema>;
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type Account = z.infer<typeof AccountSchema>;
export type BankTransaction = z.infer<typeof BankTransactionSchema>;

// ===== Validation utilities =====

/**
 * Safe parse with Result type
 */
import { Result } from './core';

export function validateWithResult<T>(
  schema: z.ZodType<T>,
  data: unknown
): Result<T, z.ZodError> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return { ok: false, error: result.error };
}

/**
 * Parse or throw with custom error message
 */
export function parseOrThrow<T>(
  schema: z.ZodType<T>,
  data: unknown,
  errorMessage?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = errorMessage || `Validation failed: ${error.errors.map(e => e.message).join(', ')}`;
      throw new Error(message);
    }
    throw error;
  }
}

/**
 * Type guard generator from Zod schema
 */
export function createTypeGuard<T>(
  schema: z.ZodType<T>
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    return schema.safeParse(value).success;
  };
}

// ===== Type guards =====

export const isJournalEntry = createTypeGuard(JournalEntrySchema);
export const isAccount = createTypeGuard(AccountSchema);
export const isBankTransaction = createTypeGuard(BankTransactionSchema);
export const isJournalDetail = createTypeGuard(JournalDetailSchema);