import { assertEquals } from "jsr:@std/assert";
import myPlugin from "../plugin.ts";

Deno.test(
  "try: throw-needs-do-prefix - function declaration with throw without do prefix",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      myPlugin,
      "test.ts",
      `function getData() {
        if (Math.random() > 0.5) {
          throw new Error("Random error");
        }
        return "data";
      }`
    );

    assertEquals(diagnostics.length, 1);
    const d = diagnostics[0];
    assertEquals(d.id, "do-try/throw-needs-do-prefix");
    assertEquals(
      d.message,
      "Function 'getData' contains throw statement, so it must start with 'do'"
    );
    // 修正の内容をチェック
    if (d.fix && d.fix.length > 0) {
      assertEquals(d.fix.length, 1);
      assertEquals(d.fix[0]?.text?.includes("doGetData"), true);
    } else {
      throw new Error("Expected fix to be defined and not empty");
    }
  }
);

Deno.test(
  "try: throw-needs-do-prefix - function with do prefix and throw is valid",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      myPlugin,
      "test.ts",
      `async function doGetData() {
        if (Math.random() > 0.5) {
          throw new Error("Random error");
        }
        return "data";
      }`
    );

    // doで始まっているので、エラーは報告されないはず
    assertEquals(
      diagnostics.filter((d) => d.id === "do-try/throw-needs-do-prefix").length,
      0
    );
  }
);

Deno.test(
  "try: throw-needs-do-prefix - function without throw doesn't need do prefix",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      myPlugin,
      "test.ts",
      `function getData() {
        return "data";
      }`
    );

    // throwを含まないので、エラーは報告されないはず
    assertEquals(
      diagnostics.filter((d) => d.id === "do-try/throw-needs-do-prefix").length,
      0
    );
  }
);

Deno.test(
  "try: throw-needs-do-prefix - arrow function with throw without do prefix",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      myPlugin,
      "test.ts",
      `const getData = () => {
        if (Math.random() > 0.5) {
          throw new Error("Random error");
        }
        return "data";
      }`
    );

    assertEquals(diagnostics.length, 1);
    const d = diagnostics[0];
    assertEquals(d.id, "do-try/throw-needs-do-prefix");
    assertEquals(
      d.message,
      "Function 'getData' contains throw statement, so it must start with 'do'"
    );
  }
);

Deno.test(
  "try: throw-needs-do-prefix - method with throw without do prefix",
  () => {
    const diagnostics = Deno.lint.runPlugin(
      myPlugin,
      "test.ts",
      `class DataService {
        getData() {
          if (Math.random() > 0.5) {
            throw new Error("Random error");
          }
          return "data";
        }
      }`
    );

    assertEquals(diagnostics.length, 1);
    const d = diagnostics[0];
    assertEquals(d.id, "do-try/throw-needs-do-prefix");
    assertEquals(
      d.message,
      "Function 'getData' contains throw statement, so it must start with 'do'"
    );
  }
);
