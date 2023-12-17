import { NS, ProcessInfo, Server } from "@ns";
import { DEFAULT_SHARE_PCT } from "./lib/contants";
import { MemoryMap } from "./lib/interfaces/Ram";
import { getAllServers } from "./lib/scan";
import { RunScript } from "./lib/RunScript";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  let [pct = DEFAULT_SHARE_PCT] = ns.args;
  let servers = await getAllServers(ns, true);
  if (ns.args.includes("auto")) {
    const ram = new MemoryMap(ns, true, servers);
    if (ram.total < 5000) {
      return;
    } else if (ram.total < 75000) {
      pct = 0.15;
    } else if (ram.total < 10000) {
      pct = 0.2;
    } else if (ram.total < 15000) {
      pct = 0.25;
    } else if (ram.total < 25000) {
      pct = 0.3;
    } else {
      pct = 0.35;
    }
  }

  if (ns.args.includes("stop")) {
    let data = findInstances(ns, servers);
    for (let process of data.shares) {
      ns.tprint(`WARN: Killing share-forever.js PID: ${process.pid}`);
      ns.kill(process.pid);
    }
    for (let process of data.duplicates) {
      ns.tprint(`WARN: Killing share.js PID: ${process.pid}`);
      ns.kill(process.pid);

    }
    return;

  }
  for (; ;) {
    ns.print("");
    ns.print("");
    adjustUsage(ns, servers, pct as number);
    ns.print(`Current share power: ${ns.getSharePower()}`);
    await ns.sleep(5000);
  }
}


function findInstances(ns: NS, servers: Server[]) {
  let allProcs: ProcessInfo[] = [];
  let duplicates = [];

  let totalRam = 0;
  for (let server of servers) {
    let processes = ns.ps(server.hostname);
    allProcs.push(...processes.filter(process => process.filename == "share-forever.js"));
    duplicates.push(...processes.filter(process => process.filename == "share.js" && process.args[0] != "stop"));
    if (server.hasAdminRights) {
      totalRam += server.maxRam;
    }
  }
  return {
    shares: allProcs.sort((a, b) => a.threads - b.threads),
    duplicates: duplicates,
    totalRam: totalRam
  }
}

function adjustUsage(ns: NS, servers: Server[], pct: number) {
  let data = findInstances(ns, servers);
  let shareThreads = data.shares.reduce((previous, current) => previous += current.threads, 0);
  let scriptRAM = ns.getScriptRam("share-forever.js");
  let sharePct = (shareThreads * scriptRAM) / data.totalRam;
  let targetThreads = Math.ceil(data.totalRam * pct / scriptRAM);

  if (shareThreads > targetThreads) {
    let killAmount = shareThreads - targetThreads;
    while (killAmount > 0 && data.shares.length > 0) {
      let share = data.shares[0];
      ns.print(`WARN: Killing ${share.threads} share threads`);
      shareThreads -= share.threads;
      killAmount -= share.threads;
      ns.kill(share.pid);
      data.shares.shift();
    }
    sharePct = (shareThreads * scriptRAM) / data.totalRam;
  }

  if (sharePct < pct) {
    let missingThreads = targetThreads - shareThreads;
    ns.print(`INFO: Attempting to start ${missingThreads} share threads`);
    RunScript(ns, "share-forever.js", missingThreads, ["", performance.now(), true], true, true, servers);
  }
}