# Deno リントプラグインプロジェクト概要

このプロジェクトは、Deno のカスタムリントプラグインを開発するためのものです。主に `do` で始まる関数呼び出しが try-catch ブロック内で適切に処理されているかをチェックするルールを実装しています。

## プロジェクト構成

- `plugin.ts`: プラグインのエントリーポイント。リントルールの登録を行います。
- `rules/do_with_try.ts`: メインのリントルールの実装。`do` で始まる関数呼び出しが try-catch ブロック内にあるかをチェックします。
- `rules/do_with_try.test.ts`: リントルールのテストケース。
- `examples/main.ts`: リントルールの動作確認用のサンプルコード。
- `deno.json`: プロジェクトの設定ファイル。リントプラグインの設定などが含まれています。

## リントルールの概要

`do_with_try` ルール（`my-plugin/require-try-catch-for-do-functions`）は、以下の機能を提供します：

1. `do` で始まる関数名（例: `doSomething()`）の呼び出しを検出します。
2. これらの関数呼び出しが try-catch ブロック内にあるかどうかをチェックします。
3. try-catch ブロック内にない場合、エラーを報告し、try-catch で囲む修正を提案します。

## 最近の修正内容

最近、以下の問題が修正されました：

1. **関数スコープの境界問題**: 以前は、関数内の `await doSomething()` が、その関数自体が try-catch ブロック内にある場合に誤って「保護されている」と判断されていました。

   ```typescript
   try {
     const run = async () => {
       await doSomething(); // この行がリントされていなかった
     };
     await run();
   } catch (error) {
     console.error("An error occurred:", error);
   }
   ```

2. **修正方法**: `isInsideTryCatch` 関数を更新して、関数定義（FunctionExpression、ArrowFunctionExpression、FunctionDeclaration）の境界を超えて親ノードを遡らないようにしました。これにより、関数内の `await doSomething()` が、その関数を囲む外側の try-catch ブロックによって保護されていると誤って判断されなくなりました。

3. **プラグイン設定の修正**: プラグイン名とルール ID を正しく設定し、テストが正常に実行されるようにしました。

## 使用方法

このプラグインを使用するには、`deno.json` ファイルに以下のように設定します：

```json
{
  "lint": {
    "plugins": ["./plugin.ts"]
  }
}
```

リントを実行するには：

```bash
deno lint
```

自動修正を適用するには：

```bash
deno lint --fix
```
