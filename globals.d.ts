declare interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
}

declare interface PerformanceLongAnimationFrameTimingPatch extends PerformanceEntry {
  renderStart: DOMHighResTimeStamp;
  duration: DOMHighResTimeStamp;
  blockingDuration: DOMHighResTimeStamp
}
