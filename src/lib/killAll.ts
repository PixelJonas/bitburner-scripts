import { NS } from "@ns";
import { getAllServers } from "lib/scan";

export async function killAll(ns: NS): Promise<void> {
  let allServers = await getAllServers(ns);
  allServers.forEach(server => ns.killall(server.hostname))
}
