import { NS } from "@ns";
import { HOME_SERVER } from "lib/contants";

export class CLI {
  #ns: NS;
  #doc: Document;
  #terminalInput: HTMLInputElement;

  constructor(ns: NS) {
    this.#ns = ns;
    this.#doc = eval("document");
    this.#terminalInput = this.#doc.getElementById('terminal-input') as HTMLInputElement;
  }

  async connectTo(target: string) {
    this.#terminalInput.value = "connect ";

    if (target === HOME_SERVER) {
      this.#terminalInput.value += HOME_SERVER;
    } else {
      this.#terminalInput.value += target;
      const handler = Object.keys(this.#terminalInput)[1];
      this.#ns.tprint(this.#terminalInput[handler]);
      this.#terminalInput[handler].onChange({ target: this.#terminalInput });
      this.#terminalInput[handler].onKeyDown({ keyCode: 13, preventDefault: () => null, key: "Enter" });
    };

    await this.#ns.sleep(50);
  }
}