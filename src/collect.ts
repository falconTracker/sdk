import { getPreUrl } from "./behavior/navigate";
import { ResolvedConfig } from "./config";
import { PluginContainer } from "./pluginContainer";
import { createRandomString, nextLoop, on } from "./utils";
import type { StackFrame} from "error-stack-parser";
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

export type ResourceTargetType = "script" | "img" | "link" | "";

export interface PerformanceResource extends BasicCollectData {
  category: CATEGORY.PERFORMANCE;
  type: PerformanceType.RESOURCE;
  navigationType?: NavigationTimingType;
  navigationTiming?: PerformanceNavigationTiming;
  timing?: Timing;
  entries: PerformanceEntry[];
}

export interface PerformanceMetric extends BasicCollectData {
  category: CATEGORY.PERFORMANCE;
  type: PerformanceType.METRIC;
  metric: {
    name: "LCP" | "CLS" | "FCP" | "TTFB" | "INP";
    rating: "good" | "needs-improvement" | "poor";
    value: number;
  };
}

export interface BehaviorNavigation extends BasicCollectData {
  category: CATEGORY.BEHAVIOR;
  type: UserBehaviorType.NAVIGATION;
  data: {
    from: string;
    to: string;
  };
}

export interface BehaviorUIClick extends BasicCollectData {
  category: CATEGORY.BEHAVIOR;
  type: UserBehaviorType.UICLICK;
  event: PointerEvent;
}

export interface BehaviorRequest extends BasicCollectData {
  category: CATEGORY.API | CATEGORY.BEHAVIOR;
  type: UserBehaviorType.REQUEST;
  data: {
    resource: PerformanceResourceTiming;
    status: number;
    statusText: string;
    message: string;
    contentLength: number;
    method: string;
    params: string;
    error?: Error;
  }
}

export interface ErrorDataBase extends BasicCollectData {
  category: CATEGORY.ERROR;
}

export interface ErrorUnhandledRejection extends ErrorDataBase {
  type: ErrorType.UNHANDLEDREJECTION;
  error: PromiseRejectionEvent;
  traceId?: string;
  behaviorList?: CollectBehavior[];
  message?: string;
  stackFrames?: StackFrame[];
}

export interface ErrorErrorEvent extends ErrorDataBase {
  type: ErrorType.ERROR;
  error: ErrorEvent;
  traceId?: string;
  behaviorList?: CollectBehavior[];
  message?: string;
  stackFrames?: StackFrame[];
}

export interface ErrorResourceError extends ErrorDataBase {
  type: ErrorType.RESOURCEERROR;
  error: Event;
  traceId?: string;
  message?: string;
  target?: {
    type: ResourceTargetType;
    filename: string;
  };
}

export interface ErrorRequestError extends ErrorDataBase {
  type: ErrorType.REQUEST;
  traceId?: string;
  data: {
    resource: PerformanceResourceTiming;
    status: number;
    statusText: string;
    method: string;
    params: string;
  };
}

export type ErrorData =
  | ErrorUnhandledRejection
  | ErrorErrorEvent
  | ErrorResourceError
  | ErrorRequestError;

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

  let result: UserAgentInfo;

export interface UserAgentInfo {
    browser: string;
    version: string;
    os: string;
    os_version: string;
    device: string;
    userAgent: string;
  }

export type BasicField = {
  markPage: string;
  agentInfo: UserAgentInfo;
  screenWidth: number;
  screenHeight: number;
  SDKVersion?: string;
  appId: string;
  preUrl: string;
  markUser: string;
  markUv: string;
}

export type FullData = CollectData & BasicField

// page flag，updated when onload event emit
let markPage = "";

function updateMarkPage() {
  markPage = createRandomString(10);
}

function getMarkPage() {
  return markPage;
}

function getMarkUser() {
  let markUser = sessionStorage.getItem("falconTracker_markUser") || "";
  if (!markUser) {
    markUser = createRandomString(10);
    sessionStorage.setItem("falconTracker_markUser", markUser);
  }
  return markUser;
}

// 获得Uv
function getMarkUv() {
  const date = new Date();
  let markUv = localStorage.getItem("falconTracker_markUv") || "";
  const dateTime = localStorage.getItem("falconTracker_markUvTime") || "";
  const today =
    date.getFullYear() +
    "/" +
    (date.getMonth() + 1) +
    "/" +
    date.getDate() +
    " 23:59:59";
  if ((!markUv && !dateTime) || date.getTime() > Number(dateTime) * 1) {
    markUv = createRandomString(10);
    localStorage.setItem("falconTracker_markUv", markUv);
    localStorage.setItem(
      "falconTracker_markUvTime",
      new Date(today).getTime().toString()
    );
  }
  return markUv;
}

function getUserAgentInfo(): UserAgentInfo {
  if (result) {
    return result as UserAgentInfo;
  }
  const userAgent = navigator.userAgent;
  let browser = "unknown";
  let version = "unknown";
  let os = "unknown os";
  let os_version = "unknown version";
  const device: string = /Mobile/.test(userAgent) ? "mobile" : "pc";

  const browsers: { [key: string]: RegExp } = {
    Firefox: /Firefox\/([0-9.]+)/,
    Chrome: /Chrome\/([0-9.]+)/,
    Safari: /Version\/([0-9.]+).*Safari/,
    IE: /MSIE ([0-9.]+)|Trident.*rv:([0-9.]+)/,
  };

  for (const [name, regex] of Object.entries(browsers)) {
    const match = userAgent.match(regex);
    if (match) {
      browser = name;
      version = match[1] || match[2] || version;
      break;
    }
  }

  const osPatterns: {
    [key: string]: {
      regex: RegExp | null;
      version: (match: RegExpMatchArray) => string;
    };
  } = {
    Windows: {
      regex: /Windows NT ([0-9.]+)/,
      version: (match) => match[1],
    },
    MacOS: {
      regex: /Mac OS X ([0-9_]+)/,
      version: (match) => match[1].replace(/_/g, "."),
    },
    Linux: {
      regex: null,
      // Linux version information is usually not in the User Agent
      version: () => "",
    },
    Android: {
      regex: /Android ([0-9.]+)/,
      version: (match) => match[1],
    },
    iOS: {
      regex: /OS ([0-9_]+)/,
      version: (match) => match[1].replace(/_/g, "."),
    },
  };

  for (const [name, { regex, version }] of Object.entries(osPatterns)) {
    if (regex ? regex.test(userAgent) : /Linux/.test(userAgent)) {
      os = name;
      if (regex) {
        const match = userAgent.match(regex);
        os_version = match ? version(match) : os_version;
      }
      break;
    }
  }

  result = {
    browser,
    version,
    os,
    os_version,
    device,
    userAgent,
  };

  return result;
}

function addBasicField(config: ResolvedConfig, data: CollectData): FullData {
    return {
        ...data,
        agentInfo: getUserAgentInfo(),
        markPage: getMarkPage(),
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        SDKVersion: config.SDKVersion,
        appId: config.appId || "",
        preUrl: getPreUrl(),
        markUser: getMarkUser(),
        markUv: getMarkUv(),
      };
}


export function createCollectFn(config: ResolvedConfig, container: PluginContainer) {
  async function collect(data: CollectData) {

    let fullData = addBasicField(config, data)

    if (!isLoad) {
      cache.push(fullData);
      return;
    }

    await container.emit(fullData);

    const result = await container.load(fullData);

    if (result) {
      fullData = result;
    }

    const final = await container.transform(fullData);
    if (final !== false) {
      container.end(final);
    }
  }

  on("load", () => {
    updateMarkPage();
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
