/**
 * medium.ts
 *
 * このファイルは中程度の複雑さを持つコードサンプルを提供します。
 * クラス定義と継承、複数の関数と相互作用、条件分岐やループ、エラーハンドリングなどを含みます。
 */

/**
 * 基本的な計算機クラス
 */
export class Calculator {
  protected value: number;

  constructor(initialValue: number = 0) {
    this.value = initialValue;
  }

  add(num: number): this {
    this.value += num;
    return this;
  }

  subtract(num: number): this {
    this.value -= num;
    return this;
  }

  multiply(num: number): this {
    this.value *= num;
    return this;
  }

  divide(num: number): this {
    if (num === 0) {
      throw new Error("0で割ることはできません");
    }
    this.value /= num;
    return this;
  }

  getValue(): number {
    return this.value;
  }
}

/**
 * 計算履歴を保持する拡張計算機クラス
 */
export class HistoryCalculator extends Calculator {
  private history: Array<{
    operation: string;
    operand: number;
    result: number;
  }> = [];

  constructor(initialValue: number = 0) {
    super(initialValue);
    this.addToHistory("初期化", initialValue, initialValue);
  }

  override add(num: number): this {
    super.add(num);
    this.addToHistory("加算", num, this.value);
    return this;
  }

  override subtract(num: number): this {
    super.subtract(num);
    this.addToHistory("減算", num, this.value);
    return this;
  }

  override multiply(num: number): this {
    super.multiply(num);
    this.addToHistory("乗算", num, this.value);
    return this;
  }

  override divide(num: number): this {
    try {
      super.divide(num);
      this.addToHistory("除算", num, this.value);
    } catch (error) {
      this.addToHistory("エラー", num, this.value);
      throw error;
    }
    return this;
  }

  private addToHistory(
    operation: string,
    operand: number,
    result: number,
  ): void {
    this.history.push({ operation, operand, result });
  }

  getHistory(): Array<{
    operation: string;
    operand: number;
    result: number;
  }> {
    return [...this.history];
  }

  clearHistory(): void {
    let oldHistory = this.history;
    this.history = [];
    this.addToHistory("履歴クリア", 0, this.value);
  }
}

/**
 * 数値配列を処理するユーティリティクラス
 */
export class ArrayProcessor {
  private data: number[];

  constructor(data: number[]) {
    this.data = [...data];
  }

  /**
   * 配列の要素をフィルタリングする
   */
  filter(predicate: (value: number, index: number) => boolean): number[] {
    const result: number[] = [];
    for (let i = 0; i < this.data.length; i++) {
      if (predicate(this.data[i], i)) {
        result.push(this.data[i]);
      }
    }
    return result;
  }

  /**
   * 配列の要素を変換する
   */
  map(callback: (value: number, index: number) => number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this.data.length; i++) {
      result.push(callback(this.data[i], i));
    }
    return result;
  }

  /**
   * 配列の要素を集計する
   */
  reduce(
    callback: (accumulator: number, currentValue: number) => number,
    initialValue?: number,
  ): number {
    if (this.data.length === 0 && initialValue === undefined) {
      throw new Error("空の配列に初期値なしでreduceを実行できません");
    }

    let accumulator: number;
    let startIndex: number;

    if (initialValue !== undefined) {
      accumulator = initialValue;
      startIndex = 0;
    } else {
      accumulator = this.data[0];
      startIndex = 1;
    }

    for (let i = startIndex; i < this.data.length; i++) {
      accumulator = callback(accumulator, this.data[i]);
    }

    return accumulator;
  }

  /**
   * 配列の要素をソートする
   */
  sort(compareFn?: (a: number, b: number) => number): number[] {
    const sortedData = [...this.data];

    if (compareFn) {
      // カスタム比較関数を使用
      for (let i = 0; i < sortedData.length - 1; i++) {
        for (let j = 0; j < sortedData.length - i - 1; j++) {
          if (compareFn(sortedData[j], sortedData[j + 1]) > 0) {
            // 要素を交換
            const temp = sortedData[j];
            sortedData[j] = sortedData[j + 1];
            sortedData[j + 1] = temp;
          }
        }
      }
    } else {
      // デフォルトの昇順ソート
      for (let i = 0; i < sortedData.length - 1; i++) {
        for (let j = 0; j < sortedData.length - i - 1; j++) {
          if (sortedData[j] > sortedData[j + 1]) {
            // 要素を交換
            const temp = sortedData[j];
            sortedData[j] = sortedData[j + 1];
            sortedData[j + 1] = temp;
          }
        }
      }
    }

    return sortedData;
  }

  /**
   * 配列の統計情報を計算する
   */
  getStatistics(): { min: number; max: number; avg: number; sum: number } {
    if (this.data.length === 0) {
      throw new Error("空の配列の統計を計算できません");
    }

    let min = this.data[0];
    let max = this.data[0];
    let sum = 0;

    for (const value of this.data) {
      if (value < min) min = value;
      if (value > max) max = value;
      sum += value;
    }

    const avg = sum / this.data.length;

    return { min, max, avg, sum };
  }
}

/**
 * ファイル操作をシミュレートする関数
 */
export function processFile(
  filename: string,
  operation: "read" | "write" | "delete",
  content?: string,
): { success: boolean; data?: string; error?: string } {
  try {
    // ファイル操作のシミュレーション
    if (operation === "read") {
      // ファイル読み込みのシミュレーション
      if (filename.endsWith(".txt") || filename.endsWith(".json")) {
        return { success: true, data: `${filename}の内容` };
      } else {
        throw new Error("サポートされていないファイル形式です");
      }
    } else if (operation === "write") {
      // ファイル書き込みのシミュレーション
      if (!content) {
        throw new Error("書き込む内容が指定されていません");
      }

      if (filename.endsWith(".txt") || filename.endsWith(".json")) {
        return { success: true };
      } else {
        throw new Error("サポートされていないファイル形式です");
      }
    } else if (operation === "delete") {
      // ファイル削除のシミュレーション
      if (filename.includes("protected")) {
        throw new Error("保護されたファイルは削除できません");
      }
      return { success: true };
    } else {
      throw new Error("不明な操作です");
    }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "不明なエラーが発生しました" };
  }
}
