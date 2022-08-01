/** @param {NS} ns */
export async function main(ns) {
	let serverList = ns.getPurchasedServers();
	let currentamount = serverList.length;
	let serverAmountLimit = ns.getPurchasedServerLimit();
	let maxRamSizeInSteps = 20;
	let minimumRAMToBuy = 15;
	let updateServerListScript = "updateavailableservers.js";

	if(currentamount >= serverAmountLimit) {
		let serverIndex = 0;
		let lowestRam = Math.pow(2, maxRamSizeInSteps);
		for(let i = 0; i < currentamount; i++) {
			let serverRam = ns.getServerMaxRam(serverList[i])
			if(lowestRam > serverRam) {
				lowestRam = serverRam;
				serverIndex = i;
			}
			await ns.sleep(100);
		}
		if(lowestRam == Math.pow(2, maxRamSizeInSteps)) {
			ns.print("You should have all servers with maximum RAM installed! Congratz!")
			ns.exit();
		}
		ns.print("Lowest RAM from " + serverList[serverIndex] + ": " + ns.nFormat(lowestRam, "$0.00b") + " index: " + serverIndex);
		let playerInfo = ns.getPlayer();
		for(let i = 0; i < maxRamSizeInSteps - minimumRAMToBuy; i++) {
			let ramSize = Math.pow(2, maxRamSizeInSteps-i);
			if(ns.getPurchasedServerCost(ramSize) < playerInfo.money && ramSize > lowestRam) {
				let serverName = serverList[serverIndex];
				ns.killall(serverList[serverIndex]);
				ns.deleteServer(serverList[serverIndex]);
				ns.print("New server: " + ns.purchaseServer(serverName, ramSize) + " with " +
					ns.nFormat(ramSize, "$0.00b") + " memory");
				ns.run(updateServerListScript, 1);
				return;
			}
			await ns.sleep(100);
		}
		ns.print("Not enough money! At least: " + ns.nFormat(ns.getPurchasedServerCost(lowestRam * 2), "$0.00a") + " needed")
		return;
	}
	let playerInfo = ns.getPlayer();
	for(let i = 0; i < maxRamSizeInSteps - minimumRAMToBuy; i++) {
		if(ns.getPurchasedServerCost(Math.pow(2, maxRamSizeInSteps-i)) < playerInfo.money) {
			ns.print("New server: " + ns.purchaseServer("Elite-" + currentamount, Math.pow(2, maxRamSizeInSteps-i)) + " with " +
				ns.nFormat(Math.pow(2, maxRamSizeInSteps-i), "$0.00b") + " memory");
			ns.run(updateServerListScript, 1);
			return;
		}
		await ns.sleep(100);
	}
	ns.print("Not enough money! At least: " + ns.nFormat(ns.getPurchasedServerCost(Math.pow(2, minimumRAMToBuy)), "$0.00a") + " needed")
	ns.exit();
}