import { NS } from "@ns";
import { HOME_SERVER } from "lib/contants";

export class PurchasedServer {
  ns: NS;

  moneyAvailable: number;

  constructor(ns: NS) {
    this.ns = ns;
  }

  can_upgrade(ram: number) {
    return this.ns.getServerMoneyAvailable(HOME_SERVER) > this.cost(ram);
  }

  cost(ram: number): number {
    return this.ns.getPurchasedServerCost(ram);
  }

  farm(): string[] {
    return this.ns.getPurchasedServers();
  }

  has_max(): boolean {
    return this.farm().length === this.limit();
  }

  limit(): number {
    return this.ns.getPurchasedServerLimit();
  }

  has_server(host: string) {
    return this.farm().includes(host);
  }

  max_ram(host: string): number {
    return this.ns.getServerMaxRam(host);
  }

  purchase(host: string, ram) {
    return this.ns.purchaseServer(host, ram);
  }

  upgrade(host: string, ram: number): boolean {
    if (!this.can_upgrade(ram) || this.max_ram(host) >= ram) {
      return false;
    }
    return this.ns.upgradePurchasedServer(host, ram);
  }
}