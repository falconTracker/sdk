export enum CATEGORY {
  PERFORMANCE = "performance",
  ERROR = "error",
  BEHAVIOR = "behavior"
}

export enum UserBehaviorType {
  REQUEST = "request",
  UICLICK = "ui-click",
  NAVIGATION = "navigation",
}

export enum PerformanceType {
  METRIC = "metric",
  RESOURCE = "resource",
}

export enum ErrorType {
  UNHANDLEDREJECTION = "unhandledrejection",
  ERROR = "error",
  RESOURCE = "resource",
  REQUEST = 'request'
}

export enum NavigationType {
  HISTORY = "history",
  HASH = "hash",
}

export enum REPORT_MODE {
  BEACON = "beacon",
  IMG = "img",
  XHR = "xhr",
}

export type Timing = {
  // DNS parse time
  dnst: number;
  // tcp connect time
  tcpt: number;
  // whiteScreen time
  wit: number;
  // dom render complete time
  domt: number;
  // page onload time
  lodt: number;
  // page ready to fetch time
  radt: number;
  // page redirect time
  rdit: number;
  // unload time
  uodt: number;
  // html download time
  reqt: number;
  // dom tree parse time
  andt: number;
};
