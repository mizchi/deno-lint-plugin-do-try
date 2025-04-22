// 正しい例: doで始まる関数名でthrowを使用
async function doGetData() {
  if (Math.random() > 0.5) {
    throw new Error("Random error");
  }
  return "data";
}

// 修正済み: doプレフィックスが追加された関数
async function doGetData2() {
  if (Math.random() > 0.5) {
    throw new Error("Random error"); // 修正によりdoプレフィックスが追加された
  }
  return "data";
}

// 正しい例: throwを使用しない関数はdoで始まる必要はない
function processData(data: string) {
  return data.toUpperCase();
}

// 不正な例: アロー関数でthrowを使用
const doFetchData = async () => {
  if (Math.random() > 0.5) {
    throw new Error("Random error"); // リントエラーが発生するはず
  }
  return "data";
};

// 不正な例: メソッドでthrowを使用
class DataService {
  doGetData() {
    if (Math.random() > 0.5) {
      throw new Error("Random error"); // リントエラーが発生するはず
    }
    return "data";
  }

  // 正しい例: doで始まるメソッド名でthrowを使用
  doFetchData() {
    if (Math.random() > 0.5) {
      throw new Error("Random error");
    }
    return "data";
  }
}

// 使用例
async function main() {
  try {
    // doで始まる関数はtry-catchで囲む必要がある
    const data = await doGetData();
    console.log(data);

    // 修正後: doプレフィックス付きの関数を呼び出し（try-catchで囲まれていない）
    await doGetData2();
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
