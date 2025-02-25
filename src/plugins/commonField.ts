import { getPreUrl } from "../behavior/navigate";
import { CollectData } from "../collect";
import { UserConfig } from "../config";
import { Plugin } from "../plugin";
import { createRandomString, on } from "../utils";

interface UserAgentInfo {
  browser: string;
  version: string;
  os: string;
  os_version: string;
  device: string;
  userAgent: string;
}

interface ExtendedCollectData {
  markPage: string;
  agentInfo: UserAgentInfo;
  screenWidth: number;
  screenHeight: number;
  SDKVersion?: string;
  appId: string;
  preUrl: string;
  markUser: string;
  markUv: string;
}

type CollectDataWithExtendedProps = CollectData & ExtendedCollectData;

let result: UserAgentInfo;

// page flag，updated when onload event emit
let markPage = "";

function updateMarkPage() {
  markPage = createRandomString(10);
}

function getMarkPage() {
  return markPage;
}

function getMarkUser() {
  let markUser = sessionStorage.getItem("hawkEye_markUser") || "";
  if (!markUser) {
    markUser = createRandomString(10);
    sessionStorage.setItem("hawkEye_markUser", markUser);
  }
  return markUser;
}

// 获得Uv
function getMarkUv() {
  const date = new Date();
  let markUv = localStorage.getItem("hawkEye_markUv") || "";
  const dateTime = localStorage.getItem("hawkEye_markUvTime") || "";
  const today =
    date.getFullYear() +
    "/" +
    (date.getMonth() + 1) +
    "/" +
    date.getDate() +
    " 23:59:59";
  if ((!markUv && !dateTime) || date.getTime() > Number(dateTime) * 1) {
    markUv = createRandomString(10);
    localStorage.setItem("hawkEye_markUv", markUv);
    localStorage.setItem(
      "hawkEye_markUvTime",
      new Date(today).getTime().toString()
    );
  }
  return markUv;
}

export function getUserAgentInfo(): UserAgentInfo {
  if (result) {
    return result as UserAgentInfo;
  }
  const userAgent = navigator.userAgent;
  let browser = "unknown";
  let version = "unknown";
  let os = "unknown os";
  let os_version = "unknown version";
  const device: string = /Mobile/.test(userAgent) ? "mobile" : "pc";

  const browsers: { [key: string]: RegExp } = {
    Firefox: /Firefox\/([0-9.]+)/,
    Chrome: /Chrome\/([0-9.]+)/,
    Safari: /Version\/([0-9.]+).*Safari/,
    IE: /MSIE ([0-9.]+)|Trident.*rv:([0-9.]+)/,
  };

  for (const [name, regex] of Object.entries(browsers)) {
    const match = userAgent.match(regex);
    if (match) {
      browser = name;
      version = match[1] || match[2] || version;
      break;
    }
  }

  const osPatterns: {
    [key: string]: {
      regex: RegExp | null;
      version: (match: RegExpMatchArray) => string;
    };
  } = {
    Windows: {
      regex: /Windows NT ([0-9.]+)/,
      version: (match) => match[1],
    },
    MacOS: {
      regex: /Mac OS X ([0-9_]+)/,
      version: (match) => match[1].replace(/_/g, "."),
    },
    Linux: {
      regex: null,
      // Linux version information is usually not in the User Agent
      version: () => "",
    },
    Android: {
      regex: /Android ([0-9.]+)/,
      version: (match) => match[1],
    },
    iOS: {
      regex: /OS ([0-9_]+)/,
      version: (match) => match[1].replace(/_/g, "."),
    },
  };

  for (const [name, { regex, version }] of Object.entries(osPatterns)) {
    if (regex ? regex.test(userAgent) : /Linux/.test(userAgent)) {
      os = name;
      if (regex) {
        const match = userAgent.match(regex);
        os_version = match ? version(match) : os_version;
      }
      break;
    }
  }

  result = {
    browser,
    version,
    os,
    os_version,
    device,
    userAgent,
  };

  return result;
}

export function commonFieldPlugin(config: UserConfig): Plugin {
  return {
    name: "hawkEye-commonField",
    configResolved() {
      on("load", () => {
        updateMarkPage();
      });
    },
    load(data: CollectData): CollectDataWithExtendedProps {
      return {
        ...data,
        agentInfo: getUserAgentInfo(),
        markPage: getMarkPage(),
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        SDKVersion: config.SDKVersion,
        appId: config.appId || "",
        preUrl: getPreUrl(),
        markUser: getMarkUser(),
        markUv: getMarkUv(),
      };
    },
  };
}
