import { NS } from "@ns";
import { killAll } from "lib/killAll";

export async function main(ns: NS): Promise<void> {
  killAll(ns);
  ns.run("deployer.js");
}
