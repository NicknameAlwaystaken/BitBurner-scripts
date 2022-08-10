/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("sleep");
    ns.clearLog();
	let hostableServers = "hostableservers.txt";
	while(!ns.fileExists(hostableServers)) {
		await ns.sleep(5000)
	}
	let hostableServerList = JSON.parse(await ns.read(hostableServers));
	let playerInfo = ns.getPlayer();
	if(!playerInfo.hasWseAccount) return;
    ns.tail();
	
	while(true) {
		hostableServerList = JSON.parse(await ns.read(hostableServers));
		
		let currentRamUsage = 0;
		let currentProcesses = 0;
		
		let totalUsableRam = 0;

		for(let i = 0; i < hostableServerList.length; i++) {
			let server = hostableServerList[i];
			totalUsableRam += server.maxram;
			let processes = ns.ps(server.name);
			for(const process of processes) {
				currentRamUsage += parseInt(ns.getScriptRam(process.filename, server.name));
				currentProcesses++;
			}
			await ns.sleep(50);
		}

		let totalUsableRamPercentage = currentRamUsage / totalUsableRam;
		let bytesToGB = Math.pow(1000,3);
		ns.clearLog();
		ns.print("Current amount of processes " + currentProcesses + " using " + ns.nFormat(currentRamUsage * bytesToGB, "$0.00b") + " of RAM. "+ ns.nFormat(totalUsableRamPercentage, "0.00%") +
			" of " + ns.nFormat(totalUsableRam * bytesToGB, "$0.00b") + " of total.");
		
		await ns.sleep(500)
	}
}