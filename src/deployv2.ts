import { NS, ProcessInfo, Server } from "@ns";
import { getAllServers } from "./lib/scan";
import { copyServerFiles, getBestServerToHack } from "./lib/servers";
import { printServerStats } from "./lib/metrics";
import { executeHacks, nuke } from "./lib/hacks";
import { getHackableNetworkServers } from "./lib/interfaces/Network";

export async function main(ns: NS): Promise<void> {
  let sleepTime = 300000;
  let pid = 0;
  while (true) {
    let allServers = await getAllServers(ns, true);
    let serverToHack = getHackableNetworkServers(ns)[0];
    printServerStats(ns, serverToHack.hostname);

    let instances = findInstances(ns, allServers);
    if (instances.shares.length == 0) {
      pid = ns.exec("exploit.js", "home", 1, serverToHack.hostname);
      ns.tail(pid);

    }

    for (let instance of instances.shares) {
      //ns.tprint(`DEBUG: found instance ${instance.filename} running attacking ${instance.args[0]}`);
      if (!instance.args.includes(serverToHack.hostname)) {
        ns.tprint(`WARN: found that ${serverToHack.hostname} is better to hack than ${instance.args[0]}. Going to kill ${pid}`);
        ns.kill(pid);
        pid = ns.exec("exploit.js", "home", 1, serverToHack.hostname);
        ns.tail(pid);
      }
    }
    await ns.sleep(sleepTime + 100);
  }

}



function findInstances(ns: NS, servers: Server[]) {
  let allProcs: ProcessInfo[] = [];

  let totalRam = 0;
  for (let server of servers) {
    let processes = ns.ps(server.hostname);
    allProcs.push(...processes.filter(process => process.filename == "exploit.js"));
    if (server.hasAdminRights) {
      totalRam += server.maxRam;
    }
  }
  return {
    shares: allProcs.sort((a, b) => a.threads - b.threads),
    totalRam: totalRam
  }
}
