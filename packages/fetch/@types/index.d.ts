import { Mpx } from "@mpxjs/core";

interface KeyValue<T = any> {
  [key: string]: T;
}

interface Response {
  statusCode: number;
  data: KeyValue & string & ArrayBuffer;
  header: KeyValue;
}
interface CancelToken {
  new (...arg: any): {
    token: PromiseConstructor;
    exec: (msg: string) => PromiseConstructor;
  };
}
interface RequestConfig {
  url: string;
  data?: KeyValue | ArrayBuffer;
  header?: KeyValue;
  method?:
    | "OPTIONS"
    | "GET"
    | "HEAD"
    | "POST"
    | "PUT"
    | "DELETE"
    | "TRACE"
    | "CONNECT";
  dataType?: "json" | string;
  responseType?: "text" | "arraybuffer";
  success?: (res: Response) => void;
  fail?: (err: any) => void;
  complete?: () => void;
  emulateJSON?: boolean;
  params?: KeyValue;
  cancelToken?: Pick<InstanceType<CancelToken>, "token">["token"];
}
interface Interceptors {
  request: { use: (config: any) => any };
  response: { use: (res: any) => any };
}

export interface XFetch {
  new (options: { limit?: number; delay?: number; ratio?: number });
  fetch: (
    config: RequestConfig,
    priority?: "normal" | "low"
  ) => Promise<Response>;
  addLowPriorityWhiteList: (rules: string | RegExp | Array<any>) => void;
  CancelToken: CancelToken;
  create: () => InstanceType<XFetch>;
  interceptors: Interceptors;
}

declare module "@mpxjs/core" {
  interface Mpx {
    xfetch: XFetch;
  }
}

declare const install: (...args: any) => any;

export default install;
