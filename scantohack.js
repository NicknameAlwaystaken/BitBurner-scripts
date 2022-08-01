/** @param {NS} ns */
export async function main(ns) {
	let multiScript = "multiattack.js"
	let fileName = "serverinformation.txt";
	let usedMaxRAMOnHome = 0.80;
	let maxScriptExecuteTimeMinutes = 60;
	let threads = 1;
	let minimumGrow = 0;

	ns.print("Started new round of attacks!");
	while(true) {
		let serversToHack = JSON.parse(await ns.read(fileName));
		for(let i = 0; i < serversToHack.hackableservers.length; i++) {
			let selectedServer = serversToHack.hackableservers[i];
			if(!ns.hasRootAccess(selectedServer) || ns.getServerGrowth(selectedServer) < minimumGrow || 
				ns.getServerMoneyAvailable(selectedServer) < 1 || ns.getServerMaxMoney(selectedServer) < 1) {
				continue;
			}
			if (ns.isRunning(multiScript, selectedServer)){
				ns.tprint("Server " + selectedServer + " already has a task.");
			}
			else {
				ns.run(multiScript, threads, selectedServer, usedMaxRAMOnHome, maxScriptExecuteTimeMinutes);
				await ns.sleep(500);
			}
		}
		await ns.sleep(10000);
	}
}