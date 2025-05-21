/**
 * Deno.lintのラッパー、リント結果の取得とパース
 */

import type { LintResult } from "./types.ts";

/**
 * コード文字列をリントし、結果を取得する
 * @param code リント対象のコード文字列
 * @param tempFilePath 一時ファイルのパス（デフォルト: "./temp_lint_file.ts"）
 * @returns リント結果の配列
 */
export async function getLintResults(
  code: string,
  tempFilePath = "./temp_lint_file.ts",
): Promise<LintResult[]> {
  try {
    // 一時ファイルにコードを書き出す
    await Deno.writeTextFile(tempFilePath, code);

    // deno lint --json コマンドを実行
    const command = new Deno.Command("deno", {
      args: ["lint", "--json", tempFilePath],
      stdout: "piped",
      stderr: "piped",
    });

    // 実行結果を取得
    const { success, stdout, stderr } = await command.output();

    // 一時ファイルを削除
    try {
      await Deno.remove(tempFilePath);
    } catch (error) {
      console.warn(`一時ファイル ${tempFilePath} の削除に失敗しました:`, error);
    }

    // エラーチェック
    if (!success) {
      const errorMessage = new TextDecoder().decode(stderr);
      console.error("deno lint コマンドの実行に失敗しました:", errorMessage);
      return [];
    }

    // 出力をJSONとしてパース
    const output = new TextDecoder().decode(stdout);

    // 出力が空の場合（リント警告なし）は空配列を返す
    if (!output.trim()) {
      return [];
    }

    try {
      const lintResults = JSON.parse(output);

      // 結果を整形して返す
      return lintResults.map((result: any) => ({
        rule: result.rule || result.ruleName || "unknown-rule",
        message: result.message || "",
        line: result.line || 0,
        col: result.col || result.column || 0,
        filename: result.filename || tempFilePath,
      }));
    } catch (error) {
      console.error("リント結果のJSONパースに失敗しました:", error);
      return [];
    }
  } catch (error) {
    console.error("リント処理中にエラーが発生しました:", error);
    return [];
  }
}
