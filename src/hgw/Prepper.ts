import { NS, Server } from "@ns";
import { PrepParameter } from "hgw/PrepParameter";
import { BATCH_DELAY } from "hgw/constants";
import { is_hgw_action_done, is_prepped } from "hgw/util";
import { RunScript } from "/lib/RunScript";
import { GROW_SCRIPT, WEAKEN_SCRIPT } from "/lib/contants";
import { network } from "/lib/interfaces/Network";
import { NetworkServer } from "/lib/interfaces/NetworkServer";
import { hasFormulas } from "/lib/util";

export class Prepper {
  ns: NS;

  constructor(ns: NS) {
    this.ns = ns;
  }

  async prepareServer(server: string) {
    this.ns.print(`WARN: Starting to prep Server ${server}`);
    let networkServer = new NetworkServer(this.ns, server);
    networkServer.print();
    if (is_prepped(this.ns, server)) return;

    
    let botNetServers: Server[] = network(this.ns).map(server => this.ns.getServer(server));

    while (!is_prepped(this.ns, server)) {
      let serverObject = this.ns.getServer(server);
      let prepParameter = this.prep_parameters(server);

      let firstWeakenDelay = 0;
      let growDelay = prepParameter.firstWeaken.time + firstWeakenDelay - prepParameter.grow.time + BATCH_DELAY;
      if (growDelay < 0) {
        growDelay = BATCH_DELAY;
      }
      let secondWeakenDelay = prepParameter.grow.time + growDelay - prepParameter.secondWeaken.time + BATCH_DELAY;
      if (secondWeakenDelay < 0) {
        secondWeakenDelay = BATCH_DELAY * 2;
      }

      let allPids: number[] = [];
      if (prepParameter.firstWeaken.thread > 0) {
        this.ns.print(`INFO: Security over maximum - starting ${prepParameter.firstWeaken.thread} weaken threads`);
        const pids = RunScript(this.ns, WEAKEN_SCRIPT, prepParameter.firstWeaken.thread, [server, firstWeakenDelay], true, true, botNetServers,);
        allPids.push(...pids);
      }
      if (prepParameter.grow.thread > 0) {
        this.ns.print(`INFO: Funds are not maxed - starting ${prepParameter.grow.thread} grow threads`);
        const pids = RunScript(this.ns, GROW_SCRIPT, prepParameter.grow.thread, [server, growDelay], true, true, botNetServers);
        allPids.push(...pids);
      }
      if (prepParameter.secondWeaken.thread > 0) {
        this.ns.print(`INFO: Counteract the ${prepParameter.grow.thread} grow threads by staring ${prepParameter.secondWeaken.thread} weaken threads`);
        let delay = prepParameter.firstWeaken.time
        const pids = RunScript(this.ns, WEAKEN_SCRIPT, prepParameter.secondWeaken.thread, [server, secondWeakenDelay], true, true, botNetServers);
        allPids.push(...pids);
      }
      while (!is_hgw_action_done(this.ns, allPids)) {
        await this.ns.sleep(100);
      }
    }
  }

  prep_parameters(targetHost: string): PrepParameter {
    if (!hasFormulas(this.ns)) {
      this.ns.tprint(`FAIL: The Formulas API is required for HGW. Please use a different method`);
      throw Error("Formulas not unlocked");
    }

    let serverObject = this.ns.getServer(targetHost);
    let player = this.ns.getPlayer();

    //Getting the Server on minimal difficulty
    const firstWeakenTime = this.ns.formulas.hacking.weakenTime(serverObject, player);
    const weakenEffect = this.ns.weakenAnalyze(1);
    const firstWeakenThreadCount = Math.ceil((serverObject.hackDifficulty - serverObject.minDifficulty) / this.ns.weakenAnalyze(1));

    //Growing the Server to maximum money
    let growThreadCount = this.ns.formulas.hacking.growThreads(serverObject, player, serverObject.moneyMax);
    let growTime = this.ns.formulas.hacking.growTime(serverObject, player);
    const growSecurityIncrease = this.ns.growthAnalyzeSecurity(growThreadCount, targetHost);

    serverObject.hackDifficulty += growSecurityIncrease;

    //Weaken the Server to offset the security increase from grow
    let secondWeakenThreadCount = Math.ceil(growSecurityIncrease / weakenEffect);
    let secondWeakenTime = this.ns.formulas.hacking.weakenTime(serverObject, player);

    return {
      firstWeaken: {
        thread: firstWeakenThreadCount,
        time: firstWeakenTime,
        ram: 0
      },
      grow: {
        thread: growThreadCount,
        time: growTime,
        ram: 0
      },
      secondWeaken: {
        thread: secondWeakenThreadCount,
        time: secondWeakenTime,
        ram: 0
      }
    }
  }
}

