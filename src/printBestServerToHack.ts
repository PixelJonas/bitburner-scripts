import { NS } from "@ns";
import { searchServers } from "lib/scan";
import { getBestServerToHack } from "lib/servers";

export async function main(ns: NS): Promise<void> {
  let servers = await searchServers(ns);
  let bestServerToHack = await getBestServerToHack(ns, servers);
  ns.tprint(`best server = ${bestServerToHack?.hostname}`)
}
