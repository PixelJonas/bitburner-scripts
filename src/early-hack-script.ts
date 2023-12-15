import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  let target = ns.args[0] as string;
  let moneyThreshold = ns.getServerMaxMoney(target) * 0.75;
  let securtiyThreshold = ns.getServerMinSecurityLevel(target) + 5;
  
  while(true){
    if(ns.getServerSecurityLevel(target) > securtiyThreshold){
      await ns.weaken(target);
    } else if (ns.getServerMoneyAvailable(target) < moneyThreshold){
      await ns.grow(target);
    } else {
      await ns.hack(target);
    }
  }
}
