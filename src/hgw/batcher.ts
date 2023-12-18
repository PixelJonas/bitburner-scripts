import { NS } from "@ns";
import { BatcherServer } from "hgw/BatcherServer";
import { BATCH_SLEEP, MAX_BATCHES } from "hgw/constants";
import { is_valid_target } from "hgw/util";
import { Time } from "/lib/Time";
import { assert } from "/lib/util";
import { Prepper } from "./Prepper";

export async function main(ns: NS) {
  ns.disableLog("ALL");

  let [host, target] = ns.args;
  host = host as string;
  target = target as string
  assert(is_valid_target(host));
  assert(is_valid_target(target));
  assert(ns.getServerMaxMoney(target) > 0);

  ns.tprint(`INFO: Launching batcher(${host}) against ${target}`);
  await hack(ns, host, target);
}

/**
 * Use a parallel batcher to continuously hack a server.  Steal a certain
 * percentage of the server's money, then weaken/grow the server until it is at
 * minimum security level and maximum money.  Rinse and repeat.
 *
 * @param {NS} ns The Netscript API.
 * @param {string} host Hostname of a server to run the scripts on.
 * @param {string} target Hostname of the world server to target.
 */
async function hack(ns: NS, host: string, target: string) {
  const batcher = new BatcherServer(host, ns);
  batcher.scp_scripts();

  ns.print(`INFO: Prepping target ${target}`);
  batcher.print();

  let prepper = new Prepper(ns);

  await prepper.prepareServer(target);
  ns.print(`INFO: Target ${target} is prepped`);
  batcher.print();

  //Launch parallel batches whenever we can;
  let i = 0;
  let fail = 0;
  let max_fail = max_failures(ns, target);

  for (; ;) {
    const success = batcher.launch_batch(target, true);
    if (success) {
      i++;
      fail = 0;
      ns.print(`SUCCESS: Launched batch ${i}`);
    } else {
      fail++;
      ns.print(`FAIL: Failed to run batch ${i} (${fail} of ${max_fail} MAX Failures)`);
      await ns.sleep(1e3);
    }
    if (is_prep_time(i, fail, max_fail)) {
      ns.print(`INFO: Prep cycle, batches launched = ${i}, failures = ${fail}`);
      await batcher.prep_server(target);
      i = 0;
      fail = 0;
      max_fail = max_failures(ns, target);
    }
    await ns.sleep(BATCH_SLEEP);
  }


}

function max_failures(ns: NS, target: string): number {
  const nsecond = Math.ceil((new Time(ns.getWeakenTime(target)).toSeconds()));
  return Math.ceil(1.5 * nsecond)
}

function is_prep_time(batch: number, fail: number, max_fail: number): boolean {
  return batch >= MAX_BATCHES || fail >= max_fail
}