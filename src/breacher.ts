import { NS } from "@ns";
import { getAllServers } from "./lib/scan";
import { executeHacks, nuke } from "./lib/hacks";
import { getNetworkServers } from "./lib/interfaces/Network";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  let sleepTime = 3000;
  let pid = 0;
  while (true) {
    let allServers = await getNetworkServers(ns);
    for (let server of allServers) {
      server.nuke()
    }
    await ns.sleep(sleepTime + 100);
  }

}
