/** @param {NS} ns */
export async function main(ns) {
	var fileName = "serverinformation.txt";
	let serversToHack = JSON.parse(await ns.read(fileName));

	for (var i = 0; i < serversToHack.hackableservers.length; i++) {
		let targetServer = serversToHack.hackableservers[i];
		var portCrackedAmount = 0;
		if (ns.hasRootAccess(targetServer)) {
			ns.print("Already has rootaccess on " + targetServer);
		}
		else if (!ns.hasRootAccess(targetServer)) {
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
			}
			else {
				ns.print("Not enough ports opened on " + targetServer);
			}
		}
		else {
			ns.print("Unable to gain rootaccess on " + targetServer);
		}
		await ns.sleep(100);
	}
}