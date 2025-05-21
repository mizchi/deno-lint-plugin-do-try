/**
 * コード品質計算モジュールのCLIインターフェース
 *
 * このファイルでは、コマンドライン引数を解析して、コード品質計算モジュールの機能を提供します。
 */

import {
  analyzeCodeComplexity,
  calculateComplexityScore,
  calculateModulesComplexity,
  compareCodeComplexity,
  generateComparisonReport,
  generateDetailedComplexityReport,
  generateHotspotReport,
  generateMetricsReport,
  generateModuleComplexityReport,
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
  analyze <ファイルパス...>              複数ファイルの複雑度を分析します
  compare <ファイルパスA> <ファイルパスB> 2つのファイルの複雑度を比較します
  report <ファイルパス...>               複数ファイルの詳細レポートを生成します
  module <ファイルパス...>               モジュールの複雑度を計算します
  help                                 ヘルプメッセージを表示します

オプション:
  --hotspot [表示数]                    ホットスポットを表示します（analyzeとreportコマンドで使用可能）

例:
  deno run --allow-read quality/cli.ts analyze path/to/file1.ts path/to/file2.ts
  deno run --allow-read quality/cli.ts analyze --hotspot 5 path/to/file1.ts path/to/file2.ts
  deno run --allow-read quality/cli.ts compare path/to/fileA.ts path/to/fileB.ts
  deno run --allow-read quality/cli.ts report path/to/file1.ts path/to/file2.ts
  deno run --allow-read quality/cli.ts report --hotspot path/to/file1.ts path/to/file2.ts
  deno run --allow-read quality/cli.ts module examples/module_test/d.ts
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
  try {
    const code = await readFile(filePath);
    const metrics = analyzeCodeComplexity(code);
    const score = calculateComplexityScore(metrics);

    // CWDからの相対パスを取得
    const relativePath = Deno.cwd() === "/"
      ? filePath
      : filePath.startsWith(Deno.cwd())
      ? filePath.slice(Deno.cwd().length + 1)
      : filePath;

    console.log(`\n=== ${relativePath} の複雑度分析結果 ===\n`);
    console.log(`総合スコア: ${score.toFixed(2)}`);
    console.log("\n詳細指標:");
    console.log(
      `- 変数の変更可能性: ${metrics.variableMutabilityScore.toFixed(2)}`,
    );
    console.log(
      `- スコープの複雑さ: ${metrics.scopeComplexityScore.toFixed(2)}`,
    );
    console.log(`- 代入操作: ${metrics.assignmentScore.toFixed(2)}`);
    console.log(
      `- 関数の複雑さ: ${metrics.functionComplexityScore.toFixed(2)}`,
    );
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
    return;
  } catch (error) {
    console.error(
      `エラー: ファイル '${filePath}' の分析中にエラーが発生しました`,
    );
    console.error(error);
  }
}

/**
 * 複数ファイルの複雑度を分析する
 * @param filePaths ファイルパスの配列
 */
/**
 * 複数ファイルの複雑度を簡潔な形式で表示する
 * @param filePaths ファイルパスの配列
 */
async function analyzeFilesSimple(filePaths: string[]): Promise<void> {
  if (filePaths.length === 0) {
    console.error("エラー: 分析するファイルが指定されていません");
    return;
  }

  for (const filePath of filePaths) {
    try {
      const code = await readFile(filePath);
      const metrics = analyzeCodeComplexity(code);
      const score = calculateComplexityScore(metrics);

      // CWDからの相対パスを取得
      const relativePath = Deno.cwd() === "/"
        ? filePath
        : filePath.startsWith(Deno.cwd())
        ? filePath.slice(Deno.cwd().length + 1)
        : filePath;

      // 簡潔な形式で出力: ファイルパス スコア
      console.log(`${relativePath} ${score.toFixed(0)}`);
    } catch (error) {
      console.error(
        `エラー: ファイル '${filePath}' の分析中にエラーが発生しました`,
      );
      console.error(error);
    }
  }
}

/**
 * 複数ファイルの複雑度を詳細な形式で表示する
 * @param filePaths ファイルパスの配列
 */
