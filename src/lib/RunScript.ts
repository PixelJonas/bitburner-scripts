import { BasicHGWOptions, NS, RunOptions, Server } from "@ns";
import { MemoryMap } from "lib/interfaces/Ram";
import { GROW_SCRIPT, HOME_SERVER, WEAKEN_SCRIPT } from "lib/contants";

export function RunScript(ns: NS, scriptName: string, threads: number, params: any[], allowSpread: boolean, allowPartial: boolean, servers: Server[]) {
  let ramMap = new MemoryMap(ns, false, servers);

  // Find script RAM usage
  let ram = ns.getScriptRam(scriptName);

  // Fired threads counter
  let fired = 0;
  let pids = new Array();

  let prot = 0;

  let unique = 0;

  while (fired < threads) {
    ramMap = new MemoryMap(ns, false, servers);
    let candidate = ramMap.getBiggestBlock();

    let maxThreads = Math.floor(candidate / ram);
    if (maxThreads == 0) break;
    if (maxThreads > threads - fired) {
      maxThreads = threads - fired;
    }
    const blockSize = maxThreads * ram;
    let server: Server = ramMap.getReserveBlock(blockSize);

    let coreBonus = 1;
    if (GROW_SCRIPT == scriptName || WEAKEN_SCRIPT == scriptName) {
      let homeBlock = ramMap.getHomeBlock();
      let homeServer = ns.getServer(HOME_SERVER);

      if (homeBlock != undefined && homeBlock.coreBonus > 1 && threads * ram < homeServer.maxRam - homeServer.ramUsed) {
        if (server.hostname == 'home') {
          //ns.tprint(`INFO: Favoring home for ${scriptName} with ${threads}`);
        }
        else {
          server.hostname = 'home';
          ns.print(`INFO: Spawning ${scriptName} on home for bonus!`);
        }
        coreBonus = homeBlock.coreBonus;
      }
    }

    if (server != undefined) {
      ns.scp(scriptName, server.hostname, "home");

      let actualThreads = Math.ceil(maxThreads / coreBonus);
      if (actualThreads != maxThreads) {
        ns.print('INFO: Readjusting threads from ' + maxThreads + ' to ' + actualThreads);
      }

      let pid = ns.exec(scriptName, server.hostname, actualThreads, ...params, performance.now() + unique++);
      if (pid > 0) {
        //ns.print('Started script ' + scriptName + ' on ' + server.hostname + ' with ' + actualThreads + ' threads');
        pids.push(pid);
        fired += maxThreads;
      }
      else {
        ns.print('FAIL: Failed to launch script ' + scriptName + ' on ' + server.hostname + ' with ' + actualThreads + ' threads');
      }
    }
    else if (!allowPartial) {
      // Couldn't find a block big enough so can't allowPartial
      ns.print(`WARN: No Partials allowed, but no single Server has enough RAM to fit ${scriptName}`);
      break;
    }
    else if (!allowSpread) {
      // Couldn't find a block big enough and cannot allowSpread
      ns.print(`WARN: No Spread allowed, but no single Server has enough RAM to fit ${scriptName} with ${threads}`);
      break;
    }

    prot++;
    if (prot > 100) {
      ns.print('ERROR: RunScript infinite loop detected.');
      ns.print('INFO: candidate= ' + candidate + ' ram= ' + ram + ' maxThreads= ' + maxThreads + ' threads= ' + threads + ' fired=' + fired + ' blockSize=' + blockSize);
      break;
    }
  }

  if (fired != threads) {
    ns.print('ERROR: No server big enough to handle ' + threads + ' threads of ' + scriptName + ' (fired ' + fired + ' total)');
  }
  return pids;
}