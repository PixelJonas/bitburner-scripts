import { NS } from "@ns";
import { MemoryMap } from "lib/interfaces/Ram";
import { Entry } from "lib/interfaces/Entry";
import { Report } from "lib/interfaces/Report";
import { ContractOrder } from "lib/interfaces/ContractOder";

import { getAllServers } from "lib/scan";
import { getServerPath } from "lib/pathfinding";

const CONTRACTS_FILE_NAME = "contractlist.txt";
const INFOCACHE_FILE_NAME = "infocache.txt";

// Cache information to be used by other scripts

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  let report: Report = {
    servers: [],
    portCrackers: 0,
    money: ns.getServerMoneyAvailable('home'),
    hackSkill: ns.getHackingLevel()
  };

  let joes = ns.getServer('joesguns');
  joes.hackDifficulty = joes.minDifficulty;

  report.canHackJoe = ns.formulas.hacking.weakenTime(joes, ns.getPlayer()) >= 120;

  const PROGRAMS = [
    'BruteSSH',
    'FTPCrack',
    'relaySMTP',
    'HTTPWorm',
    'SQLInject'
  ];

  const MAX_PORTS = PROGRAMS.filter(program => ns.fileExists(`${program}.exe`)).length;
  report.portCrackers = MAX_PORTS;
  ns.print(`INFO: ${report.portCrackers}/${PROGRAMS.length} port crackers available`);

  report.ram = new MemoryMap(ns, true, await getAllServers(ns, true));
  const servers = await getAllServers(ns, true);
  for (let server of servers) {
    const entry: Entry = {
      name: server.hostname,
      path: await getServerPath(ns, server.hostname)
    };

    const contracts = ns.ls(server.hostname, '.cct');
    entry.contracts = contracts;

    entry.ports = {
      open: server.openPortCount,
      needed: server.numOpenPortsRequired,
      nuked: server.hasAdminRights,
      backdoored: server.backdoorInstalled
    }

    entry.difficulty = {
      required: server.requiredHackingSkill,
      current: server.hackDifficulty
    }
    report.servers.push(entry);
  }
  ns.write(INFOCACHE_FILE_NAME, JSON.stringify(report, null, 2), "w");
}

export async function refreshInfoCache(ns: NS): Promise<false | Report> {
  await main(ns);
  return getInfoCache(ns);
}

export function getInfoCache(ns: NS): Report | false {
  return getFileSafe(ns, INFOCACHE_FILE_NAME);
}
export function getContracts(ns: NS): ContractOrder[] | false {
  return getFileSafe(ns, CONTRACTS_FILE_NAME);
}

export function getFileSafe(ns: NS, fileName: string): any | false {
  return JSON.parse(ns.read(fileName) || "false");
}

export function writeContracts(ns: NS, contracts: ContractOrder[]) {
  ns.write(CONTRACTS_FILE_NAME, JSON.stringify(contracts), "w");
}
