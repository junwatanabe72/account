# TypeScript厳格化 コーディングガイドライン

## 1. 基本原則

### 1.1 型安全性の3原則
1. **明示的な型定義**: 推論に頼らず、重要な変数・関数には型を明示
2. **実行時検証**: 外部データは必ず検証してから使用
3. **エラーハンドリング**: unknown型とResult型でエラーを安全に処理

### 1.2 禁止事項
```typescript
// ❌ 絶対に使用しない
any                         // any型
@ts-ignore                  // TypeScriptエラーの無視
@ts-nocheck                 // ファイル全体のチェック無効化
as any                      // any型へのキャスト
Function                    // Function型
Object                      // Object型（object型を使用）
{} as Type                  // 空オブジェクトからのキャスト
```

### 1.3 推奨事項
```typescript
// ✅ 推奨される書き方
unknown                     // 型が不明な場合
Type | undefined           // Nullable型の表現
as const                   // リテラル型の保持
satisfies Type             // 型の検証（TypeScript 4.9+）
is Type                    // 型ガード
z.parse()                  // 実行時型検証
```

## 2. 型定義パターン

### 2.1 基本的な型定義

```typescript
// ❌ Bad: 暗黙的なany
function processData(data) {
  return data.value;
}

// ❌ Bad: any型の使用
function processData(data: any): any {
  return data.value;
}

// ✅ Good: 明示的な型定義
interface DataItem {
  value: string;
  timestamp: number;
}

function processData(data: DataItem): string {
  return data.value;
}
```

### 2.2 unknown型の活用

```typescript
// ❌ Bad: anyで何でも受け入れる
function parseJson(jsonString: string): any {
  return JSON.parse(jsonString);
}

// ✅ Good: unknownで安全に処理
function parseJson(jsonString: string): unknown {
  return JSON.parse(jsonString);
}

// 使用時は型ガードで絞り込む
const result = parseJson(input);
if (isValidData(result)) {
  console.log(result.value); // 型安全
}
```

### 2.3 型ガードの実装

```typescript
// 単純な型ガード
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// オブジェクトの型ガード
interface User {
  id: string;
  name: string;
  email: string;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'email' in value &&
    typeof (value as User).id === 'string' &&
    typeof (value as User).name === 'string' &&
    typeof (value as User).email === 'string'
  );
}

// 配列の型ガード
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(item => typeof item === 'string')
  );
}
```

### 2.4 Result型パターン

```typescript
// Result型の定義
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// 使用例
function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return { ok: false, error: new Error('Division by zero') };
  }
  return { ok: true, value: a / b };
}

// 利用側
const result = divide(10, 2);
if (result.ok) {
  console.log(`Result: ${result.value}`);
} else {
  console.error(`Error: ${result.error.message}`);
}
```

## 3. Zodによる実行時型検証

### 3.1 基本的な使用方法

```typescript
import { z } from 'zod';

// スキーマ定義
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  roles: z.array(z.enum(['admin', 'user', 'guest'])),
  createdAt: z.string().datetime()
});

// 型の自動生成
type User = z.infer<typeof UserSchema>;

// 検証
function validateUser(data: unknown): User {
  return UserSchema.parse(data); // 失敗時は例外
}

// 安全な検証
function safeValidateUser(data: unknown): Result<User, z.ZodError> {
  const result = UserSchema.safeParse(data);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return { ok: false, error: result.error };
}
```

### 3.2 カスタムバリデーション

```typescript
// 会計データの検証
const JournalEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(1).max(200),
  details: z.array(z.object({
    accountCode: z.string(),
    debit: z.number().nullable(),
    credit: z.number().nullable()
  }))
}).refine(
  (data) => {
    // 貸借の一致を検証
    const totalDebit = data.details.reduce(
      (sum, d) => sum + (d.debit || 0), 0
    );
    const totalCredit = data.details.reduce(
      (sum, d) => sum + (d.credit || 0), 0
    );
    return Math.abs(totalDebit - totalCredit) < 0.01;
  },
  { message: "貸借が一致しません" }
);
```

## 4. エラーハンドリング

### 4.1 エラークラスの定義

```typescript
// アプリケーション固有のエラー
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ビジネスロジックエラー
export class BusinessError extends AppError {
  constructor(message: string, code: string, details?: unknown) {
    super(message, code, 400, details);
    this.name = 'BusinessError';
  }
}

// バリデーションエラー
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}
```

### 4.2 エラーハンドリングパターン

```typescript
// ❌ Bad: any型でキャッチ
try {
  // 処理
} catch (error: any) {
  console.error(error.message);
}

// ✅ Good: unknown型で安全に処理
try {
  // 処理
} catch (error: unknown) {
  if (error instanceof AppError) {
    // AppErrorの処理
    logger.error({
      code: error.code,
      message: error.message,
      details: error.details
    });
  } else if (error instanceof Error) {
    // 通常のErrorの処理
    logger.error({
      message: error.message,
      stack: error.stack
    });
  } else {
    // その他のエラー
    logger.error({
      message: 'Unknown error',
      error: String(error)
    });
  }
}
```

