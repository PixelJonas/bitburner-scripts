import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  let requiredRam = 8;
  const targetServer = "joesguns";

  ns.tprint(`Purchased servers ${ns.getPurchasedServers().length}`);
  const serverLimit = ns.getPurchasedServerLimit();
  if (ns.getPurchasedServers().length === serverLimit) {
    ns.tprint(`You already have ${serverLimit} with at least ${requiredRam} GB of RAM. Exiting ...`)
  }
  for (let i = ns.getPurchasedServers().length; i < serverLimit; i++) {
    ns.tprint(`i: ${i}`);
    if (ns.getPurchasedServers().length < serverLimit) {
      const availableMoney = ns.getServerMoneyAvailable("home")
      const serverCost = ns.getPurchasedServerCost(requiredRam)
      ns.tprint(`Purchased servers (${ns.getPurchasedServers().length}) is less than serverLimit ${serverLimit}`)
      if (availableMoney > serverCost) {
        const psr = `pserv-${i}`;
        ns.tprint(`Purchasing server using name "${psr}" with ${requiredRam} GB of RAM`)
        ns.purchaseServer(psr, requiredRam);
      } else {
        ns.tprint(`Available money (${(availableMoney).toLocaleString()}) is less than server cost for specified ram (${(serverCost).toLocaleString()})`)
      }
    } else {
      ns.tprint(`You own ${ns.getPurchasedServers().length} servers. You cannot purchase more than ${serverLimit}.`);
    }
  }

}
