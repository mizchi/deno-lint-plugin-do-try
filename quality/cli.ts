/**
 * コード品質計算モジュールのCLIインターフェース
 *
 * このファイルでは、コマンドライン引数を解析して、コード品質計算モジュールの機能を提供します。
 */

import {
  analyzeCodeComplexity,
  calculateComplexityScore,
  compareCodeComplexity,
  generateComparisonReport,
  generateDetailedComplexityReport,
  generateHotspotReport,
  generateMetricsReport,
} from "./mod.ts";

/**
 * ヘルプメッセージを表示する
 */
function showHelp(): void {
  console.log(`
コード品質計算モジュール CLI

使用方法:
  deno run --allow-read quality/cli.ts <コマンド> [オプション]

コマンド:
  analyze <ファイルパス>                 単一ファイルの複雑度を分析します
  compare <ファイルパスA> <ファイルパスB> 2つのファイルの複雑度を比較します
  report <ファイルパス>                  詳細レポートを生成します
  hotspots <ファイルパス> [表示数]        ホットスポットを検出して表示します
  help                                 ヘルプメッセージを表示します

例:
  deno run --allow-read quality/cli.ts analyze path/to/file.ts
  deno run --allow-read quality/cli.ts compare path/to/fileA.ts path/to/fileB.ts
  deno run --allow-read quality/cli.ts report path/to/file.ts
  deno run --allow-read quality/cli.ts hotspots path/to/file.ts 5
  `);
}

/**
 * ファイルを読み込む
 * @param filePath ファイルパス
 * @returns ファイルの内容
 */
async function readFile(filePath: string): Promise<string> {
  try {
    return await Deno.readTextFile(filePath);
  } catch (error) {
    console.error(`エラー: ファイル '${filePath}' を読み込めませんでした`);
    console.error(error);
    Deno.exit(1);
  }
}

/**
 * 単一ファイルの複雑度を分析する
 * @param filePath ファイルパス
 */
async function analyzeFile(filePath: string): Promise<void> {
  const code = await readFile(filePath);
  const metrics = analyzeCodeComplexity(code);
  const score = calculateComplexityScore(metrics);

  console.log(`\n=== ${filePath} の複雑度分析結果 ===\n`);
  console.log(`総合スコア: ${score.toFixed(2)}`);
  console.log("\n詳細指標:");
  console.log(
    `- 変数の変更可能性: ${metrics.variableMutabilityScore.toFixed(2)}`,
  );
  console.log(`- スコープの複雑さ: ${metrics.scopeComplexityScore.toFixed(2)}`);
  console.log(`- 代入操作: ${metrics.assignmentScore.toFixed(2)}`);
  console.log(`- 関数の複雑さ: ${metrics.functionComplexityScore.toFixed(2)}`);
  console.log(
    `- 条件分岐の複雑さ: ${metrics.conditionalComplexityScore.toFixed(2)}`,
  );
  console.log(
    `- 例外処理の複雑さ: ${metrics.exceptionHandlingScore.toFixed(2)}`,
  );

  if (metrics.hotspots.length > 0) {
    console.log("\n主要なホットスポット（上位3件）:");
    metrics.hotspots.slice(0, 3).forEach((hotspot, index) => {
      console.log(
        `${index + 1}. ${hotspot.nodeType} (行: ${hotspot.line}): スコア ${
          hotspot.score.toFixed(2)
        }`,
      );
      console.log(`   理由: ${hotspot.reason}`);
    });
  } else {
    console.log("\nホットスポットはありません");
  }
}

/**
 * 2つのファイルの複雑度を比較する
 * @param filePathA ファイルパスA
 * @param filePathB ファイルパスB
 */
