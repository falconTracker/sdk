import { FalconTracker } from "..";
import { getCurrentLocationHref, isEmpty } from "../utils";
import { CATEGORY, ErrorType, UserBehaviorType } from "../utils/constant";


export type APIData = Omit<PerformanceResourceTiming, "toJSON"> &
  {
    status: number;
    statusText: string;
    message: any;
    options: RequestInit;
  };

type ResponseData = {
  contentLength: number;
  statusText: string;
  status: number;
  message: string;
};

type RequestData = {
  method: string;
  params: string;
};

export function listenAPI(instance: FalconTracker) {
  if (!instance.config.collectors?.api) {
    return;
  }

  const { collect } = instance;

  function _collect(url: string, response: ResponseData, request: RequestData, status: boolean) {
    const resourceTiming = getLastResourceTimingByUrl(url.toString());
    if (!resourceTiming) {
      return;
    }

    if(status) {
      if(resourceTiming.responseStatus >= 300) {
        collect({
          category: CATEGORY.ERROR,
          type: ErrorType.REQUEST,
          timeStamp: Date.now(),
          data: {
            resource: resourceTiming,
            status: resourceTiming.responseStatus,
            statusText: response.statusText || 'error',
            method: request.method,
            params: request.params,
          },
          url: getCurrentLocationHref(),
        });
      } else {
        collect({
          category: CATEGORY.API,
          type: UserBehaviorType.REQUEST,
          timeStamp: Date.now(),
          data: {
            resource: resourceTiming,
            status: response.status,
            statusText: response.statusText,
            message: response.message,
            // 以 decodedBodySize 为准
            contentLength: resourceTiming.decodedBodySize == 0 ? response.contentLength : resourceTiming.decodedBodySize,
            method: request.method,
            params: request.params,
          },
          url: getCurrentLocationHref(),
        });
      }
    } else {
      collect({
        category: CATEGORY.ERROR,
        type: ErrorType.REQUEST,
        timeStamp: Date.now(),
        data: {
          resource: resourceTiming,
          status: response.status,
          statusText: response.statusText,
          method: request.method,
          params: request.params,
        },
        url: getCurrentLocationHref(),
      });
    }
  }

  rewriteFetch(instance, _collect);
  rewriteXHR(instance, _collect);
}

function getLastResourceTimingByUrl(url: string) {
  const resources = performance.getEntriesByType("resource");
  // TODO 适配 axios
  const list = resources.filter((entry) => entry.name === url || entry.name.includes(url));
  if (list.length >= 1) {
    return list[list.length - 1];
  }
  return;
}

function parseQueryStringToObjectString(params: URLSearchParams) {
  if(params.size == 0) return '';

  const result = {};

  for (const [key, value] of Array.from(params)) {
    setItemToObject(result, key, value);
  }

  return JSON.stringify(result);
}

function setItemToObject(obj:  {[key: string]: any}, key: string, value: any) {
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    if (!Array.isArray(obj[key])) {
      obj[key] = [obj[key]];
    }
    obj[key].push(value);
  } else {
    obj[key] = value;
  }
  return obj;
}

// 兼容 Request 传参
function getRequest(
  input: string | URL | globalThis.Request,
  init: RequestInit = {}
) {
  const isRequestInstance = input instanceof Request;
  const method = init?.method || (isRequestInstance ? input.method : "GET");
  let params: any;

  if (method.toLowerCase() === "get") {
    params = parseQueryStringToObjectString(
      new URL(isRequestInstance ? input.url : input.toString()).searchParams
    );
  } else {
    params = init?.body || (isRequestInstance ? input.body : "");
  }

  return {
    // 统一大写
    method: method.toLocaleUpperCase(),
    params: typeof params == "object" ? JSON.stringify(params) : params,
  };
}

function rewriteFetch(
  instance: FalconTracker,
  _collect: (url: string, response: ResponseData, request: RequestData, status: boolean) => void
) {
  if (!("fetch" in globalThis)) {
    return;
  }
  const originFetch = globalThis.fetch;

  globalThis.fetch = function fetch(
    input: string | URL | globalThis.Request,
    init?: RequestInit
  ): Promise<Response> {
    let url: string;
    // 适配 fetch 的传参
    if (input instanceof Request) {
      url = input.url;
    } else {
      url = input.toString();
    }
    if (
      !isEmpty(instance.config.endpoint as string) &&
      url.toString().indexOf(instance.config.endpoint as string) !== -1
    ) {
      return originFetch.apply(globalThis, [input, init]);
    }

    return originFetch.apply(globalThis, [input, init]).then(
      (res: Response) => {
        // clone a response，protect the original one
        const clone = res.clone();
        clone.text().then((data) => {
          const response = {
            // 手动统计，避免跨域时通过性能条目获取的 decodeBodySize 为 0，无法计算
            contentLength: Number(res.headers.get("content-length")),
            status: clone.status,
            statusText: clone.statusText,
            message: data,
          };
          _collect(url, response, getRequest(input, init), true);
        });
        return res;
      },
      (err: Error) => {
        // TODO 就是一个错误，不能通过用户行为收集
        _collect(
          url,
          {
            contentLength: 0,
            status: -1,
            statusText: "Fail to fetch",
            message: err.message,
          },
          getRequest(input, init),
           false
        );
        throw err;
      }
    );
  };
}

