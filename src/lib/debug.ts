import { NS } from "@ns";
import { getFreeRAMBotNet, printBotNetStats } from "lib/metrics";
import { getAllServers } from "lib/scan";
import { calcFreeAttackRAM, getAllRankedServerList, getAttackedServers } from "lib/servers";

export async function main(ns: NS): Promise<void> {
  //ns.tail();
  ns.disableLog("ALL");
  let allServersRanked = await getAllRankedServerList(ns, await getAllServers(ns));
  allServersRanked.forEach((server, index) => {
    ns.tprint(`${index + 1}: ${server.hostname}`);
  })
  await printBotNetStats(ns);

}
