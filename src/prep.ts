import { NS, Server } from "@ns";

export async function main(ns: NS, target: Server): Promise<void> {
  if(!target){
    ns.tprint(`ERROR: No target defined for preppring`);
    return;
  }

  if(isPrepped(ns, target)){
    ns.tprint(`INFO: ${target.hostname} is already prepped`);
  }else{
    await prepareServer(ns, target);
  }
}


function isPrepped(ns: NS, target: Server): boolean {
  return (target.moneyAvailable || 0) < (target.moneyMax || 0) && (target.hackDifficulty || 0) > (target.minDifficulty || 0);
}

export async function prepareServer(ns: NS, target: Server): Promise<void> {
  let batchPrep = getBatchPrep(ns, target);
  while(batchPrep.growthThreads.growthThreadCount >= 0 && batchPrep.weakenThreads >= 0){
    

    await ns.sleep(200);
  }
}

function getBatchPrep(ns: NS, target: Server) {
  let weakenThreads = calcWeakenThreads(ns, target);
  let growthThreads = calcGrowthThreads(ns, target);
  return {
    weakenThreads: weakenThreads,
    growthThreads: growthThreads
  }
}


export function calcWeakenThreads(ns: NS, target: Server): number{
  let weakenPerThread = ns.weakenAnalyze(1, 1);
  let securityLevel = ns.getServerSecurityLevel(target.hostname);
  return Math.floor(securityLevel - ns.getServerMinSecurityLevel(target.hostname) / weakenPerThread);
}

export function calcGrowthThreads(ns: NS, target: Server): { growthThreadCount: number; weakenThreadCount: number; }{
  let growthNeeded = (target.moneyMax || 0 ) / (target.moneyAvailable || 1);
  let growthThreadCount = ns.growthAnalyze(target.hostname, growthNeeded, 1);
  let securityOffset = ns.growthAnalyzeSecurity(growthThreadCount, target.hostname, 1);
  let weakenPerThread = ns.weakenAnalyze(1, 1);
  return {
    growthThreadCount: growthThreadCount,
    weakenThreadCount: Math.floor(securityOffset / weakenPerThread)
  };
}
