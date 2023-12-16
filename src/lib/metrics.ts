import { NS, Server } from "@ns";
import { getAllServers } from "lib/scan";
import { calcFreeAttackRAM, getAttackedServers } from "lib/servers";
import { MIN_HOME_RAM } from "lib/contants";

export async function printServerStats(ns: NS, target: string): Promise<void> {
  let maxMemory = ns.getServerMaxRam(target);
  let usedMemory = ns.getServerUsedRam(target);
  let minSecurityLevel = ns.getServerMinSecurityLevel(target);
  let currentSecurityLevel = ns.getServerSecurityLevel(target);
  let maxMoney = ns.getServerMaxMoney(target);
  let currentMoney = ns.getServerMoneyAvailable(target);
  ns.tprint(`${target}: ${usedMemory}GB/${maxMemory}GB RAM | ${currentMoney.toExponential(2)}$/${maxMoney.toExponential(2)}$ | ${currentSecurityLevel}/${minSecurityLevel} Security Level`);
}

export async function getFreeRAMBotNet(ns: NS): Promise<BotNetStats> {
  let allServers = await getAllServers(ns);
  allServers.push(ns.getServer("home"));
  let free = 0;
  let used = 0;
  let total = 0;
  for (let server of allServers.filter(server => server.hasAdminRights)) {
    total += server.maxRam;
    used += server.ramUsed;
    free = total - used;
  }
  total -= MIN_HOME_RAM;
  let freePercentage = (free / total * 100).toFixed(2);
  return {
    total,
    used,
    free,
    freePercentage
  }
}

export async function printBotNetStats(ns: NS) {
  let freeAttackRAM = await calcFreeAttackRAM(ns);
  ns.tprint(`AttackRAM: ${freeAttackRAM}GB`);
  const freeRAMBotNet = await getFreeRAMBotNet(ns);
  ns.tprint(`RAM Usage: ${(freeRAMBotNet).used}GB/${(freeRAMBotNet).total}GB (${(freeRAMBotNet).free} free | ${(freeRAMBotNet).freePercentage}%)`);
  ns.tprint(`Worst Case Scenario (all threads needed at one time): ${(freeRAMBotNet.total - freeAttackRAM).toFixed(2)}GB (${((freeRAMBotNet.total - freeAttackRAM) / freeRAMBotNet.total * 100).toFixed(2)}%) Free`);
  let attackedServers = await getAttackedServers(ns);
  ns.tprint(`------ Currently Attacked Servers (${attackedServers.length}) ------`);
  for (let server of attackedServers) {
    ns.tprint(`${server.hostname} | ${server.ramUsed}GB/${server.maxRam}GB | $${server.moneyAvailable?.toExponential(2)}/$${server.moneyMax?.toExponential(2)} | ${server.hackDifficulty?.toFixed(2)}/${server.minDifficulty}`);
  }
  ns.tprint(`------ Currently Attacked Servers ------`);
}


export interface BotNetStats {
  total: number;
  used: number;
  free: number;
  freePercentage: string;
}
