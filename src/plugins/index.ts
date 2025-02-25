import { commonFieldPlugin } from "./commonField";
import { elementParserPlugin } from "./elementParser";
import { UserConfig } from "../config";
import { userBehaviorPlugin } from "./userBehavior";
import { errorParsePlugin } from "./errorParser";
import { Plugin } from "../plugin";
import { reportPlugin } from "./report";

export async function resolvePlugins(
  config: UserConfig,
  userPlugins: Plugin[]
): Promise<Plugin[]> {
  return [
    elementParserPlugin(),
    userBehaviorPlugin(),
    errorParsePlugin(),
    commonFieldPlugin(config),
    ...userPlugins,
    reportPlugin(config),
  ].filter(Boolean) as Plugin[];
}
