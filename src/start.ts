import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  ns.tprint("running deployer.js");
  ns.run("deployer.js");
  ns.tprint("purchase-servers.js");
  ns.run("purchase-servers.js");
}