async function analyzeFiles(filePaths: string[]): Promise<void> {
  if (filePaths.length === 0) {
    console.error("エラー: 分析するファイルが指定されていません");
    return;
  }

  console.log(`${filePaths.length}個のファイルを分析します...\n`);

  for (const filePath of filePaths) {
    await analyzeFile(filePath);
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
  try {
    const codeA = await readFile(filePathA);
    const codeB = await readFile(filePathB);

    const comparison = compareCodeComplexity(codeA, codeB);

    // CWDからの相対パスを取得
    const relativePathA = Deno.cwd() === "/"
      ? filePathA
      : filePathA.startsWith(Deno.cwd())
      ? filePathA.slice(Deno.cwd().length + 1)
      : filePathA;

    const relativePathB = Deno.cwd() === "/"
      ? filePathB
      : filePathB.startsWith(Deno.cwd())
      ? filePathB.slice(Deno.cwd().length + 1)
      : filePathB;

    console.log(
      `\n=== ${relativePathA} と ${relativePathB} の複雑度比較 ===\n`,
    );
    console.log(`${relativePathA} のスコア: ${comparison.scoreA.toFixed(2)}`);
    console.log(`${relativePathB} のスコア: ${comparison.scoreB.toFixed(2)}`);

    if (comparison.betterCode === "A") {
      console.log(
        `\n結果: ${relativePathA} の方が複雑度が低く、より良いコードです。`,
      );
    } else if (comparison.betterCode === "B") {
      console.log(
        `\n結果: ${relativePathB} の方が複雑度が低く、より良いコードです。`,
      );
    } else {
      console.log("\n結果: 両方のコードの複雑度は同等です。");
    }

    console.log("\n詳細な比較:");
    console.log("| 指標 | " + relativePathA + " | " + relativePathB + " |");
    console.log(
      "|------|" + "-".repeat(relativePathA.length) + "|" +
        "-".repeat(relativePathB.length) + "|",
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
  } catch (error) {
    console.error(`エラー: ファイルの比較中にエラーが発生しました`);
    console.error(error);
  }
}

/**
 * 詳細レポートを生成する
 * @param filePath ファイルパス
 */
async function generateReport(filePath: string): Promise<void> {
  try {
    const code = await readFile(filePath);
    const report = generateDetailedComplexityReport(code);

    // CWDからの相対パスを取得
    const relativePath = Deno.cwd() === "/"
      ? filePath
      : filePath.startsWith(Deno.cwd())
      ? filePath.slice(Deno.cwd().length + 1)
      : filePath;

    console.log(`\n=== ${relativePath} の詳細レポート ===\n`);
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
  } catch (error) {
    console.error(
      `エラー: ファイル '${filePath}' のレポート生成中にエラーが発生しました`,
    );
    console.error(error);
  }
}

/**
 * 複数ファイルの詳細レポートを生成する
 * @param filePaths ファイルパスの配列
 */
async function generateReports(filePaths: string[]): Promise<void> {
  if (filePaths.length === 0) {
    console.error("エラー: レポートを生成するファイルが指定されていません");
    return;
  }

  console.log(`${filePaths.length}個のファイルのレポートを生成します...\n`);

  for (const filePath of filePaths) {
    await generateReport(filePath);
  }
}

/**
 * ホットスポットを検出して表示する
 * @param filePath ファイルパス
 * @param limit 表示するホットスポットの最大数（省略時は5件）
 */
async function detectHotspots(
  filePath: string,
  limit: number = 5,
): Promise<void> {
  try {
    const code = await readFile(filePath);
    const metrics = analyzeCodeComplexity(code);

    // CWDからの相対パスを取得
    const relativePath = Deno.cwd() === "/"
      ? filePath
      : filePath.startsWith(Deno.cwd())
      ? filePath.slice(Deno.cwd().length + 1)
      : filePath;

    console.log(`\n=== ${relativePath} のホットスポット ===\n`);

    if (metrics.hotspots.length === 0) {
      console.log("ホットスポットはありません");
      return;
    }

    // 上位N件のホットスポットを取得（重複を考慮して多めに取得）
    const topHotspots = metrics.hotspots.slice(0, limit * 2);

    // 行番号の重複を除去
    const uniqueLines = new Set<number>();
    const uniqueHotspots: typeof topHotspots = [];

    for (const hotspot of topHotspots) {
      if (!uniqueLines.has(hotspot.line)) {
        uniqueLines.add(hotspot.line);
        uniqueHotspots.push(hotspot);

        // 指定された上限に達したら終了
        if (uniqueHotspots.length >= limit) {
          break;
        }
      }
    }

    // 行番号でソート
    uniqueHotspots.sort((a, b) => a.line - b.line);

    // VSCodeでコードジャンプできる形式で表示
    uniqueHotspots.forEach((hotspot) => {
      console.log(`${relativePath}:${hotspot.line}`);
    });
  } catch (error) {
    console.error(
      `エラー: ファイル '${filePath}' のホットスポット検出中にエラーが発生しました`,
    );
    console.error(error);
  }
}

/**
 * 複数ファイルのホットスポットを検出して表示する
 * @param filePaths ファイルパスの配列
 * @param limit 表示するホットスポットの最大数（省略時は5件）
 */
async function detectHotspotsInFiles(
  filePaths: string[],
  limit: number = 5,
): Promise<void> {
  if (filePaths.length === 0) {
    console.error(
      "エラー: ホットスポットを検出するファイルが指定されていません",
    );
    return;
  }

  console.log(
    `${filePaths.length}個のファイルのホットスポットを検出します...\n`,
  );

  for (const filePath of filePaths) {
    await detectHotspots(filePath, limit);
  }
}

/**
 * モジュールの複雑度を計算する
 * @param filePaths ファイルパスの配列
 */
async function analyzeModuleComplexity(filePaths: string[]): Promise<void> {
  if (filePaths.length === 0) {
    console.error("エラー: 分析するファイルが指定されていません");
    return;
  }

  // ファイル内容を読み込む
  const fileContents = new Map<string, string>();
  for (const filePath of filePaths) {
    try {
      const content = await readFile(filePath);
      fileContents.set(filePath, content);
    } catch (error) {
      console.error(`エラー: ファイル '${filePath}' の読み込みに失敗しました`);
      console.error(error);
    }
  }

  // モジュールの複雑度を計算
  const results = calculateModulesComplexity(filePaths, fileContents);

  // レポートを生成して出力
  const report = generateModuleComplexityReport(results);
  console.log(report);
}

/**
 * コマンドライン引数を解析する
 * @param args コマンドライン引数
 * @returns 解析結果
 */
function parseArgs(args: string[]): {
  command: string;
  filePaths: string[];
  hotspot: boolean;
  hotspotLimit?: number;
} {
  const command = args[0];
  let filePaths: string[] = [];
  let hotspot = false;
  let hotspotLimit: number | undefined = undefined;

  // --hotspotフラグを探す
  const hotspotIndex = args.findIndex((arg) => arg === "--hotspot");

  if (hotspotIndex !== -1) {
    hotspot = true;

    // --hotspotの次の引数が数値の場合は表示数として扱う
    if (
      hotspotIndex + 1 < args.length &&
      !args[hotspotIndex + 1].startsWith("--") &&
      !isNaN(Number(args[hotspotIndex + 1]))
    ) {
      hotspotLimit = parseInt(args[hotspotIndex + 1]);

      // コマンド名、--hotspotフラグ、表示数を除いた残りの引数がファイルパス
      filePaths = [
        ...args.slice(1, hotspotIndex),
        ...args.slice(hotspotIndex + 2),
      ];
    } else {
      // コマンド名と--hotspotフラグを除いた残りの引数がファイルパス
      filePaths = [
        ...args.slice(1, hotspotIndex),
        ...args.slice(hotspotIndex + 1),
      ];
    }
  } else {
    // コマンド名を除いた残りの引数がファイルパス
    filePaths = args.slice(1);
  }

  return {
    command,
    filePaths,
    hotspot,
    hotspotLimit,
  };
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

  const { command, filePaths, hotspot, hotspotLimit } = parseArgs(args);

  switch (command) {
    case "analyze":
      if (filePaths.length === 0) {
        console.error("エラー: 少なくとも1つのファイルパスを指定してください");
        showHelp();
        Deno.exit(1);
      }

      if (hotspot) {
        // ホットスポットを表示する場合
        await detectHotspotsInFiles(filePaths, hotspotLimit);
      } else {
        // 通常の分析を行う場合
        await analyzeFilesSimple(filePaths);
      }
      break;

    case "compare":
      if (filePaths.length < 2) {
        console.error("エラー: 2つのファイルパスを指定してください");
        showHelp();
        Deno.exit(1);
      }
      await compareFiles(filePaths[0], filePaths[1]);
      break;

    case "report":
      if (filePaths.length === 0) {
        console.error("エラー: 少なくとも1つのファイルパスを指定してください");
        showHelp();
        Deno.exit(1);
      }

      if (hotspot) {
        // ホットスポットを表示する場合
        await detectHotspotsInFiles(filePaths, hotspotLimit);
      } else {
        // 通常のレポートを生成する場合
        await generateReports(filePaths);
      }
      break;

    case "help":
      showHelp();
      break;

    case "module":
      if (filePaths.length === 0) {
        console.error("エラー: 少なくとも1つのファイルパスを指定してください");
        showHelp();
        Deno.exit(1);
      }
      await analyzeModuleComplexity(filePaths);
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
