/**
 * Core type definitions for type-safe TypeScript
 * These types provide foundation for eliminating 'any' types
 */

/**
 * Result type for operations that can fail
 * Inspired by Rust's Result<T, E> type
 */
export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Nullable type helpers
 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

/**
 * Type guards for nullable types
 */
export const isNotNull = <T>(value: T | null): value is T => 
  value !== null;

export const isNotUndefined = <T>(value: T | undefined): value is T => 
  value !== undefined;

export const isDefined = <T>(value: T | null | undefined): value is T => 
  value !== null && value !== undefined;

/**
 * Type guard for checking if value is an object
 */
export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Type guard for checking if value is a string
 */
export const isString = (value: unknown): value is string =>
  typeof value === 'string';

/**
 * Type guard for checking if value is a number
 */
export const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && !isNaN(value);

/**
 * Type guard for checking if value is a boolean
 */
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

/**
 * Type guard for checking if value is an array
 */
export const isArray = <T = unknown>(value: unknown): value is T[] =>
  Array.isArray(value);

/**
 * Type guard for checking if value is a function
 */
export const isFunction = (value: unknown): value is Function =>
  typeof value === 'function';

/**
 * Extract keys from object type
 */
export type KeysOf<T> = keyof T;

/**
 * Extract values from object type
 */
export type ValuesOf<T> = T[keyof T];

/**
 * Make specified properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specified properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Deep partial type
 */
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

/**
 * Deep readonly type
 */
export type DeepReadonly<T> = T extends object ? {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
} : T;

/**
 * Type for async operations
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Helper function to create success result
 */
export const ok = <T, E = Error>(value: T): Result<T, E> => ({
  ok: true,
  value
});

/**
 * Helper function to create error result
 */
export const err = <T, E = Error>(error: E): Result<T, E> => ({
  ok: false,
  error
});

/**
 * Helper function to wrap async operations in Result type
 */
export const tryCatch = async <T, E = Error>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => E
): AsyncResult<T, E> => {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    if (errorHandler) {
      return err(errorHandler(error));
    }
    if (error instanceof Error) {
      return err(error as E);
    }
    return err(new Error(String(error)) as E);
  }
};

/**
 * Helper function to wrap sync operations in Result type
 */
export const tryCatchSync = <T, E = Error>(
  fn: () => T,
  errorHandler?: (error: unknown) => E
): Result<T, E> => {
  try {
    const value = fn();
    return ok(value);
  } catch (error) {
    if (errorHandler) {
      return err(errorHandler(error));
    }
    if (error instanceof Error) {
      return err(error as E);
    }
    return err(new Error(String(error)) as E);
  }
};

/**
 * Type-safe Object.keys
 */
export const objectKeys = <T extends object>(obj: T): (keyof T)[] =>
  Object.keys(obj) as (keyof T)[];

/**
 * Type-safe Object.entries
 */
export const objectEntries = <T extends object>(obj: T): [keyof T, T[keyof T]][] =>
  Object.entries(obj) as [keyof T, T[keyof T]][];

/**
 * Type-safe Object.values
 */
export const objectValues = <T extends object>(obj: T): T[keyof T][] =>
  Object.values(obj) as T[keyof T][];

/**
 * Exhaustive check for switch statements
 */
export const exhaustiveCheck = (value: never): never => {
  throw new Error(`Unhandled case: ${value}`);
};

/**
 * Type for JSON-serializable values
 */
export type JsonValue = 
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface JsonArray extends Array<JsonValue> {}

/**
 * Type guard for JSON values
 */
export const isJsonValue = (value: unknown): value is JsonValue => {
  if (value === null) return true;
  if (typeof value === 'string') return true;
  if (typeof value === 'number') return true;
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }
  if (typeof value === 'object') {
    return Object.values(value).every(isJsonValue);
  }
  return false;
};