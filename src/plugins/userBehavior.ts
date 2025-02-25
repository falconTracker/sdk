import { generateTraceId } from "../utils";
import { APIData } from "../behavior/api";
import { CATEGORY, UserBehaviorType } from "../utils/constant";
import { Plugin } from "../plugin";
import { CollectBehavior } from "../collect";

interface UiClickEvent {
  type: "ui.click";
  data: {
    message: string;
  };
}

interface NavigationEvent {
  type: "navigation";
  data: {
    from: string;
    to: string;
  };
}

interface APIEvent {
  type: "api";
  data: APIData;
}

export type BehaviorEvent = {
  url: string;
} & (UiClickEvent | NavigationEvent | APIEvent);

export type BehaviorEventData = BehaviorEvent & {
  traceId: string;
  timeStamp: number;
};

let traceId = generateTraceId();

export function getCurrentTraceId() {
  return traceId;
}

export class UserBehavior {
  stack: CollectBehavior[];
  constructor() {
    this.stack = [];
  }

  addBehavior(event: CollectBehavior) {
    if (this.stack.length >= 100) {
      this.stack.shift();
    }
    this.stack.push(
      Object.assign(event, {
        traceId,
        timeStamp: Date.now(),
      })
    );
  }

  async getAndResetBehaviorStack() {
    await Promise.resolve();
    const copy = JSON.parse(JSON.stringify(this.stack));

    // update traceId;
    traceId = generateTraceId();
    // reset
    this.stack.length = 0;
    return copy;
  }
}

export function userBehaviorPlugin(): Plugin {
  let userBehavior: UserBehavior;
  return {
    name: "hawkEye-userBehavior",
    configResolved(config) {
      if (config.collectors?.behavior) {
        userBehavior = new UserBehavior();
      }
    },
    async load(data) {
      if (data.category === CATEGORY.BEHAVIOR) {
        userBehavior?.addBehavior(data as CollectBehavior);
      }

      if(data.category === CATEGORY.API) {
        userBehavior?.addBehavior({
          ...data,
          category: CATEGORY.BEHAVIOR,
          type: UserBehaviorType.REQUEST,
        } as CollectBehavior);
      }

      if (data.category === CATEGORY.ERROR) {
        const basic = {
          ...data,
          traceId: getCurrentTraceId(),
        }
        if(data.type !== "resourceError") {
          return {
            ...basic,
            behaviorList: await userBehavior.getAndResetBehaviorStack(),
          };
        } else {
          return basic;
        }
      }
    },
    transform(data) {
      if (
        data.category === CATEGORY.BEHAVIOR
      ) {
        return false;
      }
    },
  };
}
