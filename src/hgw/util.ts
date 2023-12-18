import { NS } from "@ns";
import { HGWAction } from "hgw/HGWAction";
import { GROW_SCRIPT, HACK_SCRIPT, HOME_SERVER, WEAKEN_SCRIPT } from "lib/contants";
import { assert } from "lib/util";
import { getHackableNetworkServers } from "/lib/interfaces/Network";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");
}

export function is_valid_target(host: string): boolean {
  return host.length > 0 && host !== HOME_SERVER;
}

export function hgw_wait_time(ns: NS, host: string, action: HGWAction): number {
  switch (action) {
    case "grow":
      return ns.getGrowTime(host);
    case "weaken":
      return ns.getWeakenTime(host);
    case "hack":
      return ns.getHackTime(host);
  }
}

export function hgw_script(action: HGWAction): string {
  switch (action) {
    case "grow":
      return GROW_SCRIPT;
    case "weaken":
      return WEAKEN_SCRIPT;
    case "hack":
      return HACK_SCRIPT;
  }
}

export function has_min_security(ns: NS, host: string): boolean {
  const { hackDifficulty, minDifficulty } = ns.getServer(host);
  return hackDifficulty <= minDifficulty;
}

export function is_prepped(ns: NS, host: string): boolean {
  return has_min_security(ns, host) && has_max_money(ns, host);
}

export function has_max_money(ns: NS, host: string): boolean {
  const { moneyAvailable, moneyMax } = ns.getServer(host);
  return moneyAvailable >= moneyMax;
}


export function is_hgw_action_done(ns: NS, pid: number[]) {
  assert(pid.length > 0);
  const is_done = (i) => !ns.isRunning(i);
  return pid.every(is_done);
}

export function is_action_done(ns: NS, pid: number) {
  return !ns.isRunning(pid);
}

export function find_candidates(ns: NS) {
  return getHackableNetworkServers(ns);
}