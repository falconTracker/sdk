# sdk

错误捕获上报 sdk。

## 安装

```shell
npm install @falconfracker/sdk --save-dev
```

## 简单使用

只需要配置服务端地址，就可以将错误直接上报到服务器中。

```js
import { init } from "@falconfracker/sdk";

init({
  endpoint: 'http://xxx',
});
```

默认会抓取首页加载性能相关数据、所有的 js 错误、资源加载异常错误以及所有异步请求；

## 配置

- endpoint：服务器上报地址
- appId：项目 id。
- reportMode：上报方式，可选 beacon | img | xhr
- send：自定义日志发送方式，会覆盖掉 reportMode。如果配置为 false，那么日志不会被发送。
- collectors：用于配置需要收集的数据。
- - performance：是否需要收集首页加载时的数据
- - api：是否需要收集异步请求的数据
- - behavior：是否需要收集用户操作，包括请求发送、点击、页面切换，可用于在出现错误时回溯用户操作。
- - jsError：捕获 js 错误相关配置
  - - collect：是否需要收集 js 错误
  - - repeat：对于重复的 js 错误，是否需要收集
- plugins：插件配置


## 捕获数据总览

- appId：项目 id
- url：当前上报数据时所处的页面 url
- timeStamp：数据产生的时间戳
- catagory：数据目录，分为三种目录
- - performance：页面性能
- - error：错误
- - behavior：用户操作
- type：具体数据类型，根据数据目录可以进行更细致的区分
- - catagory 为 performance 时：
- - - resource：页面加载时性能数据
- - - metric：页面加载时通过 web-vitals 获取到的指标数据
- - catagory 为 error 时：
- - - unhandledrejection：js 中未捕获的异常
- - - error：js 异常
- - - resource：资源加载异常
- - - request：请求异常
- - catagory 为 behavior 时：
- - - request：异步请求
- - - ui-click：点击
- - - navigation：切换页面
- markUser：一个字符串，可用于计算 pv（page view）。
- markUv: 一个字符串，可用于计算 uv（unique visitor）。
- markPage: 一个字符串，可用于标识页面，可以与 metric 数据进行绑定。
- preUrl：从网站哪个页面跳转进来的
- agentInfo: 浏览器相关信息
- - browser：浏览器类型
- - version：浏览器版本
- - device：设备类型，只支持区分 mobile 及 pc
- - os：系统类型
- - os_version：系统版本
- - user_agent: navigator.userAgent 值，可用于自行解析浏览器信息
- metric：web-vitals 中获取的数据
- - name：指标名称
- - rating：得分描述
- - value：具体分数
- navigationTiming：页面加载时的性能条目数据（PerformanceNavigationTiming 实例），可用于自定义页面加载时的各种耗时
- timing：从 navigationTiming 中计算出来的值，包含以下各种耗时
- - dnst：dns 解析耗时
- - tcpt：tcp 连接耗时
- - wit：页面加载白屏时长
- - domt：页面从加载到 dom 渲染完成耗时
- - lodt：页面从加载到 onload 事件触发耗时
- - radt：页面可以发送异步请求的耗时
- - rdit：页面重定向耗时
- - uodt：页面卸载的耗时
- - reqt：页面（html）下载耗时
- - andt：解析 dom 树耗时
- navigationType：导航类型，从 navigationTiming 中获取的
- entries：页面加载时获取到的资源条目列表，PerformanceResourceTiming 实例
- error：错误对象，ErrorEvent 实例
- stackFrames：通过 error-stack-parser 解析 error 对象后的结果， StackFrame 实例数组，每条 StackFrame 实例包含以下字段：
- - lineNumber：错误代码行数
- - columnNumber：错误代码列数
- - functionName：错误函数名
- - fileName：错误代码所处文件名
- - source：数据源
- data：根据不同类型的数据而包含以下字段
- - 请求相关
- - - method：请求方法
- - - params：请求参数
- - - duration：请求耗时
- - - resource：当前请求的 PerformanceResourceTiming 实例，可通过这个实例获取到更详细的信息
- - - status：状态码
- - - statusText：状态码描述
- - - message：请求响应的文本
- - - contentLength：请求响应大小（对于跨域请求，PerformanceResourceTiming 实例中的 decodedBodySize 值可能为 0，因此提供了 contentLength 字段）
- - 页面切换
- - - from：切换前的页面 url
- - - to：切换后的页面 url
- - 点击事件
- - - chain：被点击元素的路径，从 body 开始，按照最外层的元素一直往内的链，比如 `<div class="wrapper" id="parent"><a class="inner" id="son"></a></div>`，点击标签a时的链为 `div#parent.wrapper > a#son.inner`，# 字符后的为标签 id，. 字符后的为标签的类名，存在多个类名时会按照 `.xx.xxx` 进行链接。 id 和 class 为空时，默认存在 `#.`
- screenWidth：页面宽度
- screenHeight：页面高度
- SDKVersion：sdk 版本号

