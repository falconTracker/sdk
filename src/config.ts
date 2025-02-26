import { version } from "../package.json";
import { mergeConfig } from "./utils";
import { Plugin } from "./plugin";
import { resolvePlugins } from "./plugins";

export type jsErrorOptions = {
  collect: boolean;
  /**
   * whether to collect same error
   */
  repeat: boolean;
};

export interface CollectorOptions {
  performance?: boolean;
  api?: boolean;
  jsError?: jsErrorOptions;
  behavior?: boolean;
}

export interface UserConfig {
  appId: string;
  endpoint: string;
  reportMode?: "beacon" | "img" | "xhr";
  /**
   * 自定义日志发送方式，以这个为准
   * 如果配置为 false，则不会发送
   */
  send?: ((data: any) => void) | boolean;
  collectors?: CollectorOptions;
  plugins?: Plugin[];
  SDKVersion?: string;
  extra?: Record<string, any>;
}

export type ResolvedConfig = Readonly<
  Omit<UserConfig, "plugins"> & {
    plugins: readonly Plugin[];
  }
>;

async function asyncFlatten<T>(arr: T[]): Promise<T[]> {
  do {
    arr = (await Promise.all(arr)).flat(Infinity) as any;
  } while (arr.some((v: any) => v?.then));
  return arr;
}

const defaultConfig: UserConfig = {
  appId: "",
  endpoint: "",
  reportMode: "xhr",
  collectors: {
    performance: true,
    api: true,
    jsError: {
      collect: true,
      repeat: true,
    },
    behavior: true,
  },
  SDKVersion: version,
};

const DSN_regex =
  /^(?:(\w+):)\/\/(?:(\w+)(?::(\w+)?)?@)([\w.-]+)(?::(\d+))?\/(.+)/;

function isDSNCorrect(dsn: string): boolean {
  if (dsn && dsn.match(DSN_regex)) {
    return true;
  }
  return false;
}

export async function resolveConfig(
  userConfig: UserConfig
): Promise<ResolvedConfig> {
  userConfig = mergeConfig(defaultConfig, userConfig) as UserConfig;
  if (isDSNCorrect(userConfig.endpoint)) {
    console.warn(
      `[FalconTracker warn]: Endpoint: ${userConfig.endpoint} is invalid. \nReport feature is now disabled.`
    );
    userConfig.send = false;
  }

  userConfig.reportMode = userConfig.reportMode || "xhr";

  const userPlugins: Plugin[] = (
    (await asyncFlatten(userConfig.plugins || [])) as Plugin[]
  ).filter((p) => {
    if (!p) {
      return false;
    } else {
      return true;
    }
  });

  for (const p of userPlugins) {
    if (p?.config) {
      const res = await p.config(userConfig);
      if (res) {
        if (typeof res != "object") continue;

        userConfig = mergeConfig(defaultConfig, userConfig) as UserConfig;
      }
    }
  }

  const plugins = await resolvePlugins(userConfig, userPlugins);

  const resolved: ResolvedConfig = {
    ...userConfig,
    plugins,
  };

  await Promise.all(plugins.map((p) => p.configResolved?.(resolved)));

  return resolved;
}
