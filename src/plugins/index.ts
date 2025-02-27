import { elementParserPlugin } from "./elementParser";
import { UserConfig } from "../config";
import { errorParsePlugin } from "./errorParser";
import { Plugin } from "../plugin";
import { reportPlugin } from "./report";

export async function resolvePlugins(
  config: UserConfig,
  userPlugins: Plugin[]
): Promise<Plugin[]> {
  return [
    elementParserPlugin(),
    errorParsePlugin(),
    ...userPlugins,
    reportPlugin(config),
  ].filter(Boolean) as Plugin[];
}
