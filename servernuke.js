/** @param {NS} ns */
export async function main(ns) {

	let serverList = ['home'];

	let purchasedList = ns.getPurchasedServers();

	let updateHostable = "updatehostableservers.js"
	let updateHackable = "updatehackableservers.js"
	let threads = 1;

	let serversLeftToNuke = true;

	ns.disableLog("sleep");
	ns.disableLog("scan");
	ns.disableLog("getServerNumPortsRequired");
	ns.disableLog("brutessh");
	ns.disableLog("ftpcrack");
	ns.disableLog("relaysmtp");
	ns.disableLog("httpworm");
	ns.disableLog("sqlinject");
	ns.disableLog("nuke");
	ns.clearLog();

	while(serversLeftToNuke) {
		serversLeftToNuke = false;
		for (let i = 0; i < serverList.length; i++) {
			let scanList = ns.scan(serverList[i]);
			for(let a = 0; a < scanList.length; a++) {
				let targetServer = scanList[a];
				if(serverList.indexOf(targetServer) !== -1 || purchasedList.indexOf(targetServer) !== -1
					|| targetServer == "home") {
					await ns.sleep(50);
					continue;
				}
				let portCrackedAmount = 0;
				if (ns.hasRootAccess(targetServer)) {
					ns.print("Already has rootaccess on " + targetServer);
					serverList.push(targetServer);
				}
				else if (!ns.hasRootAccess(targetServer)) {
					serversLeftToNuke = true;
					if (ns.fileExists("brutessh.exe")) {
						ns.brutessh(targetServer);
						portCrackedAmount++;
					}
					if (ns.fileExists("ftpcrack.exe")) {
						ns.ftpcrack(targetServer);
						portCrackedAmount++;
					}
					if (ns.fileExists("relaysmtp.exe")) {
						ns.relaysmtp(targetServer);
						portCrackedAmount++;
					}
					if (ns.fileExists("httpworm.exe")) {
						ns.httpworm(targetServer);
						portCrackedAmount++;
					}
					if (ns.fileExists("sqlinject.exe")) {
						ns.sqlinject(targetServer);
						portCrackedAmount++;
					}
					if (ns.getServerNumPortsRequired(targetServer) <= portCrackedAmount) {
						ns.nuke(targetServer);
						ns.print("Root access on " + targetServer);
						serverList.push(targetServer);
					}
					else {
						ns.print("Not enough ports opened on " + targetServer);
					}
				}
				await ns.sleep(100);
			}
			await ns.sleep(50);
		}
		ns.run(updateHostable, threads);
		ns.run(updateHackable, threads);
		await ns.sleep(10000);
	}
}