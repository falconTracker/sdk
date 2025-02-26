import { Plugin } from "../plugin";
import { UserConfig } from "../config";
import { REPORT_MODE } from "../utils/constant";


type voidFn = (...args: any[]) => void;

class Queue {
    private stack: any[] = [];
    private isFlushing = false;
    
    addTask(task: voidFn): void {
        if(typeof task !== 'function') return;
        if(!('Promise' in globalThis) && !('requestIdleCallback' in globalThis)) {
            setTimeout(() => {
                task();
            })
            return;
        }
        this.stack.push(task);
        if(!this.isFlushing) {
            this.isFlushing = true;
            if('requestIdleCallback' in globalThis) {
                globalThis.requestIdleCallback(() => {
                    this.flushStack();
                })
            } else {
                Promise.resolve().then(() => {
                    this.flushStack();
                })
            }
        }
    }

    flushStack() {
        const copy = this.stack.slice(0);
        this.stack.length = 0;
        this.isFlushing = false;
        for(let i = 0; i < copy.length; i++) {
            copy[i]();
        }
    }

    clearTask() {
        this.stack.length = 0;
    }

    getAllTask() {
        return this.stack;
    }
}

class TransportData {
  config: UserConfig;
  queue: Queue;
  constructor(config: UserConfig) {
      this.config = config;
      this.queue = new Queue();
  }

  private _getAdapter() {
      switch(this.config.reportMode) {
          case REPORT_MODE.BEACON:
              return navigator.sendBeacon.bind(navigator);
          case REPORT_MODE.IMG:
              return function(url: string, data: string) {
                  const img = new Image();
                  const spliceStr = url.indexOf('?') === -1 ? '?' : '&';
                  img.src = `${url}${spliceStr}data=${encodeURIComponent(data)}`;
              }
          case REPORT_MODE.XHR:
          default:
              return function (url: string, data: string) {
                  fetch(url, {
                      method: 'POST',
                      body: data,
                      headers: {
                          "Content-Type": "application/json"
                      }
                  }).catch(() => {})
              }
      }
  }

  // 可以自定义发送方式
  send(url: string, data: any) {
    const adapter = this._getAdapter();
    this.queue.addTask(() => {
        adapter(url, JSON.stringify(data));
    })
  }
}

export function reportPlugin(config: UserConfig): Plugin {
  const transport = new TransportData(config);
  return {
    name: 'falconTracker-report',
    end(data) {
        if(config.send != null) {
            if(typeof config.send === 'function') {
                config.send(data);
            }
        } else {
          transport.send(config.endpoint, data);
        }
    }
  }
}