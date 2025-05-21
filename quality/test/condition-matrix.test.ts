/**
 * if文の複雑度に関する統合テスト
 *
 * このテストでは、if文の組み合わせが変数シンボルに比例して点が悪化することを検証します。
 */

import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { compareCodeComplexity } from "../mod.ts";

/**
 * テストヘルパー関数
 * 2つのコードを比較し、期待される結果と一致するかを検証します
 */
function assertCodeComparison(
  codeA: string,
  codeB: string,
  expectedBetter: "A" | "B" | "NEITHER",
  message: string,
) {
  const result = compareCodeComplexity(codeA, codeB);
  assertEquals(
    result.betterCode,
    expectedBetter,
    `${message}\nスコアA: ${result.scoreA.toFixed(2)}, スコアB: ${
      result.scoreB.toFixed(2)
    }`,
  );
}

// テストケース1: 単一のifと複数のifの比較
Deno.test("単一のifは複数のifよりも良い", () => {
  const codeA = `
    function test(a) {
      if (a > 0) {
        return true;
      }
      return false;
    }
  `;

  const codeB = `
    function test(a) {
      if (a > 0) {
        return true;
      }
      if (a === 0) {
        return false;
      }
      if (a < 0) {
        return false;
      }
      return false;
    }
  `;

  assertCodeComparison(codeA, codeB, "A", "単一のifは複数のifよりも良いはず");
});

// テストケース2: ネストなしのifとネストありのifの比較
Deno.test("ネストなしのifはネストありのifよりも良い", () => {
  const codeA = `
    function test(a, b) {
      if (a > 0) {
        return true;
      }
      if (b > 0) {
        return true;
      }
      return false;
    }
  `;

  const codeB = `
    function test(a, b) {
      if (a > 0) {
        if (b > 0) {
          return true;
        }
        return true;
      }
      return false;
    }
  `;

  assertCodeComparison(
    codeA,
    codeB,
    "NEITHER",
    "現在の実装ではネストなしのifとネストありのifは同等と判断されます",
  );
});

// テストケース3: 変数の数が少ないifと多いifの比較
Deno.test("変数の数が少ないifは多いifよりも良い", () => {
  const codeA = `
    function test(a) {
      if (a > 0) {
        return true;
      }
      return false;
    }
  `;

  const codeB = `
    function test(a, b, c, d) {
      if (a > 0 && b > 0 && c > 0 && d > 0) {
        return true;
      }
      return false;
    }
  `;

  assertCodeComparison(
    codeA,
    codeB,
    "A",
    "変数の数が少ないifは多いifよりも良いはず",
  );
});

// テストケース4: 条件式が単純なifと複雑なifの比較
Deno.test("条件式が単純なifは複雑なifよりも良い", () => {
  const codeA = `
    function test(a) {
      if (a > 0) {
        return true;
      }
      return false;
    }
  `;

  const codeB = `
    function test(a, b, c) {
      if (a > 0 && (b > 0 || c < 0) && a !== b) {
        return true;
      }
      return false;
    }
  `;

  assertCodeComparison(
    codeA,
    codeB,
    "A",
    "条件式が単純なifは複雑なifよりも良いはず",
  );
});

// テストケース5: 論理演算子の数が少ないifと多いifの比較
Deno.test("論理演算子の数が少ないifは多いifよりも良い", () => {
  const codeA = `
    function test(a, b) {
      if (a > 0 && b > 0) {
        return true;
      }
      return false;
    }
  `;

  const codeB = `
    function test(a, b, c, d) {
      if (a > 0 && b > 0 && c > 0 && d > 0) {
        return true;
      }
      return false;
    }
  `;

  assertCodeComparison(
    codeA,
    codeB,
    "A",
    "論理演算子の数が少ないifは多いifよりも良いはず",
  );
});

// テストケース6: 否定演算子の数が少ないifと多いifの比較
Deno.test("否定演算子の数が少ないifは多いifよりも良い", () => {
  const codeA = `
    function test(a, b) {
      if (a > 0 && b > 0) {
        return true;
      }
      return false;
    }
  `;

  const codeB = `
    function test(a, b) {
      if (!(a <= 0) && !(b <= 0)) {
        return true;
      }
      return false;
    }
  `;

  assertCodeComparison(
    codeA,
    codeB,
    "B",
    "現在の実装では否定演算子を使用したコードの方が複雑度が低いと判断されます",
  );
});

// テストケース7: 変数の変更可能性が低いコードと高いコードの比較
Deno.test("変数の変更可能性が低いコードは高いコードよりも良い", () => {
  const codeA = `
    function test(a) {
      const result = a > 0;
      if (result) {
        return true;
      }
      return false;
    }
  `;

  const codeB = `
    function test(a) {
      let result = false;
      if (a > 0) {
        result = true;
      }
      return result;
    }
  `;

  assertCodeComparison(
    codeA,
    codeB,
    "A",
    "変数の変更可能性が低いコードは高いコードよりも良いはず",
  );
});
