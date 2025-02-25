import {
  CLSMetric,
  FCPMetric,
  LCPMetric,
  TTFBMetric,
  onCLS,
  onFCP,
  onLCP,
  onTTFB,
  onINP,
  INPMetric,
} from "web-vitals";
import { HawkEye } from ".";
import { getCurrentLocationHref, isEmpty, on } from "./utils";
import { CATEGORY, PerformanceType } from "./utils/constant";

type CollectedMetric =
  | LCPMetric
  | CLSMetric
  | FCPMetric
  | TTFBMetric
  | INPMetric;

// whether the resource was loaded from cache
function isCache(entry: PerformanceResourceTiming): boolean {
  return (
    entry.transferSize === 0 ||
    (entry.transferSize !== 0 && entry.encodedBodySize === 0)
  );
}

interface MetricCallback {
  (metric: LCPMetric | CLSMetric | FCPMetric | TTFBMetric | INPMetric): void;
}

function getCoreMetric(callback: MetricCallback) {
  onLCP(callback);
  onCLS(callback);
  onINP(callback);
  onFCP(callback);
  onTTFB(callback);
}

export function listenPerformance(instance: HawkEye) {
  if (!instance.config.collectors?.performance) {
    return;
  }

  function getAllResource(): PerformanceResourceTiming[] {
    const entries = performance.getEntriesByType("resource");
    let list = entries.filter((entry) => {
      // 不收集异步请求的数据
      if (
        ["fetch", "xmlhttprequest", "beacon"].indexOf(entry.initiatorType) ===
        -1
      ) {
        return true;
      } else {
        if (isEmpty(instance.config.endpoint)) {
          return true;
        }

        if (entry.name.indexOf(instance.config.endpoint as string) === -1) {
          return true;
        }
      }
    });

    if (list.length) {
      list = JSON.parse(JSON.stringify(list));
      list.forEach((entry: any) => {
        entry.isCache = isCache(entry);
      });
    }
    return list;
  }

  // 在加载完直接统计当前页面所有的资源数据，可用于分析页面加载的耗时
  // performance.timing 已经被废弃了，使用 PerformanceNavigationTiming 进行计算
  // https://developer.mozilla.org/en-US/docs/Web/API/Performance/timing
  on("load", function () {
    const resource = getAllResource();
    const timing = performance.getEntriesByType("navigation")[0];
    instance.collect({
      category: CATEGORY.PERFORMANCE,
      type: PerformanceType.RESOURCE,
      timeStamp: Date.now(),
      navigationType: performance.getEntriesByType("navigation")[0].type,
      // keep a copy
      navigationTiming: JSON.parse(JSON.stringify(timing)),
      timing: {
        // DNS parse time
        dnst: timing.domainLookupEnd - timing.domainLookupStart || 0,
        // tcp connect time
        tcpt: timing.connectEnd - timing.connectStart || 0,
        // whiteScreen time
        wit: timing.responseStart - timing.fetchStart || 0,
        // dom render complete time
        domt: timing.domContentLoadedEventEnd - timing.fetchStart || 0,
        // page onload time
        lodt: timing.loadEventStart - timing.fetchStart || 0,
        // page ready to fetch time
        radt: timing.fetchStart - timing.startTime || 0,
        // page redirect time
        rdit: timing.redirectEnd - timing.redirectStart || 0,
        // unload time
        uodt: timing.unloadEventEnd - timing.unloadEventStart || 0,
        // html download time
        reqt: timing.responseEnd - timing.requestStart || 0,
        // dom tree parse time
        andt: timing.domComplete - timing.domInteractive || 0,
      },
      entries: resource,
      url: getCurrentLocationHref(),
    });
  });

  // 主要的性能指标，也是在加载完成后触发，部分指标会在用户交互后触发
  getCoreMetric(function (metric: CollectedMetric) {
    const { name, rating, value } = metric;
    instance.collect({
      category: CATEGORY.PERFORMANCE,
      type: PerformanceType.METRIC,
      metric: {
        name,
        rating,
        value,
      },
      url: getCurrentLocationHref(),
      timeStamp: Date.now(),
    });
  });
}
