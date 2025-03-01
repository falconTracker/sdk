import ErrorStackParser from "error-stack-parser";
import { CATEGORY, ErrorType } from "../utils/constant";
import { Plugin } from "../plugin";
import { ResolvedConfig } from "../config";
import { mergeConfig } from "../utils";
import { CollectData } from "src/collect";

const errorMap = new Set();

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

function parseError(
  type: ErrorType.ERROR | ErrorType.UNHANDLEDREJECTION,
  e: ErrorEvent | PromiseRejectionEvent
): JSError {
  let stackFrames: StackFrame[] = [];
  let message = "";
  if (type === ErrorType.ERROR || type === ErrorType.UNHANDLEDREJECTION) {
    let error: any;
    if (type === ErrorType.ERROR) {
      error = (e as ErrorEvent).error;
    }
    if (type === ErrorType.UNHANDLEDREJECTION) {
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
  if (type === ErrorType.ERROR) {
    fingerprint += `${type}-${(e as ErrorEvent).error.message}-`;
    error = (e as ErrorEvent).error;
  }
  if (type === ErrorType.UNHANDLEDREJECTION) {
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
    if (type === ErrorType.UNHANDLEDREJECTION) {
      error = parseError(ErrorType.UNHANDLEDREJECTION, e as PromiseRejectionEvent);
    }
    if (type === ErrorType.ERROR) {
      error = parseError(ErrorType.ERROR, e as ErrorEvent);
    }

    if (type === ErrorType.RESOURCE) {
      error = parseResourceError(e);
      return error;
    }

    return error! || {};
  }

  return {
    name: "falconTracker-errorParse",
    configResolved(config) {
      resolved = config;
    },

    load(data: CollectData) {
      if (data.category === CATEGORY.ERROR) {
        let result = {};
        if (data.type === ErrorType.ERROR || data.type === ErrorType.UNHANDLEDREJECTION) {
          result = duplicate(data.type, data.error);
        } else if (data.type === ErrorType.RESOURCE) {
          result = errorParser(data.error, data.type);
        }

        return mergeConfig(data, result);
      }
    }
  };
}
