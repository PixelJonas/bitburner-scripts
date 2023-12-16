import { NS } from "@ns";

export async function getServerPath(ns: NS, serverName: string): Promise<string[]> {
  let path = [serverName];
  while(serverName != 'home'){
    serverName = ns.scan(serverName)[0];
    path.unshift(serverName);
  }
  return path;
}
