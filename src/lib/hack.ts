import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  const [target, time] = ns.args;
  if (time === undefined) {
    await ns.hack(target as string);
  } else {
    const option = { additionalMsec: Math.floor(Number(time)) }
    await ns.hack(target as string, option);
  }
}
