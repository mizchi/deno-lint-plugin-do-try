import { assertEquals } from "jsr:@std/assert";
import myPlugin from "../plugin.ts";

Deno.test(
  "try: require-try-catch-for-do-functions - direct call without try-catch",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      myPlugin,
      "test.ts",
      `function test() {
        doSomething();
      }`
    );

    assertEquals(diagnostics.length, 1);
    const d = diagnostics[0];
    assertEquals(d.id, "try/require-try-catch-for-do-functions");
    assertEquals(
      d.message,
      "Function 'doSomething' starts with 'do', so it must be wrapped in a try-catch block"
    );
    // 修正の内容をチェック
    if (d.fix && d.fix.length > 0) {
      assertEquals(d.fix.length, 1);
      assertEquals(d.fix[0]?.text?.includes("try {"), true);
      assertEquals(d.fix[0]?.text?.includes("catch (error)"), true);
    } else {
      throw new Error("Expected fix to be defined and not empty");
    }
  }
);

Deno.test(
  "try: require-try-catch-for-do-functions - method call without try-catch",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      myPlugin,
      "test.ts",
      `function test() {
        obj.doMethod();
      }`
    );

    assertEquals(diagnostics.length, 1);
    const d = diagnostics[0];
    assertEquals(d.id, "try/require-try-catch-for-do-functions");
    assertEquals(
      d.message,
      "Function 'doMethod' starts with 'do', so it must be wrapped in a try-catch block"
    );
  }
);

Deno.test(
  "try: require-try-catch-for-do-functions - call with try-catch",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      myPlugin,
      "test.ts",
      `function test() {
        try {
          doSomething();
        } catch (error) {
          console.error(error);
        }
      }`
    );

    // try-catchで囲まれているので、エラーは報告されないはず
    assertEquals(
      diagnostics.filter(
        (d) => d.id === "try/require-try-catch-for-do-functions"
      ).length,
      0
    );
  }
);

Deno.test(
  "try: require-try-catch-for-do-functions - non-do function call",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      myPlugin,
      "test.ts",
      `function test() {
        normalFunction();
      }`
    );

    // do~から始まらない関数名なので、エラーは報告されないはず
    assertEquals(
      diagnostics.filter(
        (d) => d.id === "try/require-try-catch-for-do-functions"
      ).length,
      0
    );
  }
);
