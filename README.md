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

## 插件开发

@hawkEye/sdk 只做一个基础的数据收集，核心是插件，用户通过自定义插件，可以将收集到的数据进行加工，以便更好的适配接口。

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