## 数据示例

上面展示的数据字段总览包含了全部的参数，但是实际上不同类型的数据字段不同

### 页面性能
 
```js
{
    appId: 'xxx',
    timeStamp: 12345678,
    catagory: 'performance',
    type: 'resource',
    markUser: 'ISq8gNXMBv1740628511799',
    markUv: '5wAVeIdMXt1740628511799',
    markPage: 'gt3E7cFACa1740641321522',
    url: 'http://xxx.com/b',
    preUrl: 'http://xxx.com/a',
    entries: [
      {
        connectEnd: 20.700000047683716,
        connectStart: 20.700000047683716
        decodedBodySize: 1368392
        deliveryType: ""
        domainLookupEnd: 20.700000047683716
        domainLookupStart: 20.700000047683716
        duration: 197.5
        ...
        // 更多可以查看 PerformanceResourceTiming
      }
    ],
    navigationTiming: {
      activationStart: 0,
      connectEnd: 8.100000143051147,
      connectStart: 6.6000001430511475,
      criticalCHRestart: 0,
      decodedBodySize: 6513,
      ...
      // 更多可以查看 PerformanceNavigationTiming
    },
    navigationType: 'reload',
    timing: {
      andt: 459.7999999523163,
      dnst: 0,
      domt: 375,
      lodt: 499.19999980926514,
      radt: 1.8000001907348633,
      rdit: 0,
      reqt: 2.9000000953674316,
      tcpt: 1.5,
      uodt: 0,
      wit: 8
    },
    SDKVersion: '0.0.4',
    agentInfo: {
      browser: "Chrome",
      device: "pc",
      os: "Windows",
      os_version: "10.0",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
      version: "133.0.0.0"
    },
    screenWidth: 1080,
    screenHeight: 960
}
```

### metric 指标

```js
{
    appId: 'xxx',
    timeStamp: 12345678,
    catagory: 'performance',
    type: 'metric',
    markUser: 'ISq8gNXMBv1740628511799',
    markUv: '5wAVeIdMXt1740628511799',
    markPage: 'gt3E7cFACa1740641321522',
    url: 'http://xxx.com/b',
    preUrl: 'http://xxx.com/a',
    metric: {
      name: 'FCP',
      rating: 'good',
      value: 172
    },
    SDKVersion: '0.0.4',
    agentInfo: {
      browser: "Chrome",
      device: "pc",
      os: "Windows",
      os_version: "10.0",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
      version: "133.0.0.0"
    },
    screenWidth: 1080,
    screenHeight: 960
}
```


### 请求成功

