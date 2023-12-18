import { NS } from "@ns";
import { getFreeRAMBotNet, printBotNetStats } from "lib/metrics";
import { getAllServers } from "lib/scan";
import { calcFreeAttackRAM, getAllRankedServerList, getAttackedServers } from "lib/servers";
import { connect_to_server, getHackableNetworkServers, getNetworkServers, network, nuke_servers, shortest_path } from "lib/interfaces/Network";
import { NetworkServer } from "lib/interfaces/NetworkServer";
import { BATCHER_SCRIPT, HOME_SERVER } from "lib/contants";
import { CLI } from "lib/interfaces/CLI";
import { BatcherServer } from "/hgw/BatcherServer";
import { Prepper } from "/hgw/Prepper";

export async function main(ns: NS): Promise<void> {
  ns.tail();
  ns.disableLog("ALL");
  let ram = ns.getScriptRam(BATCHER_SCRIPT);
  ns.tprint(ram);
}
