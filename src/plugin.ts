import { FullData } from "./collect";
import { ResolvedConfig, UserConfig } from "./config";

export interface Plugin {
  // 插件名
  name?: string;
  // 可以添加额外的配置到全局配置中
  config?: (config: UserConfig) => any;

  // 通常用于获取完整的配置
  configResolved?: (config: ResolvedConfig) => void | Promise<void>;

  // 用于监听收集的数据
  emit?: (data: FullData) => void;

  // 通过返回值可以在数据中添加的额外字段
  load?: (data: FullData) => any;
  
  // 数据转换
  transform?: (data: FullData) => any;
  
  // 数据处理结束时的钩子，data 类型由实现者决定
  end?: (data: FullData) => void;
}
