import { Server, NS } from "@ns";
import { PURCHASED_SERVER_PREFIX } from "lib/contants";

export async function getAllServers(ns: NS, includeHome = false): Promise<Server[]> {
    let unprocessedQueue = ["home"];
    let processedQueue = [];
    while (unprocessedQueue.length > 0) {
        processedQueue.push(unprocessedQueue[0]);

        const newItems = ns.scan(unprocessedQueue[0]);
        const itemsToAdd = [];

        for (const newItem of newItems) {
            if (!processedQueue.includes(newItem)) {
                itemsToAdd.push(newItem);
            }
        }

        unprocessedQueue.shift();
        unprocessedQueue = [...unprocessedQueue, ...itemsToAdd];
    }
    if (!includeHome) {
        processedQueue = processedQueue.filter((server) => server !== "home");
    }
    return processedQueue.map(s => ns.getServer(s));
}
