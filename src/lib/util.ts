import { NS } from "@ns";
import { NUMBERS } from "lib/contants";

/**
 * A function for assertion.
 *
 * @param {expression} cond Assert that this condition is true.
 * @returns {Error} Throw an assertion error if the given condition is false.
 */
export function assert(cond: any): Error | void {
  if (!cond) {
    throw new Error("Assertion failed");
  }
}

/**
* Format a number according to whether it is in the thousands, millions,
* billions, etc.
*
* @param {number} num Format this number.
* @param {boolean} to_fixed Whether to fix at the default number of decimal
*     digits.  Only useful for numbers whose absolute values are less than
*     1,000.  Default is false.
* @returns {string} The same number, but formatted.
*/
export function formatNumber(num: number, to_fixed: boolean = false): string {

  // Sanity checks.
  const n = Math.abs(Number(num));
  const sign = Math.sign(num);
  const ndigit = 3;

  const add_sign = (x: number) => (sign < 0 ? -1 * x : x);

  if (n < 1e3) {
    const signed_num = add_sign(n);
    return to_fixed ? `${signed_num.toFixed(ndigit)}` : `${signed_num}`;
  }

  const fmt = (divisor, suffix) => {
    const signed_num = add_sign(n / divisor);
    const fstr = signed_num.toFixed(ndigit);
    return `${fstr}${suffix}`;
  };

  // divisor := threshold[0][dindex]
  // suffix := threshold[0][sindex]
  const threshold = [
    [NUMBERS.QUINTILLION, "e18"],
    [NUMBERS.QUADRILLION, "e15"],
    [NUMBERS.TRILLION, "e12"],
    [NUMBERS.BILLION, "e9"],
    [NUMBERS.MILLION, "e6"],
    [NUMBERS.THOUSAND, "e3"],
  ];
  const dindex = 0;
  const meet_threshold = (tau: number[]) => n >= tau[dindex];
  const [divisor, suffix] = threshold.find(meet_threshold);
  return fmt(divisor, suffix);
}


export function hasFormulas(ns: NS): boolean {
  try { ns.formulas.hacknetNodes.constants(); return true; } catch { return false; }
}

export function createSequence(num: number): Array<number> {
  const n = Math.floor(num);
  return n > 0 ? [...Array(n).keys()] : [];
}