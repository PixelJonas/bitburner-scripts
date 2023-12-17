import { NS } from "@ns";
import { getFreeRAMBotNet, printBotNetStats } from "lib/metrics";
import { getAllServers } from "lib/scan";
import { calcFreeAttackRAM, getAllRankedServerList, getAttackedServers } from "lib/servers";
import { getHackableNetworkServers, getNetworkServers, network, nuke_servers, shortest_path } from "lib/interfaces/Network";
import { NetworkServer } from "lib/interfaces/NetworkServer";

export async function main(ns: NS): Promise<void> {
  ns.tail();
  ns.disableLog("ALL");
  let foo = getHackableNetworkServers(ns);
  foo.forEach((server: NetworkServer) => server.print());
  ns.tprint(`All Servers: ${foo.length}`);
}
