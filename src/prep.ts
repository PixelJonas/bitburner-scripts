import { NS } from "@ns";
import { is_prepped } from "./hgw/util";
import { BatcherServer } from "./hgw/BatcherServer";

export async function main(ns: NS): Promise<void> {
  let [target, host] = ns.args;
  target = target as string;
  host = host as string;
  if (!target) {
    ns.tprint(`ERROR: No target defined for preppring`);
    return;
  }
  let hostServer = new BatcherServer(host, ns);
  hostServer.scp_scripts();
  await hostServer.prep_server(target);

  while (!is_prepped(ns, target)) {

    await ns.sleep(300);
  }
}
