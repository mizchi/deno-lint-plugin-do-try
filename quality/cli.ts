/**
 * コード品質計算モジュールのCLIインターフェース
 *
 * このファイルでは、コマンドライン引数を解析して、コード品質計算モジュールの機能を提供します。
 *
 * 使用例:
 * ```
 * $ complexity foo.ts
 * 131
 *
 * $ complexity foo.ts --hotspot
 * 131
 * [hotspot]
 * foo.ts:10
 * foo.ts:15
 *
 * $ complexity module foo.ts bar.ts
 * foo.ts file:61 module:124
 * bar.ts file:63 module:0
 * ```
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
コード複雑度計算ツール

使用方法:
  complexity [オプション] <ファイルパス...>
  complexity <コマンド> [オプション] <ファイルパス...>

コマンド:
  module    モジュールの複雑度を計算します
  compare   2つのファイルの複雑度を比較します
  help      ヘルプメッセージを表示します

オプション:
  --hotspot  ホットスポット（複雑度が高い箇所）を表示します

例:
  complexity foo.ts                    # 基本的な複雑度計算
  complexity foo.ts --hotspot          # ホットスポットの表示
  complexity module foo.ts bar.ts      # モジュール複雑度の計算
  complexity compare foo.ts bar.ts     # 2つのファイルの複雑度を比較
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
/**
 * 単一ファイルの複雑度を簡潔な形式で表示する
 * @param filePath ファイルパス
 * @param showHotspots ホットスポットを表示するかどうか
 */
async function analyzeFileSimple(
  filePath: string,
  showHotspots: boolean = false,
): Promise<void> {
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

    // 複雑度スコアのみを出力
    console.log(score.toFixed(0));

    // ホットスポットを表示する場合
    if (showHotspots && metrics.hotspots.length > 0) {
      console.log("[hotspot]");

      // 行番号でソート
      const sortedHotspots = [...metrics.hotspots].sort((a, b) =>
        a.line - b.line
      );

      // 上位5件のホットスポットを表示
      const uniqueLines = new Set<number>();
      for (const hotspot of sortedHotspots) {
        if (!uniqueLines.has(hotspot.line)) {
          uniqueLines.add(hotspot.line);
          console.log(`${relativePath}:${hotspot.line}`);

          // 5件表示したら終了
          if (uniqueLines.size >= 5) break;
        }
      }
    }
  } catch (error) {
    console.error(
      `エラー: ファイル '${filePath}' の分析中にエラーが発生しました`,
    );
    console.error(error);
    Deno.exit(1);
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
// detectHotspots関数は不要になったため削除

/**
 * 複数ファイルのホットスポットを検出して表示する
 * @param filePaths ファイルパスの配列
 * @param limit 表示するホットスポットの最大数（省略時は5件）
 */
// detectHotspotsInFiles関数は不要になったため削除

/**
 * モジュールの複雑度を計算する
 * @param filePaths ファイルパスの配列
 */
/**
 * モジュールの複雑度を計算して簡潔な形式で表示する
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
      Deno.exit(1);
    }
  }

  // モジュールの複雑度を計算
  const results = calculateModulesComplexity(filePaths, fileContents);

  // 各ファイルの複雑度を簡潔な形式で出力
  for (const result of results) {
    // CWDからの相対パスを取得
    const relativePath = Deno.cwd() === "/"
      ? result.path
      : result.path.startsWith(Deno.cwd())
      ? result.path.slice(Deno.cwd().length + 1)
      : result.path;

    const fileScore = result.fileComplexity;
    const moduleScore = result.moduleComplexity;

    console.log(
      `${relativePath} file:${fileScore.toFixed(0)} module:${
        moduleScore.toFixed(0)
      }`,
    );
  }
}

/**
 * コマンドライン引数を解析する
 * @param args コマンドライン引数
 * @returns 解析結果
 */
/**
 * コマンドライン引数を解析する
 * @param args コマンドライン引数
 * @returns 解析結果
 */
function parseArgs(args: string[]): {
  command: string | null;
  filePaths: string[];
  hotspot: boolean;
} {
  let command: string | null = null;
  let filePaths: string[] = [];
  let hotspot = false;

  // 引数を順番に処理
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // オプションの処理
    if (arg.startsWith("--")) {
      if (arg === "--hotspot") {
        hotspot = true;
      }
      continue;
    }

    // コマンドの処理（最初の非オプション引数）
    if (command === null && ["module", "compare", "help"].includes(arg)) {
      command = arg;
      continue;
    }

    // ファイルパスの処理
    filePaths.push(arg);
  }

  return {
    command,
    filePaths,
    hotspot,
  };
}

/**
 * メイン関数
 */
/**
 * メイン関数
 */
async function main(): Promise<void> {
  const args = Deno.args;

  if (args.length === 0 || args.includes("help") || args.includes("--help")) {
    showHelp();
    return;
  }

  const { command, filePaths, hotspot } = parseArgs(args);

  if (filePaths.length === 0) {
    console.error("エラー: 少なくとも1つのファイルパスを指定してください");
    showHelp();
    Deno.exit(1);
  }

  // コマンドに基づいて処理を分岐
  if (command === "module") {
    // モジュール複雑度の計算
    await analyzeModuleComplexity(filePaths);
  } else if (command === "compare") {
    // 2つのファイルの複雑度を比較
    if (filePaths.length < 2) {
      console.error("エラー: 2つのファイルパスを指定してください");
      showHelp();
      Deno.exit(1);
    }
    await compareFiles(filePaths[0], filePaths[1]);
  } else {
    // 基本的な複雑度計算（デフォルト）
    // 単一ファイルの場合は簡潔な出力
    if (filePaths.length === 1) {
      await analyzeFileSimple(filePaths[0], hotspot);
    } else {
      // 複数ファイルの場合は各ファイルを処理
      for (const filePath of filePaths) {
        const relativePath = Deno.cwd() === "/"
          ? filePath
          : filePath.startsWith(Deno.cwd())
          ? filePath.slice(Deno.cwd().length + 1)
          : filePath;

        console.log(`${relativePath}:`);
        await analyzeFileSimple(filePath, hotspot);
        console.log(); // 空行を挿入
      }
    }
  }
}

// スクリプトが直接実行された場合にメイン関数を実行
if (import.meta.main) {
  main().catch((error) => {
    console.error("エラーが発生しました:", error);
    Deno.exit(1);
  });
}
