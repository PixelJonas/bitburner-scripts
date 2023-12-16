import { NS } from "@ns";
import { EARLY_HACK_SCRIPT, GROW_SCRIPT, HACK_SCRIPT, WEAKEN_SCRIPT } from "lib/contants";
import { getAllServers, getHackableServers } from "lib/scan";
import { executeHacks, nuke } from "lib/hacks";
import { copyServerFiles, getBestServerToHack } from "lib/servers";
import { printServerStats } from "./lib/metrics";


export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  let sleepTime = 3000;
  while (true) {
    let allServers = await getAllServers(ns);
    let serverToHack = await getBestServerToHack(ns, await getHackableServers(ns)) || { hostname: "n00dles" };
    ns.tprint(`identified ${serverToHack.hostname} as best server to hack`);
    printServerStats(ns, serverToHack.hostname);
    for (let server of allServers) {
      let hostname = server.hostname;
      copyServerFiles(ns, hostname);
      if (!ns.hasRootAccess(hostname)) {
        await executeHacks(ns, server);
        await nuke(ns, server);
      }

      if (ns.hasRootAccess(hostname)) {
        let ramAvailable = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
        let ramPerThread = ns.getScriptRam(WEAKEN_SCRIPT);
        let maxThreads = Math.floor(ramAvailable / ramPerThread);
        let moneyThreshold = ns.getServerMaxMoney(serverToHack.hostname) * 0.75;
        let securtiyThreshold = ns.getServerMinSecurityLevel(serverToHack.hostname) + 5;
        if (serverToHack && maxThreads > 0) {
          if (ns.getServerSecurityLevel(serverToHack.hostname) > securtiyThreshold) {
            ns.weakenAnalyze(maxThreads)
            sleepTime = ns.getWeakenTime(serverToHack.hostname);
            ns.exec(WEAKEN_SCRIPT, hostname, maxThreads, serverToHack.hostname);
          } else if (ns.getServerMoneyAvailable(serverToHack.hostname) < moneyThreshold) {
            sleepTime = ns.getGrowTime(serverToHack.hostname);
            ns.exec(GROW_SCRIPT, hostname, maxThreads, serverToHack.hostname);
          } else {
            sleepTime = ns.getHackTime(serverToHack.hostname);
            ns.exec(HACK_SCRIPT, hostname, maxThreads, serverToHack.hostname);
          }
        }
      }
    }


    await ns.sleep(sleepTime + 100);
  }

}
