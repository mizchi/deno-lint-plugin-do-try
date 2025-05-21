# @mizchi/linter

Deno plugin

- @mizchi/linter/do-try
  - throwable function should be named with `do` prefix
- @mizchi/linter/strict-module

## Inspire

## How to use

```json
{
  "lint": {
    "plugins": ["jsr:@mizchi/linter/do-try", "jsr:@mizchi/linter/strict-module"]
  }
}
```

## Rules

### Plugin: strict-module

```ts
// ok
import {} from "./xxx/mod.ts"; // allow ./mod.ts
import type { Foo as _2 } from "./xxx/types.ts"; // allow ./types.ts
import {} from "../../mod.ts"; // allow direct parent mod
import {} from "../../internal.ts"; // allow direct parent internal

// error
import {} from "./xxx/internal.ts"; // direct import
import { Foo as _1 } from "./xxx/types.ts"; // no type import
import {} from "../../submodule/internal.ts"; // direct parent sub mobule
```

### Plugin: do-try

https://github.com/microsoft/vscode/blob/9b4e21695e2b905d293544dcb583fae2ef8ec7c0/src/vs/platform/log/browser/log.ts#L36

Errors

```ts
// Error: function has throw statement should be named with do~
function throwableFunction() {
  if (Math.random() > 0.5) {
    throw new Error("Random error");
  }
  return "data";
}

// Error: do~ function should be called with try
doSomething();
await doSomething();
await obj.doSomething();
```

Allowed

```ts
function doThrowableFunction() {
  if (Math.random() > 0.5) {
    throw new Error("Random error");
  }
  return "data";
}
async function doThrowableAsync(): Promise<string> {
  if (Math.random() > 0.5) {
    await Promise.reject(new Error("Random error"));
  }
  return "data";
}

try {
  doThrowableFunction();
  await doThrowableAsync();
} catch (error) {
  console.error("An error occurred:", error);
}
```

## LICENSE

MIT
