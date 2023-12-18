import { NS } from "@ns";
import { BatcherServer } from "hgw/BatcherServer";
import { is_hgw_action_done } from "hgw/util";
import { GROW_SCRIPT, HOME_SERVER } from "/lib/contants";
import { network, nuke_servers } from "/lib/interfaces/Network";
import { can_run_script, num_threads } from "/lib/interfaces/NetworkServer";
import { RunScript } from "/lib/RunScript";

async function grind(ns: NS, host: string) {
  let batchServer = new BatcherServer(host, ns);
  ns.print(`Waiting for ${host} to be prepped`);
  await batchServer.prep_server(host);
  ns.print(`${host} is prepped`);
  const time = 200;
  for (; ;) {
    const pid = grow_with_servers(ns, host)
    ns.print(`starting grow botnet on ${pid}`);
    while (!is_hgw_action_done(ns, pid)) {
      await ns.sleep(time);
    }
    await ns.sleep(10);
  }
}

function grow_with_servers(ns: NS, targetHost: string): number[] {
  const not_home = (server: string) => server !== HOME_SERVER;
  const can_run = (server: string) => can_run_script(ns, GROW_SCRIPT, server);
  const nthreads = (server: string) => num_threads(ns, GROW_SCRIPT, server);

  const executeGrow = (server: string) => {

    let pid = RunScript(ns, GROW_SCRIPT, nthreads(server), [targetHost, 0], false, false, [ns.getServer(server)]);
    return pid[0];
  }
  return network(ns)
    //.filter(not_home)
    .filter(can_run)
    .map(executeGrow);
}

export async function main(ns: NS) {
  ns.disableLog("ALL");
  const host = "joesguns";
  ns.tail();
  ns.print(`Farming ${host} for Hacking XP`);
  await grind(ns, host);
}
