import { NS } from "@ns";
import { EARLY_HACK_SCRIPT } from "lib/contants";
import { searchServers } from "lib/scan";


export async function main(ns: NS): Promise<void> {
  let allServers = await searchServers(ns);

  let openPorts = 0;
  for (let server of allServers) {
    let hostname = server.hostname;
    await ns.scp(EARLY_HACK_SCRIPT, hostname);
    //ns.killall(hostname);

    let openPorts = 0;
    let hackingFiles = [
      {
        fileName: "BruteSSH.exe",
        command: ns.brutessh
      }, {
        fileName: "FTPCrack.exe",
        command: ns.ftpcrack
      }, {
        fileName: "RelaySMTP.exe",
        command: ns.relaysmtp
      }, {
        fileName: "HTTPWorm.exe",
        command: ns.httpworm
      }, {
        fileName: "SQLInject.exe",
        command: ns.sqlinject
      }];
    hackingFiles.forEach(hackFile => {
      if (ns.fileExists(hackFile.fileName)) {
        ns.tprint(`Running ${hackFile.fileName} on ${hostname}`);
        hackFile.command(hostname);
        openPorts++;
      }
    });


    if (ns.getServerNumPortsRequired(hostname) <= openPorts) {
      ns.tprint(`Nuking: ${hostname}`);
      ns.nuke(hostname);
    } else {
      ns.tprint(`${hostname} requires ${ns.getServerNumPortsRequired(hostname)}. Current open Ports: ${openPorts}`);
    }

    if (ns.hasRootAccess(hostname)) {
      let ramAvailable = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
      let ramPerThread = ns.getScriptRam(EARLY_HACK_SCRIPT);
      let maxThreads = Math.floor(ramAvailable / ramPerThread);
      ns.exec(EARLY_HACK_SCRIPT, hostname, maxThreads > 0 ? maxThreads : 1, "harakiri-sushi");
    }
  }
}
