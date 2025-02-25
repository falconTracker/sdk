import { CATEGORY, UserBehaviorType } from "../utils/constant";
import { Plugin } from "../plugin";
import { mergeConfig } from "../utils";
import { CollectData } from "src/collect";

export function elementParserPlugin(): Plugin {
  function propagateElement(target: HTMLElement | null): string {
    if (!target) {
      return "";
    }
    const tagName = target.tagName.toLowerCase();
    if (tagName === "body" || tagName === "html") {
      return "";
    }
    const classList = target.classList.value.split(" ").join(".");

    const id = target.id ? target.id : "";
    const result = propagateElement(target.parentElement);
    if (result) {
      return (
        propagateElement(target.parentElement) +
        " > " +
        `${tagName}#${id}.${classList}`
      );
    } else {
      // div#id.className1.className2
      return `${tagName}#${id}.${classList}`;
    }
  }

  return {
    name: "hawkEye-elementParser",
    load(data: CollectData) {
      if (
        data.category === CATEGORY.BEHAVIOR &&
        data.type === UserBehaviorType.UICLICK
      ) {
        const elementChain = propagateElement(data.event.target as HTMLElement);
        return mergeConfig(data, { data: { chain: elementChain } });
      }
    }
  };
}
