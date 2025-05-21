// deno-lint-ignore-file no-unused-vars no-inner-declarations

// allowed
{
  function doThrowableFunction() {
    if (Math.random() > 0.5) {
      throw new Error("Random error");
    }
    return "data";
  }

  try {
    doThrowableFunction();
  } catch (error) {
    console.error("An error occurred:", error);
  }

  async function doThrowableAsync(): Promise<string> {
    if (Math.random() > 0.5) {
      await Promise.reject(new Error("Random error"));
    }
    return "data";
  }
  try {
    await doThrowableAsync();
  } catch (error) {
    console.error("An error occurred:", error);
  }

  async function _withoutThrow(): Promise<void> {
    // await Promise.resolve();
    // throw new Error("Random error");
    // await Promise.reject(new Error("Random error"));
  }

  class _DataService {
    doGetData() {
      if (Math.random() > 0.5) {
        throw new Error("Random error");
      }
      return "data";
    }
  }

  async function doTask() {
    await Promise.resolve();
  }
  async function doMain(): Promise<void> {
    await doTask();
  }
  async function _getResult() {
    try {
      await doMain();
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }
  try {
    await doMain();
  } catch (error) {
    console.error("An error occurred:", error);
  }
  // async function getSomething(): Promise<Result<void, Error>> {
  //   try {
  //     const v = await doThrowableAsync();
  //     return {ok: true, value: undefined};
  //   } catch (error) {
  //     return {ok: false, error: error as Error};
  //   }
  // }
}

{
  async function doSomething() {}
  const obj = { doSomething };

  // errors
  doSomething();
  await doSomething();
  await obj.doSomething();
  try {
    const run = async () => {
      // should be wrapped in try-catch
      await doSomething();
    };
    await run();
  } catch (error) {
    console.error("An error occurred:", error);
  }
  function _throwableFunction() {
    if (Math.random() > 0.5) {
      throw new Error("Random error");
    }
    return "data";
  }

  async function _throwableAsync(): Promise<string> {
    if (Math.random() > 0.5) {
      await Promise.reject(new Error("Random error"));
    }
    return "data";
  }

  async function _xxx(): Promise<void> {
    try {
      //   throw new Error("Random error");
    } catch (_error) {
      // handle error
    }
  }

  class _DataService {
    getData() {
      if (Math.random() > 0.5) {
        throw new Error("Random error");
      }
      return "data";
    }
  }
}