```js
{
    appId: 'xxx',
    timeStamp: 12345678,
    catagory: 'behavior',
    type: 'request',
    markUser: 'ISq8gNXMBv1740628511799',
    markUv: '5wAVeIdMXt1740628511799',
    markPage: 'gt3E7cFACa1740641321522',
    url: 'http://xxx.com/b',
    preUrl: 'http://xxx.com/a',
    data: {
      contentLength: 42,
      message: "{\"code\":401,\"msg\":\"登录状态已过期\"}",
      method: "GET",
      params: "",
      status: 200,
      statusText: "OK",
      resource: {
        initiatorType: 'xmlhttprequest',
        nextHopProtocol: 'http/1.1',
        deliveryType: '',
        workerStart: 0,
        redirectStart: 0
        ...
        // 更多可以查看 PerformanceResourceTiming
      },
    },
    SDKVersion: '0.0.4',
    agentInfo: {
      browser: "Chrome",
      device: "pc",
      os: "Windows",
      os_version: "10.0",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
      version: "133.0.0.0"
    },
    screenWidth: 1080,
    screenHeight: 960
}
```

### 点击

```js
{
    appId: 'xxx',
    timeStamp: 12345678,
    catagory: 'behavior',
    type: 'ui-click',
    markUser: 'ISq8gNXMBv1740628511799',
    markUv: '5wAVeIdMXt1740628511799',
    markPage: 'gt3E7cFACa1740641321522',
    url: 'http://xxx.com/b',
    preUrl: 'http://xxx.com/a',
    data: {
      chain: 'div#. > button#.'
    },
    event: {
      isTrusted: true,
      altKey: false,
      altitudeAngle: 1.5707963267948966,
      ...
      // 更多可以查看 PointerEvent
    },
    SDKVersion: '0.0.4',
    agentInfo: {
      browser: "Chrome",
      device: "pc",
      os: "Windows",
      os_version: "10.0",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
      version: "133.0.0.0"
    },
    screenWidth: 1080,
    screenHeight: 960
}
```

### 页面切换

```js
{
    appId: 'xxx',
    timeStamp: 12345678,
    catagory: 'behavior',
    type: 'navigation',
    markUser: 'ISq8gNXMBv1740628511799',
    markUv: '5wAVeIdMXt1740628511799',
    markPage: 'gt3E7cFACa1740641321522',
    url: 'http://xxx.com/b',
    preUrl: 'http://xxx.com/a',
    data: {
      from: 'http://xxx.com/b',
      to: 'http://xxx.com/a'
    },
    SDKVersion: '0.0.4',
    agentInfo: {
      browser: "Chrome",
      device: "pc",
      os: "Windows",
      os_version: "10.0",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
      version: "133.0.0.0"
    },
    screenWidth: 1080,
    screenHeight: 960
}
```

### 请求失败

```js
{
    appId: 'xxx',
    timeStamp: 12345678,
    catagory: 'error',
    type: 'request',
    markUser: 'ISq8gNXMBv1740628511799',
    markUv: '5wAVeIdMXt1740628511799',
    markPage: 'gt3E7cFACa1740641321522',
    url: 'http://xxx.com/b',
    preUrl: 'http://xxx.com/a',
    data: {
      method: "GET",
      params: "",
      status: -1,
      statusText: "error"，
      message: "Failed to request"
      resource: {
        initiatorType: 'xmlhttprequest',
        nextHopProtocol: 'http/1.1',
        deliveryType: '',
        workerStart: 0,
        redirectStart: 0
        ...
        // 更多可以查看 PerformanceResourceTiming
      }
    },
    SDKVersion: '0.0.4',
    agentInfo: {
      browser: "Chrome",
      device: "pc",
      os: "Windows",
      os_version: "10.0",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
      version: "133.0.0.0"
    },
    screenWidth: 1080,
    screenHeight: 960
}
```

### unhandledrejection 错误

