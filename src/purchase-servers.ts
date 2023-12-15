import { NS } from "@ns";
import { getMoney } from "./lib/player";
import { PURCHASED_SERVER_PREFIX } from "./lib/contants";

export async function main(ns: NS): Promise<void> {
  let requiredRam = 8;
  const MONEY_WAIT_TIME = 1000;
  let servers = ns.getPurchasedServers();
  const serverLimit = ns.getPurchasedServerLimit();

  while (true) {

    for (let i = 0; i < servers.length; i++) {
      let name = `${PURCHASED_SERVER_PREFIX}${i}`;

      ns.tprint(`Buying servers for ${requiredRam}GB of RAM now`);
      const availableMoney = await getMoney(ns);
      const serverCost = ns.getPurchasedServerCost(requiredRam);
      //wait for enough money
      while (serverCost > availableMoney) {
        ns.print(`Available money (${(availableMoney).toLocaleString()}) is less than server cost for specified ram (${(serverCost).toLocaleString()})`)
        await ns.sleep(MONEY_WAIT_TIME);
      }
      if (servers.includes(name)) {
        if (ns.getServerMaxRam(name) < requiredRam) {
          ns.tprint(`Deleting "${name}" as we can upgrade it to ${requiredRam}GB of RAM`)
          ns.killall(name);
          ns.deleteServer(name);
        } else {
          continue;
        }
      }
      ns.tprint(`Purchasing server using name "${name}" with ${requiredRam}GB of RAM`)
      ns.purchaseServer(name, requiredRam);
      ns.tprint(`You know have ${servers.length}/${serverLimit} of servers`);

    }
    requiredRam *= 2;
    servers = ns.getPurchasedServers();
    await ns.sleep(1000);
  }
}
