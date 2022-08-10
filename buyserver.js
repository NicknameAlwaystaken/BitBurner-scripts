/** @param {NS} ns */
export async function main(ns) {
	for(;;) {
		let serverList = ns.getPurchasedServers();
		let currentamount = serverList.length;
		let serverAmountLimit = ns.getPurchasedServerLimit();
		let maxRamSizeInSteps = 20;
		let maxRamSize = Math.pow(2, maxRamSizeInSteps);
		let minimumRAMToBuy = 1;
		let maxPlayerMoneyUsed = 0.05;
		let playerInfo = ns.getPlayer();
		let updateServerListScript = "updatehostableservers.js";
		if(ns.getPurchasedServerCost(Math.pow(2,minimumRAMToBuy)) > playerInfo.money) {
			ns.print("Not enough money! At least: " + ns.nFormat(ns.getPurchasedServerCost(Math.pow(2, minimumRAMToBuy)), "$0.00a") + " needed")
		}
		else {
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
				for(let i = 0; i < maxRamSizeInSteps - minimumRAMToBuy; i++) {
					let ramSize = Math.pow(2, maxRamSizeInSteps-i);
					if(ns.getPurchasedServerCost(ramSize) < playerInfo.money * maxPlayerMoneyUsed && ramSize > lowestRam) {
						let serverName = serverList[serverIndex];
						ns.killall(serverList[serverIndex]);
						if(ns.deleteServer(serverList[serverIndex])) {
							if(maxRamSize == ramSize) {
								ns.tprint("New server: " + ns.purchaseServer(serverName, ramSize) + " with " +
									ns.nFormat(ramSize*1e9, "$0.00b") + " memory");
								ns.run(updateServerListScript, 1);
							}
							else {
								ns.print("New server: " + ns.purchaseServer(serverName, ramSize) + " with " +
									ns.nFormat(ramSize*1e9, "$0.00b") + " memory");
								ns.run(updateServerListScript, 1);
							}
							await ns.sleep(100)
							break;
						}
						await ns.sleep(100);
					}
				}
				ns.print("Not enough money! At least: " + ns.nFormat(ns.getPurchasedServerCost(lowestRam * 2), "$0.00a") + " needed")
			}
			else {
				for(let i = 0; i < maxRamSizeInSteps - minimumRAMToBuy; i++) {
					if(ns.getPurchasedServerCost(Math.pow(2, maxRamSizeInSteps-i)) < playerInfo.money * maxPlayerMoneyUsed) {
						ns.print("New server: " + ns.purchaseServer("Elite-" + currentamount, Math.pow(2, maxRamSizeInSteps-i)) + " with " +
							ns.nFormat(Math.pow(2, maxRamSizeInSteps-i), "$0.00b") + " memory");
						ns.run(updateServerListScript, 1);
						break;
					}
					await ns.sleep(100);
				}
				ns.print("Not enough money! At least: " + ns.nFormat(ns.getPurchasedServerCost(Math.pow(2, minimumRAMToBuy)), "$0.00a") + " needed")
			}
		}
		await ns.sleep(30000);
	}
}