## 5. ジェネリクスの活用

### 5.1 基本的なジェネリクス

```typescript
// ❌ Bad: any型を使用
function first(arr: any[]): any {
  return arr[0];
}

// ✅ Good: ジェネリクスで型安全
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// 使用例
const numbers = [1, 2, 3];
const firstNumber = first(numbers); // number | undefined

const strings = ['a', 'b', 'c'];
const firstString = first(strings); // string | undefined
```

### 5.2 制約付きジェネリクス

```typescript
// IDを持つオブジェクトの制約
interface HasId {
  id: string;
}

function findById<T extends HasId>(
  items: T[],
  id: string
): T | undefined {
  return items.find(item => item.id === id);
}

// 使用例
interface User extends HasId {
  name: string;
  email: string;
}

const users: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com' }
];

const user = findById(users, '1'); // User | undefined
```

## 6. 非同期処理の型定義

### 6.1 Promise型の明示

```typescript
// ❌ Bad: 戻り値の型が不明確
async function fetchData() {
  const response = await fetch('/api/data');
  return response.json();
}

// ✅ Good: 明示的な型定義
async function fetchData(): Promise<Result<User[], Error>> {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      return { 
        ok: false, 
        error: new Error(`HTTP ${response.status}`) 
      };
    }
    const data = await response.json();
    const result = z.array(UserSchema).safeParse(data);
    if (result.success) {
      return { ok: true, value: result.data };
    }
    return { ok: false, error: new Error('Invalid data format') };
  } catch (error) {
    return { 
      ok: false, 
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}
```

## 7. React コンポーネントの型定義

### 7.1 Props の型定義

```typescript
// ❌ Bad: any型のprops
const MyComponent = (props: any) => {
  return <div>{props.title}</div>;
};

// ✅ Good: 明示的な型定義
interface MyComponentProps {
  title: string;
  count?: number;
  onClose: () => void;
  children: React.ReactNode;
}

const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  count = 0, 
  onClose, 
  children 
}) => {
  return (
    <div>
      <h1>{title}</h1>
      <span>{count}</span>
      <button onClick={onClose}>Close</button>
      {children}
    </div>
  );
};
```

### 7.2 イベントハンドラーの型定義

```typescript
// ❌ Bad: any型のイベント
const handleClick = (e: any) => {
  console.log(e.target.value);
};

// ✅ Good: 適切なイベント型
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log(e.currentTarget.name);
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // フォーム処理
};
```

## 8. 移行期の対応

### 8.1 段階的な移行

```typescript
// Step 1: anyをunknownに置き換え
// @deprecated TODO: 型を明確にする
function legacyFunction(data: unknown): unknown {
  // 既存の実装
  return data;
}

// Step 2: 型ガードを追加
function isLegacyData(data: unknown): data is LegacyData {
  // 型チェック実装
  return true;
}

// Step 3: 新しい型定義の関数を作成
function newFunction(data: LegacyData): ProcessedData {
  // 型安全な実装
  return processData(data);
}

// Step 4: 移行完了後、レガシー関数を削除
```

### 8.2 TODO コメントの活用

```typescript
// TODO: [2024-03-01] any型を排除
// 理由: レガシーAPIとの互換性のため一時的に使用
// 担当: @username
// Issue: #123
function temporaryFunction(data: any): any {
  // 一時的な実装
  return data;
}
```

## 9. チェックリスト

### 9.1 コードレビューチェックリスト

- [ ] any型を使用していない
- [ ] unknown型に適切な型ガードがある
- [ ] エラーハンドリングでunknown型を使用
- [ ] 外部データにZodスキーマがある
- [ ] Result型でエラーを表現している
- [ ] ジェネリクスで型の再利用性を確保
- [ ] TODOコメントに期限と理由がある
- [ ] 型定義が明示的で理解しやすい

### 9.2 マージ前チェックリスト

- [ ] `npm run typecheck`がエラーなし
- [ ] `npm run lint`がエラーなし
- [ ] any型の使用箇所が増えていない
- [ ] テストが全て通過
- [ ] 型定義の変更がドキュメント化されている

## 10. ツールとコマンド

### 10.1 便利なコマンド

```bash
# any型の検出
grep -r "any" src --include="*.ts" --include="*.tsx"

# TypeScriptの厳格モードでチェック
npx tsc --strict --noEmit

# 未使用の変数・インポートを検出
npx tsc --noUnusedLocals --noUnusedParameters --noEmit

# ESLintでany型を検出
npx eslint . --ext .ts,.tsx --rule '@typescript-eslint/no-explicit-any: error'
```

### 10.2 VSCode設定

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.preferences.quoteStyle": "single",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.suggest.autoImports": true,
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  }
}
```

## まとめ

このガイドラインに従うことで、型安全なTypeScriptコードを書くことができます。any型の排除は一朝一夕にはできませんが、段階的に改善していくことで、保守性の高い堅牢なコードベースを構築できます。

不明な点があれば、チームで議論し、このガイドラインを継続的に改善していきましょう。