function parseXHRBody(body: Document | XMLHttpRequestBodyInit): string {
  if (typeof body === "string") {
    return body;
  } else if (body instanceof FormData) {
    const formDataEntries: string[] = [];
    for (const [key, value] of Array.from(
      body as unknown as Iterable<[string, string]>
    )) {
      setItemToObject(formDataEntries, key, value);
    }
    return JSON.stringify(formDataEntries);
  } else if (body instanceof Blob || body instanceof File) {
    return `Blob/File data (type: ${body.type}): ${body.toString()}`;
  } else if (body instanceof ArrayBuffer) {
    return `ArrayBuffer data: ${body.toString()}`;
  } else if (body instanceof URLSearchParams) {
    return JSON.stringify(parseQueryStringToObjectString(body));
  } else if (body instanceof Document) {
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(body);
    return `Document/XML data: ${xmlString}`;
  } else {
    return `${body.constructor?.name ?? "Unknown"} type: ${JSON.stringify(body)}`;
  }
}

function rewriteXHR(
  instance: FalconTracker,
  _collect: (url: string, response: ResponseData, request: RequestData, status: boolean) => void
) {
  if (!("XMLHttpRequest" in globalThis)) {
    return;
  }
  const xhrProto = XMLHttpRequest.prototype;
  const originOpen = xhrProto.open;
  const originSend = xhrProto.send;

  xhrProto.open = function open(
    ...args: [string, string | URL] &
      [
        string,
        string | URL,
        boolean,
        (string | null | undefined)?,
        (string | null | undefined)?,
      ]
  ): void {
    this["_hawkeye_url"] = args[1];
    this["_hawkeye_method"] = args[0];
    originOpen.apply(this, args);
  };

  xhrProto.send = function send(
    body?: Document | XMLHttpRequestBodyInit | null | undefined
  ): void {
    if (!this["_hawkeye_url"]) {
      return;
    }
    let isProcess = false;
    if (
      !isEmpty(instance.config.endpoint as string) &&
      this["_hawkeye_url"].indexOf(instance.config.endpoint as string) !== -1
    ) {
      return originSend.call(this, body);
    }

    const method = this["_hawkeye_method"].toUpperCase();
    let params: string;
    if (method == "GET") {
      let searchParams: URLSearchParams;
      try {
        searchParams = new URL(this["_hawkeye_url"]).searchParams;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch(e) {
        searchParams = new URL('http://xxx.com'+this["_hawkeye_url"]).searchParams;
      }
      params = parseQueryStringToObjectString(searchParams);
    } else {
      if (body) {
        params = parseXHRBody(body);
      } else {
        params = "";
      }
    }

    function onLoaded() {
      if (isProcess) {
        return;
      }
      const { status, statusText, response } = this;
      if (this["_hawkeye_url"].indexOf(instance.config.endpoint) !== -1) {
        return;
      }

      const res = {
        // 手动统计，避免跨域时通过性能条目获取的 decodeBodySize 为 0，无法计算
        contentLength: Number(this.getResponseHeader("Content-Length")),
        status: status,
        statusText: statusText,
        message: response,
      };

      _collect(this["_hawkeye_url"], res, {
        params,
        method,
      }, true);
    }

    function onFailed(type: string) {
      return function () {
        isProcess = true;
        const res = {
          // 手动统计，避免跨域时通过性能条目获取的 decodeBodySize 为 0，无法计算
          contentLength: 0,
          status: -1,
          statusText: type,
          message: `request ${type}`,
        };

        // 不收集上报异常
        if(this["_hawkeye_url"].indexOf(instance.config.endpoint as string) !== -1) {
          return;
        }

        _collect(this["_hawkeye_url"], res, {
          params,
          method,
        }, false);
      };
    }
    (<XMLHttpRequest>this).addEventListener(
      "timeout",
      onFailed("timeout"),
      true
    );
    (<XMLHttpRequest>this).addEventListener("error", onFailed("error"), true);
    (<XMLHttpRequest>this).addEventListener("abort", onFailed("abort"), true);
    (<XMLHttpRequest>this).addEventListener("loadend", onLoaded, true);
    originSend.call(this, body);
  };
}
