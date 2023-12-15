import { NS } from "@ns";
import { EARLY_HACK_SCRIPT } from "lib/contants";
import { getAllServers, getHackableServers } from "lib/scan";
import { executeHacks, nuke } from "./lib/hacks";
import { getBestServerToHack } from "./lib/servers";


export async function main(ns: NS): Promise<void> {
  let allServers = await getAllServers(ns);

  for (let server of allServers) {
    let hostname = server.hostname;
    ns.scp(EARLY_HACK_SCRIPT, hostname);
    if (!ns.hasRootAccess(hostname)) {
      await executeHacks(ns, server);
      await nuke(ns, server);
    }

    if (ns.hasRootAccess(hostname)) {
      let ramAvailable = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
      let ramPerThread = ns.getScriptRam(EARLY_HACK_SCRIPT);
      let maxThreads = Math.floor(ramAvailable / ramPerThread);
      let serverToHack = await getBestServerToHack(ns, await getHackableServers(ns)) || { hostname: "n00dles" };
      if (serverToHack) {
        ns.exec(EARLY_HACK_SCRIPT, hostname, maxThreads > 0 ? maxThreads : 1, serverToHack?.hostname);
      }
    }
  }
}
