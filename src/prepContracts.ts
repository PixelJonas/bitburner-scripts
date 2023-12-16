import { NS } from "@ns";
import { getInfoCache, refreshInfoCache, writeContracts } from "./lib/infoCache";
import { ContractOrder } from "./lib/interfaces/ContractOder";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  const [silent = false] = ns.args;

  let infocache = await refreshInfoCache(ns);
  if (!infocache) {
    ns.tprint(`FAIL: Could not read infocache. Please run lib/infoCache.js before calling this script`);
    return;
  }

  let output: ContractOrder[] = [];
  for (let server of infocache.servers) {
    if (server.contracts?.length == 0) continue;

    for (let contract of server.contracts as string[]) {
      const type = ns.codingcontract.getContractType(contract, server.name);
      const data = ns.codingcontract.getData(contract, server.name);
      output.push({ server: server.name, file: contract, type: type, data: data });
    }
  }
  if (!silent) {
    ns.tprint(`INFO: Found ${output.length} contracts`);
    writeContracts(ns, output);
  }

}
