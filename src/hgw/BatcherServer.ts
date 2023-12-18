import { NS } from "@ns";
import { BatchParameter } from "hgw/BatchParameter";
import { BATCH_DELAY, HGW_MONEY_RATIO, INVALID_NUM_THREADS } from "hgw/constants";
import { has_max_money, has_min_security, hgw_script, hgw_wait_time, is_prepped, is_valid_target } from "hgw/util";
import { GROW_SCRIPT, HACK_SCRIPT, HOME_SERVER, WEAKEN_SCRIPT } from "lib/contants";
import { NetworkServer, can_run_script, free_ram, num_threads } from "lib/interfaces/NetworkServer";
import { assert, createSequence, hasFormulas } from "lib/util";

export class BatcherServer extends NetworkServer {
  ns: NS;

  static fromNetworkServer(networkserver: NetworkServer) {
    return new BatcherServer(networkserver.hostname, networkserver.getNS());
  }

  constructor(hostname: string, ns: NS) {
    super(ns, hostname);
    this.ns = ns;
    this.prep_server(hostname);
  }

  // The thread and RAM parameters for one Batch
  batch_parameters(host: string, hackThreads: number): BatchParameter {
    if (!hasFormulas(this.ns)) {
      this.ns.tprint(`FAIL: The Formulas API is required for HGW. Please use a different method`);
      throw Error("Formulas not unlocked");
    }
    const hackthreads = Math.floor(hackThreads);
    const server = this.ns.getServer(host);
    const hackTime = this.ns.getHackTime(host);
    const moneyFraction = this.ns.hackAnalyze(host);
    const moneyHacked = hackthreads * moneyFraction * server.moneyMax;
    server.hackDifficulty += this.ns.hackAnalyzeSecurity(hackthreads, host);
    server.moneyAvailable = server.moneyMax - moneyHacked;

    //Calculate the number of grow threads required, the time and the effect
    const growThreads = this.ns.formulas.hacking.growThreads(server, this.ns.getPlayer(), server.moneyMax);
    const growTime = this.ns.getGrowTime(host);

    //Calculate the number of weaken threads required and the time
    const hackSecurityIncrease = this.ns.hackAnalyzeSecurity(hackthreads, host);
    const growSecurityIncrease = this.ns.growthAnalyzeSecurity(growThreads, host);
    const totalSecurityIncrease = hackSecurityIncrease + growSecurityIncrease;

    const weakenThreads = Math.ceil(totalSecurityIncrease / this.ns.weakenAnalyze(1));
    const weakenTime = this.ns.getWeakenTime(host);

    const script_ram = (script: string) => this.ns.getScriptRam(script, HOME_SERVER);
    const required_ram = (script: string, nThreads: number) => nThreads * script_ram(script);
    return {
      hack: {
        ram: required_ram(HACK_SCRIPT, hackthreads),
        thread: hackthreads,
        time: hackTime
      },
      grow: {
        ram: required_ram(GROW_SCRIPT, growThreads),
        thread: growThreads,
        time: growTime
      },
      weaken: {
        ram: required_ram(WEAKEN_SCRIPT, weakenThreads),
        thread: weakenThreads,
        time: weakenTime
      }
    };

  }

  async hgw_action(target: string, action: "grow" | "weaken"): Promise<number> {
    assert(is_valid_target(target));
    const time = hgw_wait_time(this.ns, target, action);
    const script = hgw_script(action);
    if (!can_run_script(this.ns, script, this.hostname)) {
      this.ns.print(`FAIL: ${this.hostname} has not enough RAM to run script ${action}`);
      return 0;
    }


    const nthread = num_threads(this.ns, script, this.hostname);
    const option = { preventDuplicates: true, threads: nthread };
    const pid = this.ns.exec(script, this.hostname, option, target);
    await this.ns.sleep(time);
    const is_done = () => !this.ns.isRunning(pid);

    while (!is_done()) {
      await this.ns.sleep(1000);
    }
    return pid;
  }

