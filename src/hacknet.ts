import { NS } from "@ns";
import { getMoney } from "lib/player";

export async function main(ns: NS, waitingTime: number = 30): Promise<void> {
  const MONEY_WAIT_TIME = 1000;
  const getProd = (level: number, ram: number, cores: number) => (level * 1.5) * Math.pow(1.035, ram - 1) * ((cores + 5) / 6);

  const PRODUCTION_MULTIPLIER = ns.getHacknetMultipliers().production;

  // check if you have any nodes on your hacknet and buy your first node
  if (!ns.hacknet.numNodes()) {
    while (await getMoney(ns) < ns.hacknet.getPurchaseNodeCost()) {
      await ns.sleep(MONEY_WAIT_TIME);
    }
    ns.hacknet.purchaseNode();
  }

  // check if you already got the TOR router and buy it if possible
  // Hacknet optimizer
  while (true) {
    let ratios = [];
    let hacknetProduction = 0;

    for (let index = 0; index < ns.hacknet.numNodes(); index++) {
      const { level, ram, cores, production } = ns.hacknet.getNodeStats(index);
      hacknetProduction += production;

      const levelUpgradeCost = ns.hacknet.getLevelUpgradeCost(index);
      const ramUpgradeCost = ns.hacknet.getRamUpgradeCost(index);
      const coreUpgradeCost = ns.hacknet.getCoreUpgradeCost(index);

      const levelUpgardeRatio = ((getProd(level + 1, ram, cores) * PRODUCTION_MULTIPLIER) - production) / levelUpgradeCost;
      const ramUpgardeRatio = ((getProd(level + 1, ram, cores) * PRODUCTION_MULTIPLIER) - production) / ramUpgradeCost;
      const coreUpgardeRatio = ((getProd(level + 1, ram, cores) * PRODUCTION_MULTIPLIER) - production) / coreUpgradeCost;

      const currentNodeUpgrade = [
        { ratio: levelUpgardeRatio, cost: levelUpgradeCost, nodeIndex: index, upgrade: "level" },
        { ratio: ramUpgardeRatio, cost: ramUpgradeCost, nodeIndex: index, upgrade: "ram" },
        { ratio: coreUpgardeRatio, cost: coreUpgradeCost, nodeIndex: index, upgrade: "core" },
      ]
      ratios.push(...currentNodeUpgrade);
    }

    //calculate most profitable upgrade
    const { cost, nodeIndex, upgrade } = ratios.sort((a, b) => b.ratio - a.ratio)[0];
    if (cost != Infinity && cost) {
      //wait until I have the money
      while (await getMoney(ns) < cost) {
        await ns.sleep(MONEY_WAIT_TIME);
      }
      switch (upgrade) {
        case "level":
          await ns.hacknet.upgradeLevel(nodeIndex);
          break;
        case "ram":
          await ns.hacknet.upgradeRam(nodeIndex);
          break;
        case "core":
          await ns.hacknet.upgradeCore(nodeIndex);
          break;
        default:
          continue;
      }

      const purchaseNodeCost = ns.hacknet.getPurchaseNodeCost();
      const missingMoney = purchaseNodeCost - await getMoney(ns);
      if (missingMoney < 0) {
        ns.hacknet.purchaseNode();
      } else if (missingMoney < hacknetProduction * waitingTime) {
        while (await getMoney(ns) < purchaseNodeCost) {
          await ns.sleep(MONEY_WAIT_TIME);
        }
        ns.hacknet.purchaseNode();
      }
    }
    await ns.sleep(100);
  }
}