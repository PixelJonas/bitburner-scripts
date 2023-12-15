import { NS } from "@ns";

export async function getMoney(ns: NS): Promise<number> {
  return ns.getPlayer().money;
}
