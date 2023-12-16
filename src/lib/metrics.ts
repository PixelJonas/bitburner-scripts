import { NS, Server } from "@ns";

export async function printServerStats(ns: NS, target: string): Promise<void> {
  let maxMemory = ns.getServerMaxRam(target);
  let usedMemory = ns.getServerUsedRam(target);
  let minSecurityLevel = ns.getServerMinSecurityLevel(target);
  let currentSecurityLevel = ns.getServerSecurityLevel(target);
  let maxMoney = ns.getServerMaxMoney(target);
  let currentMoney = ns.getServerMoneyAvailable(target);
  ns.tprint(`${target}: ${usedMemory}GB/${maxMemory}GB RAM | ${currentMoney.toExponential(2)}$/${maxMoney.toExponential(2)}$ | ${currentSecurityLevel}/${minSecurityLevel} Security Level`);
}