  launch_batch(target: string, debug = false): boolean {
    const hackThreads = this.num_hthreads(target);
    if (hackThreads === INVALID_NUM_THREADS) {
      return false;
    }

    const parameters = this.batch_parameters(target, hackThreads);

    const exec = (script: string, nthreads: number, time: number) => {
      const option = { preventDuplicates: true, threads: nthreads };
      this.ns.exec(script, this.hostname, option, target, time, performance.now());
    }

    let growWaitTime = parameters.weaken.time - BATCH_DELAY - parameters.grow.time;
    const hackWaitTime = parameters.grow.time - BATCH_DELAY - parameters.hack.time;

    if (Math.floor(growWaitTime) <= 0) {
      growWaitTime = BATCH_DELAY;
    }
    
    if (debug) {
      this.ns.print(`------ BATCH DEBUG REPORT ------`);
      this.ns.print(`Hack: ${parameters.hack.ram}GB RAM | ${parameters.hack.thread} ms/hack | ${parameters.hack.thread} Threads`);
      this.ns.print(`Weaken: ${parameters.weaken.ram}GB RAM | ${parameters.weaken.thread} ms/hack | ${parameters.weaken.thread} Threads`);
      this.ns.print(`Grow: ${parameters.grow.ram}GB RAM | ${parameters.grow.thread} ms/hack | ${parameters.grow.thread} Threads`);
      this.ns.print(`------ BATCH DEBUG REPORT ------`);
      this.print();
    }
    exec(WEAKEN_SCRIPT, parameters.weaken.thread, 0);
    exec(GROW_SCRIPT, parameters.grow.thread, growWaitTime);
    exec(HACK_SCRIPT, parameters.hack.thread, growWaitTime + hackWaitTime);

    return true;
  }

  num_hthreads(target: string): number {
    const maxPercent = Math.floor(HGW_MONEY_RATIO * 100);
    const percentSequence = createSequence(maxPercent + 1);
    percentSequence.shift();
    percentSequence.reverse();

    //The maximum percentage of money we can hack while using only the RAM available on host
    const availableRAM = free_ram(this.ns, this.hostname);
    for (const percentage of percentSequence) {
      const money = (percentage / 100) * this.ns.getServerMaxMoney(target);
      const maxThreads = Math.ceil(this.ns.hackAnalyzeThreads(target, money));
      const parameters = this.batch_parameters(target, maxThreads);

      const thread = [
        parameters.hack.thread,
        parameters.grow.thread,
        parameters.weaken.thread
      ];
      const invalid_thread = (t: number) => t < 1;

      if (thread.some(invalid_thread)) {
        this.ns.print(`FAIL: There seems to be an issue with the threads. Cannot hack target ${target}`);
        this.ns.print(`------ BATCH DEBUG REPORT ------`);
        this.ns.print(`Hack: ${parameters.hack.ram}GB RAM | ${parameters.hack.thread} ms/hack | ${parameters.hack.thread} Threads`);
        this.ns.print(`Weaken: ${parameters.weaken.ram}GB RAM | ${parameters.weaken.thread} ms/hack | ${parameters.weaken.thread} Threads`);
        this.ns.print(`Grow: ${parameters.grow.ram}GB RAM | ${parameters.grow.thread} ms/hack | ${parameters.grow.thread} Threads`);
        this.ns.print(`------ BATCH DEBUG REPORT ------`);
        this.print();
        continue;
      };

      const totalRAMNeeded = parameters.hack.ram + parameters.grow.ram + parameters.weaken.ram;
      const exceedsRAM = totalRAMNeeded > availableRAM;
      //this.ns.print(`creating ${parameters.hack.thread} Hackthreads which need ${totalRAMNeeded.toFixed(2)}GB of ${availableRAM.toFixed(2)}GB RAM`);
      if (!exceedsRAM) {
        return parameters.hack.thread;
      }
    }
    return INVALID_NUM_THREADS;
  }

  async prep_server(host: string) {
    for (; ;) {
      if (!has_min_security(this.ns, host)) {
        await this.hgw_action(host, "weaken");
      }
      if (!has_max_money(this.ns, host)) {
        await this.hgw_action(host, "grow");
      }
      if (is_prepped(this.ns, host)) {
        return;
      }
      await this.ns.sleep(100);
    }
  }

  scp_scripts() {
    const file = [
      GROW_SCRIPT,
      WEAKEN_SCRIPT,
      HACK_SCRIPT
    ];
    this.ns.scp(file, this.hostname, HOME_SERVER);
  }
}