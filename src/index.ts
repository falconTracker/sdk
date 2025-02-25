import { ResolvedConfig, UserConfig, resolveConfig } from "./config";
import { PluginContainer, createPluginContainer } from "./pluginContainer";
import { listenUIClick } from "./behavior/domClick";
import { listenAPI } from "./behavior/api";
import { listenNavigationChange } from "./behavior/navigate";
import { listenError } from "./collectError";
import { CollectData, createCollectFn } from "./collect";
import { listenPerformance } from "./performance";

export { Plugin } from './plugin';
export { ResolvedConfig };
export * from './utils/constant';

export async function init(options: UserConfig) {
  return _createHawkEye(options);
}

export interface HawkEye {
  config: ResolvedConfig;
  container: PluginContainer;
  reportBehavior: () => void;
  collect: (data: CollectData) => void;
}

async function _createHawkEye(options: UserConfig) {
  const config: ResolvedConfig = await resolveConfig(options);
  const container = await createPluginContainer(config);

  const instance: HawkEye = {
    config,
    container,
    reportBehavior: null!,
    collect: createCollectFn(container),
  };

  listenError(instance);
  listenUIClick(instance);
  listenAPI(instance);
  listenNavigationChange(instance);
  listenPerformance(instance);
}
