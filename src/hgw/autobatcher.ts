import { BasicHGWOptions, NS, RunOptions } from "@ns";
import { PurchasedServer } from "lib/interfaces/PurchasedServer";
import { can_run_script } from "lib/interfaces/NetworkServer";
import { BATCHER_SCRIPT, HOME_SERVER, PURCHASED_SERVER_MAX_RAM, PURCHASED_SERVER_PREFIX, PURCHASED_SERVER_RAM_DEFAULT } from "lib/contants";
import { find_candidates } from "hgw/util";
import { hasFormulas } from "/lib/util";
import { AUTOHGW_TICK } from "./constants";


export async function main(ns: NS) {
  ns.disableLog("ALL");
  if (!hasFormulas(ns)) {
    ns.tprint(`FAIL: Formulas not found. HGW needs Formulas in order to work`);
    return;
  }
  for (; ;) {
    update(ns);
    await ns.sleep(AUTOHGW_TICK);
  }
}

function buy_server(ns: NS) {
  const purchasedServer = new PurchasedServer(ns);
  const cost = purchasedServer.cost(PURCHASED_SERVER_RAM_DEFAULT);

  if (!can_run_script(ns, BATCHER_SCRIPT, HOME_SERVER) || purchasedServer.has_max() || ns.getServerMoneyAvailable(HOME_SERVER) < cost) {
    return;
  }
  const target = find_target(ns);
  if (target == "") {
    return;
  }
  const host = purchasedServer.purchase(PURCHASED_SERVER_PREFIX, PURCHASED_SERVER_RAM_DEFAULT);
  const option: RunOptions = { preventDuplicates: true, threads: 1 };
  ns.exec(BATCHER_SCRIPT, HOME_SERVER, option, host, target);
}


function find_target(ns: NS) {
  let candidates = find_candidates(ns).map(server => server.hostname);
  const current_target = (host: string) => {
    const is_running = (target: string) => ns.isRunning(BATCHER_SCRIPT, HOME_SERVER, host, target);
    return candidates.find(is_running);
  }

  const targets = ns.getPurchasedServers().map(current_target);

  const not_target = (host: string) => !targets.includes(host);
  candidates = candidates.filter(not_target);

  return candidates.length === 0 ? "" : candidates[0];
}

function update(ns: NS) {
  buy_server(ns);
  upgrade_server(ns);
}

function upgrade_server(ns: NS) {
  const purchasedServer = new PurchasedServer(ns);
  const can_upgrade = (host: string) => purchasedServer.max_ram(host) < PURCHASED_SERVER_MAX_RAM;
  const upgrade_ram = (host: string) => purchasedServer.upgrade(host, 2 * purchasedServer.max_ram(host));
  purchasedServer.farm().filter(can_upgrade).forEach(upgrade_ram);
}