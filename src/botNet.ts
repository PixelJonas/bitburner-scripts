import { NS } from "@ns";
import { getAllServers } from "./lib/scan";
import { executeHacks, nuke } from "./lib/hacks";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  let sleepTime = 3000;
  while (true) {

    let allServers = await getAllServers(ns);
    for (let server of allServers) {
      if (!server.hasAdminRights) {
        await executeHacks(ns, server);
        await nuke(ns, server)
      }
    }
    await ns.sleep(sleepTime);
  }
}
