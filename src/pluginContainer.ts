import { ResolvedConfig } from "./config";
import { isEmpty } from "./utils";

export interface PluginContainer {
  emit: (data: any) => Promise<any>;
  load: (data: any) => any;
  transform: (data: any) => void | Promise<any>;
  end: (data: any) => void;
}

export async function createPluginContainer(
  config: ResolvedConfig
): Promise<PluginContainer> {
  const plugins = config.plugins;
  const container: PluginContainer = {
    // 可以通过这个接收到所有原始的监听数据
    async emit(data) {
      const result: any[] = [];
      for (const plugin of plugins) {
        if (!plugin.emit) continue;
        result.push(plugin.emit(data));
      }
      return Promise.all(result);
    },
    // 合并插件中添加的字段
    async load(data) {
      for (const plugin of plugins) {
        if (!plugin.load) continue;
        const result = await plugin.load(data);
        if (result) {
          data = result;
        }
      }
      return data;
    },
    // 当存在返回值时会被当成最终的上报对象，同时不会执行剩下的 transform 钩子
    async transform(data) {
      for (const plugin of plugins) {
        if (!plugin.transform) continue;
        let result;
        try {
          result = await plugin.transform(data);
        } catch (e) {
          console.warn(e);
        }
        if (!isEmpty(result)) {
          return result;
        }
      }
      return data;
    },

    async end(data) {
      for (const plugin of plugins) {
        if (!plugin.end) continue;
        await plugin.end(data);
      }
    },
  };

  return container;
}
