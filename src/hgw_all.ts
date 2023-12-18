import { NS } from "@ns";
import { PurchasedServer } from "./lib/interfaces/PurchasedServer";
import { getHackableNetworkServers } from "lib/interfaces/Network";
import { BATCHER_SCRIPT, HOME_SERVER } from "lib/contants";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");
  ns.tail();
  let psManager = new PurchasedServer(ns);
  let hackTargets = getHackableNetworkServers(ns).filter(target => target.has_root_access());
  let hackTarget = hackTargets.shift();
  psManager.farm().forEach(server => {
    if (hackTarget.has_root_access()) {
      ns.exec(BATCHER_SCRIPT, HOME_SERVER, { preventDuplicates: true, threads: 1 }, server, hackTarget.hostname);
    }
  });
}
