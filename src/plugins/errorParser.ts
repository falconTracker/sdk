import ErrorStackParser from "error-stack-parser";
import { CATEGORY } from "../utils/constant";
import { Plugin } from "../plugin";
import { ResolvedConfig } from "../config";
import { mergeConfig } from "../utils";
import { CollectData } from "src/collect";

const errorMap = new Set();

interface BaseError {
  message: string;
  timeStamp: number;
  traceId: string;
}

interface CustomError {
  type: "custom";
  message: string;
  stackFrames: StackFrame[];
}

type ResourceTargetType = "script" | "img" | "link" | "";

interface ResourceError {
  message: string;
  target: {
    type: ResourceTargetType;
    filename: string;
  };
}

interface JSError {
  message: string;
  stackFrames: StackFrame[];
}

export type ErrorCollectEvent = BaseError &
  (JSError | ResourceError | CustomError);

function parseError(
  type: "error" | "unhandledrejection",
  e: ErrorEvent | PromiseRejectionEvent
): JSError {
  let stackFrames: StackFrame[] = [];
  let message = "";
  if (type === "error" || type === "unhandledrejection") {
    let error: any;
    if (type === "error") {
      error = (e as ErrorEvent).error;
    }
    if (type === "unhandledrejection") {
      error = (e as PromiseRejectionEvent).reason;
    }
    message = error.message;
    stackFrames = ErrorStackParser.parse(error);
  }
  return {
    stackFrames,
    message,
  };
}

function parseResourceError(e: Event): ResourceError {
  const target: EventTarget = <EventTarget>(e.target || e.srcElement);
  const isElementTarget: boolean =
    target instanceof HTMLScriptElement ||
    target instanceof HTMLLinkElement ||
    target instanceof HTMLImageElement;
  if (!isElementTarget) {
    return {
      message: "unknown target",
      target: {
        type: "",
        filename: "",
      },
    };
  }
  let filename = "";
  let type: ResourceTargetType = "";
  if (target.toString() === "[object HTMLScriptElement]") {
    type = "script";

    filename = (<HTMLScriptElement>e.target).src;
  } else if (target.toString() === "[object HTMLImageElement]") {
    type = "img";
    filename = (<HTMLImageElement>e.target).src;
  } else if (target.toString() === "[object HTMLLinkElement]") {
    type = "link";
    filename = (<HTMLLinkElement>e.target).href;
  }
  return {
    message: `${type} not found`,
    target: {
      type,
      filename,
    },
  };
}

function getErrorUid(input: string): string {
  return globalThis.btoa(encodeURIComponent(input));
}

function getErrorString(type: string, e: ErrorEvent | PromiseRejectionEvent) {
  let error,
    fingerprint = "";
  if (type === "error") {
    fingerprint += `${type}-${(e as ErrorEvent).error.message}-`;
    error = (e as ErrorEvent).error;
  }
  if (type === "unhandledrejection") {
    fingerprint += `${type}-${(e as PromiseRejectionEvent).reason.message}-`;
    error = (e as PromiseRejectionEvent).reason;
  }
  const stackFrames = ErrorStackParser.parse(error);
  fingerprint += stackFrames
    .map((frame: StackFrame) => {
      return `${frame.fileName}-${frame.columnNumber}-${frame.lineNumber}`;
    })
    .join("-");

  return fingerprint;
}

export function errorParsePlugin(): Plugin {
  let resolved: ResolvedConfig;

  function duplicate(type: string, e: ErrorEvent | PromiseRejectionEvent) {
    if (resolved.collectors?.jsError?.repeat) {
      return errorParser(e, type);
    } else {
      const errorHash = getErrorUid(getErrorString(type, e));
      if (errorMap.has(errorHash)) {
        return {};
      } else {
        errorMap.add(errorHash);
        return errorParser(e, type);
      }
    }
  }

  function errorParser(
    e: Event | ErrorEvent | PromiseRejectionEvent,
    type: string
  ) {
    let error: JSError | ResourceError;
    if (type === "unhandledrejection") {
      error = parseError("unhandledrejection", e as PromiseRejectionEvent);
    }
    if (type === "error") {
      error = parseError("error", e as ErrorEvent);
    }

    if (type === "resourceError") {
      error = parseResourceError(e);
      return error;
    }

    return error! || {};
  }

  return {
    name: "hawkEye-errorParse",
    configResolved(config) {
      resolved = config;
    },

    load(data: CollectData) {
      if (data.category === CATEGORY.ERROR) {
        let result = {};
        if (data.type === "error" || data.type === "unhandledrejection") {
          result = duplicate(data.type, data.error);
        } else if (data.type === "resourceError") {
          result = errorParser(data.error, data.type);
        }

        return mergeConfig(data, result);
      }
    }
  };
}
