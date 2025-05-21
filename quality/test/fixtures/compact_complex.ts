/**
 * compact_complex.ts
 *
 * このファイルは約100行程度の端的に複雑なコードサンプルを提供します。
 * ifの入れ子（ネストされた条件分岐）、try-catch（例外処理）、関数の相互呼び出しなどを含みます。
 * また、doプレフィックスを持つ関数の呼び出しパターンも含まれています。
 */

// カスタムエラークラスの定義
class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(`${field}: ${message}`);
    this.name = "ValidationError";
  }
}

class NetworkError extends Error {
  constructor(public statusCode: number, message: string) {
    super(`[${statusCode}] ${message}`);
    this.name = "NetworkError";
  }
}

// データ型の定義
type UserData = {
  id?: string;
  name: string;
  email: string;
  age: number;
  preferences?: {
    theme: "light" | "dark";
    notifications: boolean;
  };
};

// 相互に呼び出し合う関数群
async function doFetchUserData(userId: string): Promise<UserData> {
  // 非同期処理のシミュレーション
  await new Promise((resolve) => setTimeout(resolve, 100));

  // ランダムにエラーを発生させる
  if (Math.random() > 0.8) {
    throw new NetworkError(500, "サーバーエラーが発生しました");
  }

  return {
    id: userId,
    name: "ユーザー" + userId,
    email: `user${userId}@example.com`,
    age: 20 + Math.floor(Math.random() * 50),
    preferences: {
      theme: Math.random() > 0.5 ? "light" : "dark",
      notifications: Math.random() > 0.3,
    },
  };
}

// deno-lint-disable-file do-try/throw-needs-do-prefix
function validateUserData(data: UserData): void {
  // ネストされた条件分岐
  if (!data.name || data.name.trim() === "") {
    throw new ValidationError("name", "名前は必須です");
  } else if (data.name.length < 3) {
    throw new ValidationError("name", "名前は3文字以上である必要があります");
  }

  if (!data.email) {
    throw new ValidationError("email", "メールアドレスは必須です");
  } else if (!data.email.includes("@")) {
    throw new ValidationError("email", "メールアドレスの形式が不正です");
  }

  if (data.age < 18) {
    throw new ValidationError("age", "年齢は18歳以上である必要があります");
  }
}

async function doProcessUserData(userId: string): Promise<UserData> {
  let userData: UserData;

  try {
    // doプレフィックスの関数を呼び出し
    userData = await doFetchUserData(userId);

    // 検証処理
    validateUserData(userData);

    // 追加の処理
    return await enrichUserData(userData);
  } catch (error) {
    // エラーハンドリングの複雑な例
    if (error instanceof ValidationError) {
      console.error(`検証エラー: ${error.message}`);
      // デフォルト値で補完
      userData = {
        id: userId,
        name: "不明なユーザー",
        email: "unknown@example.com",
        age: 20,
      };
      return userData;
    } else if (error instanceof NetworkError) {
      console.error(`ネットワークエラー: ${error.message}`);
      // 再試行
      return retryFetchUserData(userId);
    } else {
      console.error(
        `予期しないエラー: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error; // 再スロー
    }
  }
}

// 再帰関数の例
async function retryFetchUserData(
  userId: string,
  attempts = 3,
): Promise<UserData> {
  try {
    return await doFetchUserData(userId);
  } catch (error) {
    if (attempts > 1 && error instanceof NetworkError) {
      console.log(`再試行中... 残り ${attempts - 1} 回`);
      await new Promise((resolve) => setTimeout(resolve, 200));
      return retryFetchUserData(userId, attempts - 1);
    }
    throw error;
  }
}

// 高階関数の例
async function enrichUserData(userData: UserData): Promise<UserData> {
  // 非同期処理のシミュレーション
  await new Promise((resolve) => setTimeout(resolve, 50));

  // 複雑なデータ変換
  return {
    ...userData,
    // 年齢に基づく分類を追加
    ...processUserAge(userData, (age) => {
      if (age < 20) return "若年層";
      else if (age < 40) return "中年層";
      else return "高年層";
    }),
  };
}

// コールバック関数を受け取る関数
function processUserAge(
  userData: UserData,
  classifier: (age: number) => string,
): { ageGroup: string } {
  return {
    ageGroup: classifier(userData.age),
  };
}

// メイン処理
async function main() {
  const userIds = ["1001", "1002", "1003"];

  for (const userId of userIds) {
    try {
      // switch文と組み合わせた条件分岐
      switch (userId) {
        case "1001":
          console.log("VIPユーザーを処理中...");
          break;
        case "1002":
          console.log("通常ユーザーを処理中...");
          break;
        default:
          console.log("ゲストユーザーを処理中...");
      }

      // doプレフィックスの関数を呼び出し
      const userData = await doProcessUserData(userId);
      console.log(`処理完了: ${userData.name} (${userData.email})`);
    } catch (error) {
      console.error(
        `ユーザー ${userId} の処理中にエラーが発生しました:`,
        error,
      );
    } finally {
      console.log(`ユーザー ${userId} の処理を終了しました`);
    }
  }
}

// エントリーポイント
if (import.meta.main) {
  main().catch(console.error);
}
