export function noop() {}

const _toString = Object.prototype.toString;

export function toRawType(value: any): string {
  return _toString.call(value).slice(8, -1);
}

interface OnInvisibleCallback {
  (event: Event): void;
}

export function onInvisiable(
  callback: OnInvisibleCallback,
  once?: boolean
): void {
  const pageHideOrHidden = (event: PageTransitionEvent) => {
    if (event.type === "pagehide" || document.visibilityState === "hidden") {
      callback(event);

      // 是否只监听一次
      if (once) {
        on("pagehide", pageHideOrHidden, true);
        // https://developer.mozilla.org/zh-CN/docs/Web/API/Document/visibilitychange_event
        off("visibilitychange", pageHideOrHidden, true, document);
      }
    }
  };

  on("pagehide", pageHideOrHidden, true);
  off("visibilitychange", pageHideOrHidden, true, document);
}

interface listenerCallback {
  (...args: any[]): any;
}

export function on(
  eventName: string,
  listener: listenerCallback,
  options?: boolean | AddEventListenerOptions,
  target?: Window | Document
): void {
  // default to window
  if (!target) {
    target = window;
  }
  target.addEventListener(eventName, listener, options);
}

export function off(
  eventName: string,
  listener: listenerCallback,
  options?: boolean | AddEventListenerOptions,
  target?: Window | Document
): void {
  // default to window
  if (!target) {
    target = window;
  }
  target.removeEventListener(eventName, listener, options);
}

export function onBFCacheRestore(callback: listenerCallback): void {
  on(
    "pageshow",
    (event) => {
      if (event.persisted) {
        callback(event);
      }
    },
    true,
    window
  );
}

export function nextLoop(
  callback: FrameRequestCallback | TimerHandler,
  timeout?: number
): void {
  if (window.requestAnimationFrame !== undefined) {
    requestAnimationFrame(<FrameRequestCallback>callback);
  } else {
    setTimeout(<TimerHandler>callback, timeout);
  }
}

function createUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createRandomString(length: number | undefined) {
  length = length || 7;
  const $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz12345678";
  const maxPos = $chars.length;
  let result = "";
  for (let i = 0; i < length; i++) {
    result += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result + Date.now();
}

export function generateTraceId() {
  return createUUID();
}

export function generateSessionId(userId: string) {
  return `${userId}-${Date.now()}-${createUUID()}`;
}

export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  delay: number = 0
) {
  let ok = true;
  return function (this: any, ...args: Parameters<T>) {
    if (!ok) return;
    fn.apply(this, args);
    ok = false;
    setTimeout(() => {
      ok = true;
    }, delay);
  };
}

export function getCurrentLocationHref(): string {
  if (typeof document === "undefined" || document.location == null) return "";
  return document.location.href;
}

export function isSafari(): boolean {
  const userAgent = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(userAgent);
}

export function isFirefox(): boolean {
  const userAgent = navigator.userAgent;
  return /firefox/i.test(userAgent);
}

export function arrify<T>(target: T | T[]): T[] {
  return Array.isArray(target) ? target : [target];
}

export function isObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

export function mergeConfig(
  defaults: Record<string, any>,
  overrides: Record<string, any>
): Record<string, any> {
  const merged: Record<string, any> = { ...defaults };
  for (const key in overrides) {
    const value = overrides[key];
    if (value == null) {
      continue;
    }
    const existing = merged[key];
    if (existing == null) {
      merged[key] = value;
      continue;
    }
    if (Array.isArray(existing) || Array.isArray(value)) {
      merged[key] = [...arrify(existing ?? []), ...arrify(value ?? [])];
      continue;
    }
    if (isObject(existing) && isObject(value)) {
      merged[key] = mergeConfig(existing, value);
      continue;
    }

    merged[key] = value;
  }
  return merged;
}

export function isEmpty(value: any): boolean {
  return (
    (toRawType(value) === "string" && value.trim() === "") ||
    value === undefined ||
    value === null
  );
}
