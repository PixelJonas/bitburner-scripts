/** @param {import(".").NS } ns */
 
let doc = null;
let terminalInput = null;
 
export async function main(ns) {
 
    doc = eval("document");
    terminalInput = doc.getElementById('terminal-input');
 
    const allTargets = getAllTargets(ns);
 
 
    for (const targetName of allTargets) {
        await home(ns);
        await backdoorTarget(ns, targetName);
    }
 
    await home(ns);
    ns.tprintf('DONE');
}
 
async function backdoorTarget(ns, targetName) {
    const path = find(ns, targetName);
 
    if (path) {
        const jumps = path.split('#');
        jumps.push(targetName);
 
        for (const jump of jumps) {
            ns.tprintf(jump);
            await connectTo(ns, jump);
        }
 
        await backdoor(ns)
    }
}
 
async function connectTo(ns, targetName) {
    if (targetName === 'home')
        return
    
    terminalInput.value = 'connect ' + targetName;
    const handler = Object.keys(terminalInput)[1];
    terminalInput[handler].onChange({ target: terminalInput });
    terminalInput[handler].onKeyDown({ keyCode: 13, preventDefault: () => null, key: "Enter" });
    await ns.sleep(50);
}
 
async function backdoor(ns) {
    terminalInput.value = 'backdoor';
    const handler = Object.keys(terminalInput)[1];
    terminalInput[handler].onChange({ target: terminalInput });
    terminalInput[handler].onKeyDown({ keyCode: 13, preventDefault: () => null, key: "Enter" });
 
    await ns.sleep(100);
 
    while (terminalInput.disabled) {
        await ns.sleep(100);
    }
}
 
async function home(ns) {
    terminalInput.value = 'home';
    const handler = Object.keys(terminalInput)[1];
    terminalInput[handler].onChange({ target: terminalInput });
    terminalInput[handler].onKeyDown({ keyCode: 13, preventDefault: () => null, key: "Enter" });
 
    await ns.sleep(100);
}
 
 
 
function find(ns, hostName) {
    let result = null;
 
    function crawl(targetName, allTargets, currentPath) {
        if (allTargets.indexOf(targetName) !== -1)
            return;
 
        allTargets.push(targetName);
 
        const networks = ns.scan(targetName);
 
        networks.forEach((net) => {
            if (net === hostName) {
                result = currentPath;
                return;
            }
 
            crawl(net, allTargets, currentPath + "#" + net);
        })
    }
 
    const allTargets = [];
    crawl('home', allTargets, 'home');
    return result;
 
}
 
function getAllTargets(ns) {
    function crawl(targetName, allTargets, currentPath) {
        if (allTargets.indexOf(targetName) !== -1)
            return;
 
        allTargets.push(targetName);
 
        const networks = ns.scan(targetName);
 
        networks.forEach((net) => {
            crawl(net, allTargets, currentPath + "->" + net);
        })
    }
 
    const allTargets = [];
    crawl('home', allTargets, 'home');
 
    return allTargets;
}