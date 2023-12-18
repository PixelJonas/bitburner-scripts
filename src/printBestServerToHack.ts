import { NS } from "@ns";
import { getHackableNetworkServers } from "./lib/interfaces/Network";

export async function main(ns: NS): Promise<void> {
  const bestHackableServer = getHackableNetworkServers(ns);
  bestHackableServer.reverse().forEach(server => {
    server.getReport().forEach(stat => ns.tprint(stat))
  });
}
