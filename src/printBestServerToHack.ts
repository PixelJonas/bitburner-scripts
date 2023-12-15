import { NS } from "@ns";
import { getHackableServers } from "lib/scan";
import { getBestServerToHack } from "lib/servers";

export async function main(ns: NS): Promise<void> {
  let servers = await getHackableServers(ns);
  let bestServerToHack = await getBestServerToHack(ns, servers);
  ns.tprint(`best server = ${bestServerToHack?.hostname}`)
}
