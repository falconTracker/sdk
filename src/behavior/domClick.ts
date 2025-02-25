import { HawkEye } from "..";
import { getCurrentLocationHref, on, throttle } from "../utils";
import { CATEGORY, UserBehaviorType } from "../utils/constant";

export function listenUIClick(instance: HawkEye) {
  if (!instance.config.collectors?.behavior) {
    return;
  }

  const domEvent = ["click"];
  // 不需要频繁记录
  const eventThrottle = throttle((e: PointerEvent) => {
    instance.collect({
      category: CATEGORY.BEHAVIOR,
      type: UserBehaviorType.UICLICK,
      event: e,
      timeStamp: Date.now(),
      url: getCurrentLocationHref(),
    });
  }, 100);

  domEvent.forEach((eventName) => {
    on(eventName, eventThrottle, true);
  });
}
