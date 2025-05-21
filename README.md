# @mizchi/lint

for deno-lint

- plugins
  - @mizchi/lint/do-try
  - @mizchi/lint/strict-module

## How to use

deno.json

```json
{
  "lint": {
    "plugins": ["jsr:@mizchi/lint/do-try", "jsr:@mizchi/lint/strict-module"]
  }
}
```

## lint plugins

### @mizchi/lint/do-try

```ts
// Allow
function doThrowableFunction() {
  if (Math.random() > 0.5) {
    throw new Error("Random error");
  }
  return "data";
}

try {
  doThrowableFunction();
} catch (error) {
  console.error("An error occurred:", error);
}

async function doThrowableAsync(): Promise<string> {
  if (Math.random() > 0.5) {
    await Promise.reject(new Error("Random error"));
  }
  return "data";
}
try {
  await doThrowableAsync();
} catch (error) {
  console.error("An error occurred:", error);
}

async function doTask() {
  await Promise.resolve();
}
async function doMain(): Promise<void> {
  await doTask();
}

try {
  await doMain();
} catch (error) {
  console.error("An error occurred:", error);
}

// Errors
doSomething();
await doSomething();
await obj.doSomething();
try {
  const run = async () => {
    // should be wrapped in try-catch
    await doSomething();
  };
  await run();
} catch (error) {
  console.error("An error occurred:", error);
}
function _throwableFunction() {
  if (Math.random() > 0.5) {
    throw new Error("Random error");
  }
  return "data";
}

async function _throwableAsync(): Promise<string> {
  if (Math.random() > 0.5) {
    await Promise.reject(new Error("Random error"));
  }
  return "data";
}
```

### @mizchi/lint/strict-module

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

## LICENSE

MIT
