import { ResolvedConfig, UserConfig, resolveConfig } from "./config";
import { PluginContainer, createPluginContainer } from "./pluginContainer";
import { listenUIClick } from "./behavior/domClick";
import { listenAPI } from "./behavior/api";
import { listenNavigationChange } from "./behavior/navigate";
import { listenError } from "./collectError";
import { CollectData, createCollectFn } from "./collect";
import { listenPerformance } from "./performance";

export async function init(options: UserConfig) {
  return _createFalconTracker(options);
}

export interface FalconTracker {
  config: ResolvedConfig;
  container: PluginContainer;
  reportBehavior: () => void;
  collect: (data: CollectData) => void;
}

export type { Plugin } from './plugin';
export type { CATEGORY } from './utils/constant';
export type { ResolvedConfig };
export type * from './utils/constant';
export type {
  FullData,
  CollectData,
  ErrorData,
  PerformanceResource,
  PerformanceMetric,
  NavigationData,
  UIClickData,
  RequestData
} from './collect';
export {
  generateSessionId,
  createUUID,
  onBFCacheRestore,
  on,
  off,
  onInvisiable,
  toRawType,
  nextLoop,
  createRandomString,
  throttle,
  isEmpty
} from './utils/index'


async function _createFalconTracker(options: UserConfig) {
  const config: ResolvedConfig = await resolveConfig(options);
  const container = await createPluginContainer(config);

  const instance: FalconTracker = {
    config,
    container,
    reportBehavior: null!,
    collect: createCollectFn(config, container),
  };

  listenError(instance);
  listenUIClick(instance);
  listenAPI(instance);
  listenNavigationChange(instance);
  listenPerformance(instance);
}
