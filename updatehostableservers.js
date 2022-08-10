/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("sleep");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("hasRootAccess");
    ns.disableLog("scan");
	ns.clearLog();
	let fileName = "hostableservers.txt";
	let serverList = [];
	serverList.push({'name':'home','maxram':ns.getServerMaxRam('home')});
	for(var i = 0; i < serverList.length; i++) {
		let scanList = ns.scan(serverList[i].name);
		for(var a = 0; a < scanList.length; a++) {
			let selectedServerName = scanList[a];
			let serverMaxRam = ns.getServerMaxRam(selectedServerName);
			if(serverList.find(e => e.name === selectedServerName) || selectedServerName == "darkweb" || !ns.hasRootAccess(selectedServerName)) {
				await ns.sleep(50);
				continue;
			}
			else if(ns.hasRootAccess(selectedServerName) && serverMaxRam > 0){
				serverList.push({'name':selectedServerName,'maxram':serverMaxRam});
				//ns.print("New server: " + selectedServerName);
			}
			await ns.sleep(50);
		}
	}
	await ns.write(fileName, JSON.stringify(serverList), "w")
	ns.print(serverList);
}