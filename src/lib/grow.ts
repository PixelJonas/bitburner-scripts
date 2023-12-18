import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  const [target, time] = ns.args;
  if (time === undefined) {
    await ns.grow(target as string);
  } else {
    const option = { additionalMsec: Math.floor(Number(time)) }
    await ns.grow(target as string, option);
  }
}
