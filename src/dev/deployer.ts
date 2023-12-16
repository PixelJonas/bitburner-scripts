import { NS, Server } from "@ns";
import { EARLY_HACK_SCRIPT, GROW_SCRIPT, HACK_SCRIPT, WEAKEN_SCRIPT } from "lib/contants";
import { getAllServers, getHackableServers } from "lib/scan";
import { executeHacks, nuke } from "lib/hacks";
import { copyServerFiles, getBestServerToHack } from "lib/servers";
import { BatchTask } from "lib/BatchTask";
import { schedule } from "scheduler";


export async function main(ns: NS): Promise<void> {
  let allServers = await getAllServers(ns);
  let sleepTime = 3000;
  let tasks: BatchTask[] = [];
  while (true) {
    let serverToHack = await getBestServerToHack(ns, await getHackableServers(ns)) || { hostname: "n00dles" } as Server;
    ns.tprint(`identified ${serverToHack.hostname} as best server to hack`);
    for (let server of allServers) {
      let hostname = server.hostname;
      copyServerFiles(ns, hostname);
      if (!ns.hasRootAccess(hostname)) {
        await executeHacks(ns, server);
        await nuke(ns, server);
      }

      if (ns.hasRootAccess(hostname)) {
        ns.tprint(`starting to hack ${serverToHack.hostname} from ${hostname}`);
        let ramAvailable = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
        let ramPerThread = ns.getScriptRam(WEAKEN_SCRIPT);
        let maxThreads = Math.floor(ramAvailable / ramPerThread);
        let moneyThreshold = ns.getServerMaxMoney(serverToHack.hostname) * 0.75;
        let securtiyThreshold = ns.getServerMinSecurityLevel(serverToHack.hostname) + 5;
        if (serverToHack && maxThreads > 0) {
          if (ns.getServerSecurityLevel(serverToHack.hostname) > securtiyThreshold) {
            sleepTime = ns.getWeakenTime(serverToHack.hostname);
            tasks.push(new BatchTask(WEAKEN_SCRIPT, serverToHack, maxThreads));
          } else if (ns.getServerMoneyAvailable(serverToHack.hostname) < moneyThreshold) {
            sleepTime = ns.getGrowTime(serverToHack.hostname);
            tasks.push(new BatchTask(GROW_SCRIPT, serverToHack, maxThreads));
          } else {
            sleepTime = ns.getHackTime(serverToHack.hostname);
            tasks.push(new BatchTask(HACK_SCRIPT, serverToHack, maxThreads));
          }
        }
      }
    }

    await schedule(ns, tasks);
    await ns.sleep(sleepTime + 100);
  }

}
