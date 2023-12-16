import { Server, NS } from "@ns";
import { PURCHASED_SERVER_PREFIX } from "lib/contants";

export async function getAllServers(ns: NS): Promise<Server[]> {
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

    processedQueue = processedQueue.filter((server) => server !== "home");
    return processedQueue.map(s => ns.getServer(s));
}

export async function getHackableServers(ns: NS): Promise<Server[]> {
    return (await getAllServers(ns)).filter((server) => server.hostname.indexOf(PURCHASED_SERVER_PREFIX) === -1);
}
