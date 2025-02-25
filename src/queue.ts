/**
 * 消息队列，通过队列方式对上报函数进行有序处理
 */

type voidFn = (...args: any[]) => void;

export class Queue {
  private stack: any[] = [];
  private isFlushing = false;

  addTask(task: voidFn): void {
    if (typeof task !== "function") return;
    if (!("Promise" in globalThis) && !("requestIdleCallback" in globalThis)) {
      setTimeout(() => {
        task();
      });
      return;
    }
    this.stack.push(task);
    if (!this.isFlushing) {
      this.isFlushing = true;
      if ("requestIdleCallback" in globalThis) {
        globalThis.requestIdleCallback(() => {
          this.flushStack();
        });
      } else {
        Promise.resolve().then(() => {
          this.flushStack();
        });
      }
    }
  }

  flushStack() {
    const copy = this.stack.slice(0);
    this.stack.length = 0;
    this.isFlushing = false;
    for (let i = 0; i < copy.length; i++) {
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
