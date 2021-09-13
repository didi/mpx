import { webHandleSuccess, webHandleFail } from "../../../common/js";
const { Request } = __GLOBAL__;

function request(options = { url: "" }) {
  let {
    data = {},
    method = "GET",
    dataType = "json",
    responseType = "text",
    timeout = 60 * 1000,
    header = {},
    success = null,
    fail = null,
    complete = null,
  } = options;

  method = method.toUpperCase();

  if (
    method === "POST" &&
    typeof data !== "string" && // string 不做处理
    (header["Content-Type"] === "application/x-www-form-urlencoded" ||
      header["content-type"] === "application/x-www-form-urlencoded")
  ) {
    // 重新设置data
    data = Object.keys(data)
      .reduce((pre, curKey) => {
        return `${pre}&${encodeURIComponent(curKey)}=${encodeURIComponent(
          data[curKey]
        )}`;
      }, "")
      .slice(1);
  }

  const requestFn = new Request();

  requestFn.url = options.url;
  requestFn.method = method;
  requestFn.timeout = timeout;
  requestFn.header = header;
  requestFn.params = data;
  requestFn.send((response) => {
    const { status, header: resHeader, data: resData, error } = response;
    // 返回的数据处理
  
    if (responseType === "text" && dataType === "json") {
      try {
        resData = JSON.parse(resData);
      } catch (e) {}
    }

    if (status >= 200 && status < 300) {
      const result = {
        errMsg: "request:ok",
        data: resData,
        statusCode: status,
        header: resHeader,
      };
      webHandleSuccess(result, success, complete);
      return result;
    } else {
      const res = { errMsg: `request:fail ${error.msg}` };
      webHandleFail(res, fail, complete);
      if (!fail) {
        return Promise.reject(res);
      }
    }
  });
}

export { request };
