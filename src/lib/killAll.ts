import { NS } from "@ns";
import { searchServers } from "lib/scan";

export async function killAll(ns: NS): Promise<void> {
  let allServers = await searchServers(ns);
  allServers.forEach(server => ns.killall(server.hostname))
}
