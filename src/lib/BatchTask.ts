import { NS, Server } from "@ns";
import { GROW_SCRIPT, HACK_SCRIPT, WEAKEN_SCRIPT } from "lib/contants";

export class BatchTask {
  script: string;
  target: Server;
  threads: number;

  public constructor(script: string, target: Server, threads = 1) {
    if ([WEAKEN_SCRIPT, HACK_SCRIPT, GROW_SCRIPT].indexOf(script) == -1) {
      throw Error(`script not available: ${script}`);
    }
    this.script = script;
    this.target = target;
    this.threads = threads;
  }

  getTaskRuntime(ns: NS): number {
    switch (this.script) {
      case WEAKEN_SCRIPT:
        return ns.getWeakenTime(this.target.hostname);
      case HACK_SCRIPT:
        return ns.getHackTime(this.target.hostname);
      case GROW_SCRIPT:
        return ns.getGrowTime(this.target.hostname);
      default:
        return 0;
    }
  }
}