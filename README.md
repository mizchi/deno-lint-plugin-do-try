# @mizchi/deno-lint-plugin-do-try

A custom lint plugin for Deno that enforces error handling best practices through two complementary rules.

## Inspire

https://github.com/microsoft/vscode/blob/9b4e21695e2b905d293544dcb583fae2ef8ec7c0/src/vs/platform/log/browser/log.ts#L36

## How to use

```json
{
  "lint": {
    "plugins": ["@mizchi/deno-lint-plugin-do-try"]
  }
}
```

## Rules

### do-try/require-try-catch-for-do-functions

This rule enforces that all function calls with names starting with `do` must be wrapped in a try-catch block.

#### ❌ Invalid Code

```typescript
function example() {
  doSomething(); // Error: Function 'doSomething' starts with 'do', so it must be wrapped in a try-catch block
  await doAsyncTask(); // Error: Function 'doAsyncTask' starts with 'do', so it must be wrapped in a try-catch block
  obj.doMethod(); // Error: Function 'doMethod' starts with 'do', so it must be wrapped in a try-catch block
}
```

#### ✅ Valid Code

```typescript
function example() {
  try {
    doSomething();
    await doAsyncTask();
    obj.doMethod();
  } catch (error) {
    console.error("An error occurred:", error);
  }
}
```

### do-try/throw-needs-do-prefix

This rule enforces that all functions containing throw statements must have names starting with `do`.

#### ❌ Invalid Code

```typescript
function getData() {
  // Error: Function 'getData' contains throw statement, so it must start with 'do'
  if (condition) {
    throw new Error("Something went wrong");
  }
  return data;
}

const fetchData = () => {
  // Error: Function 'fetchData' contains throw statement, so it must start with 'do'
  if (condition) {
    throw new Error("Something went wrong");
  }
  return data;
};

class Service {
  getData() {
    // Error: Function 'getData' contains throw statement, so it must start with 'do'
    if (condition) {
      throw new Error("Something went wrong");
    }
    return data;
  }
}
```

#### ✅ Valid Code

```typescript
function doGetData() {
  if (condition) {
    throw new Error("Something went wrong");
  }
  return data;
}

const doFetchData = () => {
  if (condition) {
    throw new Error("Something went wrong");
  }
  return data;
};

class Service {
  doGetData() {
    if (condition) {
      throw new Error("Something went wrong");
    }
    return data;
  }
}
```

## LICENSE

MIT
