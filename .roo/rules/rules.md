# Deno リントプラグインプロジェクト概要

このプロジェクトは、Deno のカスタムリントプラグインを開発するためのものです。主に `do` で始まる関数呼び出しが try-catch ブロック内で適切に処理されているかをチェックするルールを実装しています。

## Test の書き方

```ts
import { expect } from "@std/expect";
function add(a: number, b: number) {
  return a + b;
}
Deno.test();
```
