import { NS } from "@ns";
import { getHackableNetworkServers } from "./lib/interfaces/Network";

export async function main(ns: NS): Promise<void> {
  const bestHackableServer = getHackableNetworkServers(ns)[0];
  bestHackableServer.getReport().forEach(stat => ns.tprint(stat));
}
