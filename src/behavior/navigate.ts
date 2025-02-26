import { FalconTracker } from "..";
import { getCurrentLocationHref, on } from "../utils";
import { CATEGORY, UserBehaviorType } from "../utils/constant";

interface StateCallback {
  (data: any, unused: string, url?: string | URL | null | undefined): void;
}

type ValueTransformer<T> = (key: string, value: T) => T | (() => T);

let preUrl = "";
export const getPreUrl = (): string => {
  return preUrl;
};

function replacer<T>(
  source: Record<string, any> | null | undefined,
  key: string,
  value: ValueTransformer<T>
) {
  if (!source) return;

  if (key in source) {
    const _value = source[key];
    const wrapper = value(key, _value);

    if (typeof wrapper === "function") {
      source[key] = wrapper as unknown as T;
    } else {
      source[key] = wrapper;
    }
  }
}

export function listenNavigationChange(instance: FalconTracker) {
  if (!instance.config.collectors?.behavior) {
    return;
  }

  function onHashChange(e: HashChangeEvent) {
    preUrl = e.oldURL;
    instance.collect({
      category: CATEGORY.BEHAVIOR,
      type: UserBehaviorType.NAVIGATION,
      data: {
        from: e.oldURL,
        to: e.newURL,
      },
      url: e.oldURL,
      timeStamp: Date.now(),
    });
  }

  on("hashchange", onHashChange);

  const _onpopstate = globalThis.onpopstate;
  let lastUrl: string = getCurrentLocationHref();

  /**
   * Popstate event will only be triggered under certain browser behaviors.
   * Such as clicking the forward and backward buttons (or calling the history.back() method in JavaScript)
   */
  globalThis.onpopstate = function (e: PopStateEvent) {
    const to = getCurrentLocationHref();
    preUrl = lastUrl;
    instance.collect({
      category: CATEGORY.BEHAVIOR,
      type: UserBehaviorType.NAVIGATION,
      data: {
        from: lastUrl,
        to: to,
      },
      url: lastUrl,
      timeStamp: Date.now(),
    });

    // update lastUrl
    lastUrl = to;

    if(_onpopstate){
      _onpopstate.apply(this, [e]);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function createPushStateOrReplaceStateFn(
    type: string,
    _pushStateOrReplaceState: StateCallback
  ) {
    return function (...args: [any, string, (string | URL | null)?]) {
      const url = args.length > 2 ? args[2] : "";
      if (url) {
        let from = "";
        if (lastUrl[0] == "/") {
          from = lastUrl;
        } else {
          from = lastUrl;
        }
        const to = String(url);

        instance.collect({
          category: CATEGORY.BEHAVIOR,
          type: UserBehaviorType.NAVIGATION,
          data: { from, to },
          url: lastUrl,
          timeStamp: Date.now(),
        });

        lastUrl = to;
      }
      return _pushStateOrReplaceState.apply(this, args);
    };
  }

  /**
   * Calling history.pushState() or history.replaceState() will not trigger the popstate event.
   * We need to rewrite these two methods separately
   */
  replacer(globalThis.history, "pushState", createPushStateOrReplaceStateFn);
  replacer(globalThis.history, "replaceState", createPushStateOrReplaceStateFn);
}