```js
{
    appId: 'xxx',
    timeStamp: 12345678,
    catagory: 'error',
    type: 'unhandledrejection',
    markUser: 'ISq8gNXMBv1740628511799',
    markUv: '5wAVeIdMXt1740628511799',
    markPage: 'gt3E7cFACa1740641321522',
    url: 'http://xxx.com/b',
    preUrl: 'http://xxx.com/a',
    error: {
      isTrusted: true,
      bubbles: false,
      cancelBubble: false
      ...
      // 更多可以查看 PromiseRejectionEvent 
    },
    stackFrames: [
      {
        columnNumber: 9
        fileName: "http://xxx.com/index.js"
        functionName: "throwError"
        lineNumber: 211
        source: "    at throwError (http://xxx.com/index.js:211:9)"
      }
    ],
    message: "xxx is not defined",
    SDKVersion: '0.0.4',
    agentInfo: {
      browser: "Chrome",
      device: "pc",
      os: "Windows",
      os_version: "10.0",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
      version: "133.0.0.0"
    },
    screenWidth: 1080,
    screenHeight: 960
}
```

### js 错误

```js
{
    appId: 'xxx',
    timeStamp: 12345678,
    catagory: 'error',
    type: 'error',
    markUser: 'ISq8gNXMBv1740628511799',
    markUv: '5wAVeIdMXt1740628511799',
    markPage: 'gt3E7cFACa1740641321522',
    url: 'http://xxx.com/b',
    preUrl: 'http://xxx.com/a',
    error: {
      isTrusted: true,
      bubbles: false,
      cancelBubble: false
      ...
      // 更多可以查看 ErrorEvent 
    },
    stackFrames: [
      {
        columnNumber: 9
        fileName: "http://xxx.com/index.js"
        functionName: "throwError"
        lineNumber: 211
        source: "    at throwError (http://xxx.com/index.js:211:9)"
      }
    ],
    message: "xxx is not defined",
    SDKVersion: '0.0.4',
    agentInfo: {
      browser: "Chrome",
      device: "pc",
      os: "Windows",
      os_version: "10.0",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
      version: "133.0.0.0"
    },
    screenWidth: 1080,
    screenHeight: 960
}
```

### resource 错误

```js
{
    appId: 'xxx',
    timeStamp: 12345678,
    catagory: 'error',
    type: 'resource',
    markUser: 'ISq8gNXMBv1740628511799',
    markUv: '5wAVeIdMXt1740628511799',
    markPage: 'gt3E7cFACa1740641321522',
    url: 'http://xxx.com/b',
    preUrl: 'http://xxx.com/a',
    error: {
      isTrusted: true,
      bubbles: false,
      cancelBubble: false
      ...
      // 更多可以查看 Event 
    },
    message: 'script not found',
    target: {
      filename: 'http://xxx.com/main.js',
      type: 'script'
    },
    SDKVersion: '0.0.4',
    agentInfo: {
      browser: "Chrome",
      device: "pc",
      os: "Windows",
      os_version: "10.0",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0",
      version: "133.0.0.0"
    },
    screenWidth: 1080,
    screenHeight: 960
}
```

## 插件开发

@falconTracker/sdk 只做一个基础的数据收集，核心是插件，用户通过自定义插件，可以将收集到的数据进行加工，以便更好的适配接口。

### 属性

#### name

| Type | string |
|--|--|

插件名


#### config

| Type | (config: UserConfig) => any |
|--|--|

通过返回值可以将额外的配置添加到全局配置中

#### configResolved

| Type | (config: ResolvedConfig) => void \| Promise<void> |
|--|--|

通常用于获取完整的配置

#### emit

| Type | (data: CollectData) => void |
|--|--|


可用于监听收集的数据

#### load

| Type | (data: CollectData) => any |
|--|--|


通过返回值可以在数据中添加的额外字段

#### transform

| Type | (data: CollectData) => any |
|--|--|

数据转换，当存在返回值且返回值不为 false 时会被当成最终的上报对象，同时不会执行剩下的 transform 钩子，因此在配置 plugins 的时候要特别注意插件的顺序。

当返回值为 false 时，会把该条数据清除掉，不会触发 end 钩子。


#### end

| Type | (data: CollectData) => any |
|--|--|


数据处理完成后触发，通常在这个钩子中对最终的数据进行上报。