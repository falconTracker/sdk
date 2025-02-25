import { PluginContainer } from "./pluginContainer";
import { nextLoop, on } from "./utils";
import {
  CATEGORY,
  ErrorType,
  PerformanceType,
  Timing,
  UserBehaviorType,
} from "./utils/constant";

let isLoad = false;
const cache: any[] = [];

interface BasicCollectData {
  category: CATEGORY;
  type: string;
  timeStamp: number;
  url: string;
}

interface PerformanceResource extends BasicCollectData {
  type: PerformanceType.RESOURCE;
  navigationType?: NavigationTimingType;
  navigationTiming?: PerformanceNavigationTiming;
  timing?: Timing;
  entries: PerformanceEntry[];
}

interface PerformanceMetric extends BasicCollectData {
  type: PerformanceType.METRIC;
  metric: {
    name: "LCP" | "CLS" | "FCP" | "TTFB" | "INP";
    rating: "good" | "needs-improvement" | "poor";
    value: number;
  };
}

interface BehaviorNavigation extends BasicCollectData {
  type: UserBehaviorType.NAVIGATION;
  data: {
    from: string;
    to: string;
  };
}

interface BehaviorUIClick extends BasicCollectData {
  type: UserBehaviorType.UICLICK;
  event: PointerEvent;
}

interface BehaviorRequest extends BasicCollectData {
  type: UserBehaviorType.REQUEST;
  data: {
    resource: PerformanceResourceTiming;
    status: number;
    statusText: string;
    message: string;
    contentLength: number;
    method: string;
    params: string;
  }
}

type ErrorData = (
  | {
      type: ErrorType.UNHANDLEDREJECTION;
      error: PromiseRejectionEvent;
    }
  | {
      type: ErrorType.ERROR;
      error: ErrorEvent;
    }
  | {
      type: ErrorType.RESOURCEERROR;
      error: Event;
    }
  | {
    type: ErrorType.REQUEST;
    data: {
      resource: PerformanceResourceTiming;
      status: number;
      text: string;
      method: string;
      params: string;
    }
  }
) &
  BasicCollectData;

export type CollectBehavior =
  | BehaviorNavigation
  | BehaviorUIClick
  | BehaviorRequest;

export type CollectData =
  | PerformanceResource
  | PerformanceMetric
  | ErrorData
  | BehaviorNavigation
  | BehaviorUIClick
  | BehaviorRequest;

export function createCollectFn(container: PluginContainer) {
  async function collect(data: CollectData) {
    if (!isLoad) {
      cache.push(data);
      return;
    }

    await container.emit(data);

    const result = await container.load(data);

    if (result) {
      data = result;
    }

    const final = await container.transform(data);
    if (final !== false) {
      container.end(final);
    }
  }

  on("load", () => {
    // 确保最后触发
    nextLoop(() => {
      isLoad = true;
      if (cache.length > 0) {
        cache.forEach((data) => {
          collect(data);
        });
        cache.length = 0;
      }
    });
  });

  return collect;
}
