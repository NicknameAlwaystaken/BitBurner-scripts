/** @param {NS} ns */
export async function main(ns) {
	var fileName = "serverinformation.txt";
	let serverList = JSON.parse(await ns.read(fileName));
	var purchasedList = ns.getPurchasedServers();
	for(var i = 0; i < serverList.hackableservers.length; i++) {
		let scanList = ns.scan(serverList.hackableservers[i]);
		ns.print("scanList: " + scanList);
		for(var a = 0; a < scanList.length; a++) {
			let selectedServer = scanList[a];
			if(serverList.hackableservers.indexOf(selectedServer) !== -1 || purchasedList.indexOf(selectedServer) !== -1
				|| selectedServer == "darkweb" || selectedServer == "home") {
				ns.print(selectedServer + " is a known server, skipping task.");
				await ns.sleep(100);
			}
			else if(ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(selectedServer)){
				serverList.hackableservers.push(selectedServer);
			}
			await ns.sleep(200);
		}
	}
	await ns.write(fileName, JSON.stringify(serverList), "w")
	await ns.sleep(1000)
	ns.print(serverList.hackableservers);
}