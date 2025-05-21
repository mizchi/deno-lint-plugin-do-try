/**
 * switch文の複雑度に関する統合テスト
 *
 * このテストでは、switch文とif文の比較や、switch文の複雑さに関するテストを実施します。
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

// テストケース1: 単一のswitchと同等の複数のifの比較
Deno.test("単一のswitchは同等の複数のifよりも良い", () => {
  const codeA = `
    function test(a) {
      switch (a) {
        case 1:
          return "one";
        case 2:
          return "two";
        case 3:
          return "three";
        default:
          return "other";
      }
    }
  `;

  const codeB = `
    function test(a) {
      if (a === 1) {
        return "one";
      } else if (a === 2) {
        return "two";
      } else if (a === 3) {
        return "three";
      } else {
        return "other";
      }
    }
  `;

  assertCodeComparison(
    codeA,
    codeB,
    "A",
    "単一のswitchは同等の複数のifよりも良いはず",
  );
});

// テストケース2: 単純なswitchと複雑なswitchの比較
Deno.test("単純なswitchは複雑なswitchよりも良い", () => {
  const codeA = `
    function test(a) {
      switch (a) {
        case 1:
          return "one";
        case 2:
          return "two";
        default:
          return "other";
      }
    }
  `;

  const codeB = `
    function test(a) {
      switch (a) {
        case 1:
          return "one";
        case 2:
          return "two";
        case 3:
          return "three";
        case 4:
          return "four";
        case 5:
          return "five";
        case 6:
          return "six";
        default:
          return "other";
      }
    }
  `;

  assertCodeComparison(
    codeA,
    codeB,
    "A",
    "単純なswitchは複雑なswitchよりも良いはず",
  );
});

// テストケース3: switchとif-elseチェーンの比較
Deno.test("switchはif-elseチェーンよりも良い", () => {
  const codeA = `
    function test(a) {
      switch (a) {
        case 1:
          return "one";
        case 2:
          return "two";
        case 3:
          return "three";
        default:
          return "other";
      }
    }
  `;

  const codeB = `
    function test(a) {
      if (a === 1) {
        return "one";
      }
      if (a === 2) {
        return "two";
      }
      if (a === 3) {
        return "three";
      }
      return "other";
    }
  `;

  assertCodeComparison(
    codeA,
    codeB,
    "A",
    "switchはif-elseチェーンよりも良いはず",
  );
});

// テストケース4: caseの数が少ないswitchと多いswitchの比較
Deno.test("caseの数が少ないswitchは多いswitchよりも良い", () => {
  const codeA = `
    function test(a) {
      switch (a) {
        case 1:
          return "one";
        case 2:
          return "two";
        default:
          return "other";
      }
    }
  `;

  const codeB = `
    function test(a) {
      switch (a) {
        case 1:
          return "one";
        case 2:
          return "two";
        case 3:
          return "three";
        case 4:
          return "four";
        case 5:
          return "five";
        case 6:
          return "six";
        case 7:
          return "seven";
        case 8:
          return "eight";
        case 9:
          return "nine";
        case 10:
          return "ten";
        default:
          return "other";
      }
    }
  `;

  assertCodeComparison(
    codeA,
    codeB,
    "A",
    "caseの数が少ないswitchは多いswitchよりも良いはず",
  );
});

// テストケース5: 単純なcase処理と複雑なcase処理の比較
Deno.test("単純なcase処理は複雑なcase処理よりも良い", () => {
  const codeA = `
    function test(a) {
      switch (a) {
        case 1:
          return "one";
        case 2:
          return "two";
        default:
          return "other";
      }
    }
  `;

  const codeB = `
    function test(a) {
      switch (a) {
        case 1:
          let result = "o";
          result += "n";
          result += "e";
          return result;
        case 2:
          let temp = 0;
          temp += 1;
          if (temp > 0) {
            return "two";
          }
          return "unknown";
        default:
          return "other";
      }
    }
  `;

  assertCodeComparison(
    codeA,
    codeB,
    "A",
    "単純なcase処理は複雑なcase処理よりも良いはず",
  );
});

// テストケース6: フォールスルーなしのswitchとフォールスルーありのswitchの比較
Deno.test("フォールスルーなしのswitchはフォールスルーありのswitchよりも良い", () => {
  const codeA = `
    function test(a) {
      switch (a) {
        case 1:
          return "one";
        case 2:
          return "two";
        case 3:
          return "three";
        default:
          return "other";
      }
    }
  `;

  const codeB = `
    function test(a) {
      let result = "";
      switch (a) {
        case 1:
          result = "one";
          break;
        case 2:
          result = "two";
          // フォールスルー
        case 3:
          result += " three";
          break;
        default:
          result = "other";
      }
      return result;
    }
  `;

  assertCodeComparison(
    codeA,
    codeB,
    "A",
    "フォールスルーなしのswitchはフォールスルーありのswitchよりも良いはず",
  );
});