async function compareFiles(
  filePathA: string,
  filePathB: string,
): Promise<void> {
  const codeA = await readFile(filePathA);
  const codeB = await readFile(filePathB);

  const comparison = compareCodeComplexity(codeA, codeB);

  console.log(`\n=== ${filePathA} と ${filePathB} の複雑度比較 ===\n`);
  console.log(`${filePathA} のスコア: ${comparison.scoreA.toFixed(2)}`);
  console.log(`${filePathB} のスコア: ${comparison.scoreB.toFixed(2)}`);

  if (comparison.betterCode === "A") {
    console.log(
      `\n結果: ${filePathA} の方が複雑度が低く、より良いコードです。`,
    );
  } else if (comparison.betterCode === "B") {
    console.log(
      `\n結果: ${filePathB} の方が複雑度が低く、より良いコードです。`,
    );
  } else {
    console.log("\n結果: 両方のコードの複雑度は同等です。");
  }

  console.log("\n詳細な比較:");
  console.log("| 指標 | " + filePathA + " | " + filePathB + " |");
  console.log(
    "|------|" + "-".repeat(filePathA.length) + "|" +
      "-".repeat(filePathB.length) + "|",
  );
  console.log(
    `| 変数の変更可能性 | ${
      comparison.metricsA.variableMutabilityScore.toFixed(2)
    } | ${comparison.metricsB.variableMutabilityScore.toFixed(2)} |`,
  );
  console.log(
    `| スコープの複雑さ | ${
      comparison.metricsA.scopeComplexityScore.toFixed(2)
    } | ${comparison.metricsB.scopeComplexityScore.toFixed(2)} |`,
  );
  console.log(
    `| 代入操作 | ${comparison.metricsA.assignmentScore.toFixed(2)} | ${
      comparison.metricsB.assignmentScore.toFixed(2)
    } |`,
  );
  console.log(
    `| 関数の複雑さ | ${
      comparison.metricsA.functionComplexityScore.toFixed(2)
    } | ${comparison.metricsB.functionComplexityScore.toFixed(2)} |`,
  );
  console.log(
    `| 条件分岐の複雑さ | ${
      comparison.metricsA.conditionalComplexityScore.toFixed(2)
    } | ${comparison.metricsB.conditionalComplexityScore.toFixed(2)} |`,
  );
  console.log(
    `| 例外処理の複雑さ | ${
      comparison.metricsA.exceptionHandlingScore.toFixed(2)
    } | ${comparison.metricsB.exceptionHandlingScore.toFixed(2)} |`,
  );
}

/**
 * 詳細レポートを生成する
 * @param filePath ファイルパス
 */
async function generateReport(filePath: string): Promise<void> {
  const code = await readFile(filePath);
  const report = generateDetailedComplexityReport(code);

  console.log(`\n=== ${filePath} の詳細レポート ===\n`);
  console.log(`総合スコア: ${report.score.toFixed(2)}`);

  console.log("\n詳細指標の内訳:");
  for (const [metric, data] of Object.entries(report.breakdown)) {
    console.log(
      `- ${metric}: ${data.value.toFixed(2)} (重み付けスコア: ${
        data.weightedScore.toFixed(2)
      })`,
    );
  }

  if (report.hotspots.length > 0) {
    console.log("\nホットスポット:");
    report.hotspots.forEach((hotspot, index) => {
      console.log(
        `${index + 1}. ${hotspot.nodeType} (行: ${hotspot.line}): スコア ${
          hotspot.score.toFixed(2)
        }`,
      );
      console.log(`   理由: ${hotspot.reason}`);
    });
  } else {
    console.log("\nホットスポットはありません");
  }
}

/**
 * ホットスポットを検出して表示する
 * @param filePath ファイルパス
 * @param limit 表示するホットスポットの最大数（省略時は全て）
 */
async function detectHotspots(filePath: string, limit?: number): Promise<void> {
  const code = await readFile(filePath);
  const metrics = analyzeCodeComplexity(code);

  console.log(`\n=== ${filePath} のホットスポット ===\n`);

  if (metrics.hotspots.length === 0) {
    console.log("ホットスポットはありません");
    return;
  }

  const hotspots = limit ? metrics.hotspots.slice(0, limit) : metrics.hotspots;

  hotspots.forEach((hotspot, index) => {
    console.log(
      `${index + 1}. ${hotspot.nodeType} (行: ${hotspot.line}): スコア ${
        hotspot.score.toFixed(2)
      }`,
    );
    console.log(`   理由: ${hotspot.reason}`);
  });
}

/**
 * メイン関数
 */
async function main(): Promise<void> {
  const args = Deno.args;

  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case "analyze":
      if (args.length < 2) {
        console.error("エラー: ファイルパスを指定してください");
        showHelp();
        Deno.exit(1);
      }
      await analyzeFile(args[1]);
      break;

    case "compare":
      if (args.length < 3) {
        console.error("エラー: 2つのファイルパスを指定してください");
        showHelp();
        Deno.exit(1);
      }
      await compareFiles(args[1], args[2]);
      break;

    case "report":
      if (args.length < 2) {
        console.error("エラー: ファイルパスを指定してください");
        showHelp();
        Deno.exit(1);
      }
      await generateReport(args[1]);
      break;

    case "hotspots":
      if (args.length < 2) {
        console.error("エラー: ファイルパスを指定してください");
        showHelp();
        Deno.exit(1);
      }
      const limit = args.length > 2 ? parseInt(args[2]) : undefined;
      await detectHotspots(args[1], limit);
      break;

    case "help":
      showHelp();
      break;

    default:
      console.error(`エラー: 不明なコマンド '${command}'`);
      showHelp();
      Deno.exit(1);
  }
}

// スクリプトが直接実行された場合にメイン関数を実行
if (import.meta.main) {
  main().catch((error) => {
    console.error("エラーが発生しました:", error);
    Deno.exit(1);
  });
}
