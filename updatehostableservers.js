/** @param {NS} ns */
export async function main(ns) {
	let fileName = "hostableservers.txt";
	let serverList = JSON.parse("{\"hostableservers\":[\"home\"]}");
	for(var i = 0; i < serverList.hostableservers.length; i++) {
		let scanList = ns.scan(serverList.hostableservers[i]);
		ns.print("scanList: " + scanList);
		for(var a = 0; a < scanList.length; a++) {
			let selectedServer = scanList[a];
			if(serverList.hostableservers.indexOf(selectedServer) !== -1|| selectedServer == "darkweb") {
				ns.print(selectedServer + " is a known server, skipping task.");
				await ns.sleep(100);
			}
			else if(ns.hasRootAccess(selectedServer) && ns.getServerMaxRam(selectedServer) > 0){
				await serverList.hostableservers.push(selectedServer);
				await ns.sleep(300);
			}
			else {
				ns.print("Not usable server: " + selectedServer);
				await ns.sleep(100);
			}
		}
	}
	await ns.write(fileName, JSON.stringify(serverList), "w")
	await ns.sleep(1000)
	ns.print(serverList.hostableservers);
}