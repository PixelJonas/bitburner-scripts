import { Server, NS } from "@ns";
import { CONSTANTS_SCRIPT, DEFAULT_PCT, EARLY_HACK_SCRIPT, GROW_SCRIPT, HACK_SCRIPT, WEAKEN_SCRIPT } from "lib/contants";
import { getAllServers } from "lib/scan";

/**
 * Get the best server we can hack with our current hacking level
 * @param {import(".").NS} ns
 * @param servers
 */
export async function getBestServerToHack(ns: NS, servers: Server[]): Promise<Server | undefined> {
  let calcServers = await getAllRankedServerList(ns, servers)
  return calcServers.shift();
}

export async function getAllRankedServerList(ns: NS, servers: Server[]): Promise<Server[]> {
  const hasFormulas = ns.fileExists("Formulas.exe");
  const availablePortHacks = [
    ns.fileExists("FTPCrack.exe"),
    ns.fileExists("BruteSSH.exe"),
    ns.fileExists("relaySMTP.exe"),
    ns.fileExists("HTTPWorm.exe"),
    ns.fileExists("SQLInject.exe")
  ].filter(x => x).length

  const player = ns.getPlayer();

  const mults = ns.getHackingMultipliers();
  const allMults = mults?.chance * mults?.speed * mults?.money * mults?.growth;
  const level = ns.getHackingLevel();
  // const hackingLevel =
  //   ns.fileExists('Formulas.exe') ?
  //     ns.formulas.skills.calculateSkill(level, allMults) :
  //     ns.getHackingLevel();
  // ns.tprint(`Hacking Level: ${allMults}`)
  const hackingLevel = ns.getHackingLevel();
  const notNullServers = servers
    .filter((server: Server) => !!server)
    .filter((server: Server) => server != null);

  const calcServers = notNullServers
    .filter((server: Server) => server.moneyMax ?? 0 > 0)
    .filter((server: Server) => ns.getServerNumPortsRequired(server.hostname) <= availablePortHacks)
    .filter((server: Server) => {
      // ns.tprint(`Checking if ${server.requiredHackingSkill} is less than or equal to ${hackingLevel}`)
      const thing = (server.requiredHackingSkill ?? 0) <= hackingLevel * 0.5;
      // ns.tprint(`${server.requiredHackingSkill} ${thing ? "is" : "is not"} less than or equal to ${hackingLevel}`)
      return thing;
    })
    .sort((a: Server, b: Server) => {
      const orDefaultMoneyMaxA = a.moneyMax ?? 0;
      const orDefaultMoneyMaxB = b.moneyMax ?? 0;

      const orDefaultMinDifficultyA = a.minDifficulty ?? 1;
      const orDefaultMinDifficultyB = b.minDifficulty ?? 1;
      if (hasFormulas) {
        const hackChanceA = ns.formulas.hacking.hackChance(a, player);
        const hackChanceB = ns.formulas.hacking.hackChance(b, player);
        return (orDefaultMoneyMaxB / orDefaultMinDifficultyB) * hackChanceB -
          (orDefaultMoneyMaxA / orDefaultMinDifficultyA * hackChanceA)
      } else {
        return (orDefaultMoneyMaxB / orDefaultMinDifficultyB) - (orDefaultMoneyMaxA / orDefaultMinDifficultyA);
      }

    });

  //calcServers.forEach((server, index) => ns.tprint(`${index}: ${server.hostname}`));


  let firstItem: Server, lastItem: Server | null = null;
  let lastRate = 0;
  let firstRate = 0;

  if (calcServers.length == 0) {
    return [];
  }

  if (hasFormulas) {
    firstItem = calcServers[0];
    firstRate = ns.formulas.hacking.hackPercent(firstItem, player);

    lastItem = calcServers[calcServers.length - 1];
    lastRate = ns.formulas.hacking.hackPercent(lastItem, player);
  } else {
    firstItem = calcServers[0];

    const firstItemMoneyMax = firstItem.moneyMax ?? 0;
    const firstItemMinDifficulty = firstItem.minDifficulty ?? 0;

    firstRate = firstItemMoneyMax / firstItemMinDifficulty;

    lastItem = calcServers[calcServers.length - 1];

    const lastItemMoneyMax = lastItem.moneyMax ?? 0;
    const lastItemMinDifficulty = lastItem.minDifficulty ?? 0;
    lastRate = lastItemMoneyMax / lastItemMinDifficulty as any;
  }


  //ns.print(`First server: ${JSON.stringify(firstItem, null, 2)}\nRate: ${firstRate * 100}`);
  //ns.print(`Last server: ${JSON.stringify(lastItem, null, 2)}\nRate: ${lastRate * 100}`);

  return calcServers.filter(server => ns.hasRootAccess(server.hostname));
}

export async function copyServerFiles(ns: NS, target: string): Promise<void> {
  let filesToCopy = [
    EARLY_HACK_SCRIPT,
    CONSTANTS_SCRIPT,
    WEAKEN_SCRIPT,
    GROW_SCRIPT,
    HACK_SCRIPT
  ]
  for (const file of filesToCopy) {
    let fileExists = ns.fileExists(file, target);
    if (!fileExists) {
      ns.scp(file, target, "home")
    }
  }
}


export async function getAttackedServers(ns: NS): Promise<Server[]> {

  let allServers = await getAllRankedServerList(ns, await getAllServers(ns));
  const attackedServers: Server[] = [];
  for (let server of allServers) {
    let isAttacked = ns.getRunningScript("exploit.js", "home", server.hostname);

    if (isAttacked) {
      attackedServers.push(server);
    }
  }
  return attackedServers;
}


export async function calcFreeAttackRAM(ns: NS): Promise<number> {

  let currentlyUnderAttack = await getAttackedServers(ns);
  let totalRAMUsage = 0;

  let ramUsageArray = currentlyUnderAttack.map(server => calcAttackRAMUsage(ns, server));
  for (let ramUsage of ramUsageArray) {
    totalRAMUsage += await ramUsage;
  }
  return totalRAMUsage
}

export async function calcAttackRAMUsage(ns: NS, server: Server): Promise<number> {
  const maxMoney = server.moneyMax || 1;
  let growThreads = Math.ceil(ns.growthAnalyze(server.hostname, maxMoney / (maxMoney * DEFAULT_PCT)));
  let growRAM = ns.getScriptRam("v1grow.js", "home") * growThreads;

  let weakenThreads = Math.ceil(((server.baseDifficulty || 1) - (server.minDifficulty || 1)) / ns.weakenAnalyze(1));
  let weakenRAM = ns.getScriptRam("v1weaken.js", "home") * weakenThreads;

  let hackThreads = Math.floor(ns.hackAnalyzeThreads(server.hostname, (server.moneyMax || 1) * DEFAULT_PCT));
  let hackRAM = ns.getScriptRam("v1hack.js", "home") * hackThreads;

  //ns.tprint(`Weaken RAM Usage: ${weakenRAM}GB | Grow RAM Usage: ${growRAM}GB | Hack RAM Usage: ${hackRAM}`);

  return Math.max(weakenRAM, growRAM, hackRAM);
}
