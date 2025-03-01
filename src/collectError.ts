import { FalconTracker } from ".";
import { getCurrentLocationHref, toRawType } from "./utils";
import { CATEGORY, ErrorType } from "./utils/constant";

export function listenError(instance: FalconTracker) {
  const jsError = instance.config.collectors?.jsError;

  if (!jsError?.collect) {
    return;
  }

  function errorCallback(e: Event | ErrorEvent): boolean | void {
    if (toRawType(e) === "Event") {
      instance.collect({
        category: CATEGORY.ERROR,
        type: ErrorType.RESOURCE,
        error: e as Event,
        url: getCurrentLocationHref(),
        timeStamp: Date.now(),
      });
    } else {
      // 通过标签加载的资源内的报错，error 为 null，无法解析
      if((e as ErrorEvent).error) {
        instance.collect({
          category: CATEGORY.ERROR,
          type: ErrorType.ERROR,
          error: e as ErrorEvent,
          url: getCurrentLocationHref(),
          timeStamp: Date.now(),
        });
      }
    }
  }

  function unhandledrejectionCallback(e: PromiseRejectionEvent) {
    instance.collect({
      category: CATEGORY.ERROR,
      type: ErrorType.UNHANDLEDREJECTION,
      error: e,
      url: getCurrentLocationHref(),
      timeStamp: Date.now(),
    });
  }

  window.addEventListener("error", errorCallback, true);
  window.addEventListener("unhandledrejection", unhandledrejectionCallback);
}
