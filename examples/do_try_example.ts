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

  class _DataService {
    doGetData() {
      if (Math.random() > 0.5) {
        throw new Error("Random error");
      }
      return "data";
    }
    run() {
      try {
        this.doGetData();
      } catch (error) {
        console.error("An error occurred:", error);
      }
    }
  }
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
  function throwableFunction() {
    if (Math.random() > 0.5) {
      throw new Error("Random error");
    }
    return "data";
  }

  async function throwableAsync(): Promise<string> {
    if (Math.random() > 0.5) {
      await Promise.reject(new Error("Random error"));
    }
    return "data";
  }

  class _DataService {
    getData() {
      if (Math.random() > 0.5) {
        throw new Error("Random error");
      }
      return "data";
    }
    run() {
      try {
        // TODO: doで始まる関数はtry-catchで囲む必要がある
        this.getData();
      } catch (error) {
        console.error("An error occurred:", error);
      }
    }
  }
}
