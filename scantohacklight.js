/** @param {NS} ns */

let scriptList = []

export async function main(ns) {
	let multiScript = "multiattack.js"
	let serverInformation = "serverinformation.txt";
	let hostableServers = "hostableservers.txt";
	//let stocktoserver = "stocktoserver.txt"
	//let maxMultiattackScriptRam = 0.75;
	let usedMaxRAMOnHome = 0.75;
	let homeServer = "home";
	//let maxScriptExecuteTimeMinutes = 60;
	let threads = 1;
	let minimumGrow = 0;
	
	let stockServerID;

	let playerInfo = ns.getPlayer();

	//ns.disableLog("ALL");
	ns.disableLog("sleep");
	ns.disableLog("getServerUsedRam");
	ns.disableLog("getServerMaxRam");
	ns.clearLog();

	scriptList = []
	
	while (true) {
		let targetServerList = JSON.parse(await ns.read(serverInformation));
        let hostServerList = JSON.parse(await ns.read(hostableServers));
		let scriptRam = ns.getScriptRam(multiScript);
		for (let i = 0; i < targetServerList.hackableservers.length; i++) {
			let attackMode = "";
			let targetServer = targetServerList.hackableservers[i];
			if(!ns.hasRootAccess(targetServer)) continue;
			let hostServer = "";
			if (await isScriptRunning(ns, targetServer, attackMode)) {
				continue;
			}
            for(let i = 0; i < hostServerList.length; i++) {
				if(hostServerList[i].name == homeServer) continue;
				let tempVarServer = hostServerList[i].name;
				let hostServerMaxRam = hostServerList[i].maxram;
				let hostServerUsedRam = ns.getServerUsedRam(tempVarServer);
				let hostServerUsableRam = hostServerMaxRam - hostServerUsedRam;
				if(hostServerUsableRam > scriptRam) {
					hostServer = tempVarServer;
					break;
				}
			}
			if(hostServer == "") break;
			await scpToExecScript(ns, multiScript, homeServer, hostServer, hostableServers, threads, targetServer, usedMaxRAMOnHome, attackMode, scriptRam);
		}
		await ns.sleep(1000);
	}
}

async function scpToExecScript(ns, multiScript, homeServer, hostServer, hostableServers, threads, targetServer, usedMaxRAMOnHome, attackMode, scriptRam) {
    if (!(await ns.scp(multiScript, homeServer, hostServer))) {
        ns.tprint("Copy did not work for server '" + hostServer + "'");
        //continue;
    }
    if (!(await ns.scp(hostableServers, homeServer, hostServer))) {
        ns.tprint("Copy did not work for server '" + hostServer + "'");
        //continue;
    }
    let processID = ns.exec(multiScript, hostServer, threads, targetServer, usedMaxRAMOnHome, attackMode);
    let scriptInfo = ns.getRunningScript(processID);
    if (scriptInfo != null) {
        let passProcessInfo = JSON.parse("{\"pid\":" + processID + ",\"scriptname\":\"" +
            multiScript + "\",\"ram\":" + scriptRam + ",\"hostserver\":\"" + hostServer +
            "\",\"targetserver\":\"" + targetServer +
            "\",\"args\":" + JSON.stringify({ targetServer, usedMaxRAMOnHome, attackMode }) + "}");
        scriptList.push(passProcessInfo);
		ns.print(passProcessInfo);
    }
}

async function isScriptRunning(ns, targetServer, attackMode) {
	for(let i = 0; i < scriptList.length; i++) {
		if(ns.isRunning(scriptList[i]) && scriptList[i].args[0] == targetServer && scriptList[i].args[2] == attackMode) {
			return true;
		}
		await ns.sleep(50);
	}
	return false;
}