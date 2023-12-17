import { Server } from "@ns";
import { MemoryMap } from "lib/interfaces/Ram";

export function RunScript(ns, scriptName, threads, params, allowSpread, allowPartial, servers: Server[]) {
  let ramMap = new MemoryMap(ns, false, servers);

  // Find script RAM usage
  let ram = ns.getScriptRam(scriptName);

  // Fired threads counter
  let fired = 0;
  let pids = new Array();

  let prot = 0;

  let unique = 0;

  while (fired < threads) {
    let candidate = ramMap.getBiggestBlock();

    let maxThreads = Math.floor(candidate / ram);
    if (maxThreads == 0) break;
    if (maxThreads > threads - fired) {
      maxThreads = threads - fired;
    }
    const blockSize = maxThreads * ram;
    let server: Server = ramMap.getReserveBlock(blockSize);

    let coreBonus = 1;

    if (scriptName.startsWith('grow') || scriptName.startsWith('weaken')) {
      let homeBlock = ramMap.getHomeBlock();
      if (homeBlock != undefined && homeBlock.coreBonus > 1 && threads * ram < homeBlock.free - homeBlock.reserved) {
        if (server.hostname == 'home') {
          //ns.tprint('INFO: Favoring home for');
        }
        else {
          server.hostname = 'home';
          //ns.tprint('INFO: Spawning grow on home for bonus!');
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
        ns.print('Started script ' + scriptName + ' on ' + server.hostname + ' with ' + actualThreads + ' threads');
        pids.push(pid);
        fired += maxThreads;
      }
      else {
        ns.print('FAIL: Failed to launch script ' + scriptName + ' on ' + server.hostname + ' with ' + actualThreads + ' threads');
      }
    }
    else if (!allowPartial) {
      // Couldn't find a block big enough so can't allowPartial
      break;
    }
    else if (!allowSpread) {
      // Couldn't find a block big enough and cannot allowSpread
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