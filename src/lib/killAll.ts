import { NS } from "@ns";
import { getAllServers } from "lib/scan";

export async function main(ns: NS): Promise<void> {
  killAll(ns);
}

export async function killAll(ns: NS): Promise<void> {
  ns.killall("home");
  let allServers = await getAllServers(ns);
  allServers.forEach(server => ns.killall(server.hostname))
}
