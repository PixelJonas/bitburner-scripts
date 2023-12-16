import { NS, Server } from "@ns";
import { getAllServers } from "./lib/scan";
import { BatchTask } from "./lib/BatchTask";

export async function schedule(ns: NS, tasks: Array<BatchTask>): Promise<void> {
  let openTasks = [...tasks];

  while (openTasks.length > 0) {
    ns.tprint(`starting to work on ${openTasks.length} tasks`)
    let task = openTasks.shift() as BatchTask;
    ns.tprint(`${openTasks.length}`)
    await scheduleTask(ns, task);
    await ns.sleep(10);
  }


}

export async function scheduleTask(ns: NS, task: BatchTask) {
  let allServers = await getAllServers(ns);

  // sort by available Ram ascending
  allServers = allServers.sort((a, b) => (a.maxRam - a.ramUsed) - (b.maxRam - b.ramUsed));
  var currenTask = { ...task };
  while (currenTask.threads > 0) {
    for (let server of allServers) {
      if (currenTask.threads <= 0) {
        return;
      }
      let ramAvailable = ns.getServerMaxRam(server.hostname) - ns.getServerUsedRam(server.hostname);
      let ramPerThread = ns.getScriptRam(currenTask.script);
      let maxThreads = Math.floor(ramAvailable / ramPerThread);
      if (maxThreads >= 1) {
        maxThreads = maxThreads > currenTask.threads ? maxThreads : currenTask.threads;
        ns.exec(currenTask.script, server.hostname, maxThreads, currenTask.target.hostname);
        ns.tprint(`${currenTask.script} against ${currenTask.target.hostname} (${maxThreads}/${currenTask.threads})`)
        currenTask = {
          ...currenTask,
          threads: currenTask.threads - maxThreads
        }
      }
    };
    await ns.sleep(1000);
  }
}
