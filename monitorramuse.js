/** @param {NS} ns */
export async function main(ns) {
	let fileName = "realtimeramlog.txt"
	let thisScript = ns.getRunningScript();
	let scriptList = {};
	scriptList[thisScript.pid] = {'scriptname':thisScript.filename,'ram':thisScript.ramUsage};

	/* Usage in other scripts
	let port = ns.getPortHandle(1);
    if(ns.isRunning("monitorramuse.js", "home")) {
		let passProcessInfo = JSON.stringify(JSON.parse("{\""+execPid+"\":{\"pid\":"+execPid+",\"scriptname\":\""+
			scriptName+"\",\"ram\":"+maxScriptCapacityOnServer*scriptRam+",\"targetserver\":\""+
			targetServer+"\"}}"));
		while(true) {
			if(port.tryWrite(passProcessInfo)) {
				break;
			}
			await ns.sleep(50);
		}
	}
	*/

	await ns.sleep(100);
	await ns.write(fileName, JSON.stringify(scriptList), "w")
	
	while(true) {
		let readPortData = "NULL PORT DATA";
		readPortData = ns.readPort(1);
		while(readPortData != "NULL PORT DATA") {
			let newProcess;
			if(readPortData != "NULL PORT DATA") {
				newProcess = JSON.parse(readPortData);
				scriptList[newProcess[Object.keys(newProcess)[0]].pid] = {'scriptname':newProcess[Object.keys(newProcess)[0]].scriptname,
					'ram':newProcess[Object.keys(newProcess)[0]].ram};
				await ns.write(fileName, JSON.stringify(scriptList), "w")
			}
			readPortData = ns.readPort(1);
			await ns.sleep(10);
		}
		scriptList = JSON.parse(await ns.read(fileName));
		let currentRamUsage = 0;
		let processAmount = Object.keys(scriptList).length;
		let wasAnyProcessDead = false;
		for(var i = 0; i < processAmount; i++) {
			if(ns.isRunning(parseInt(Object.keys(scriptList)[i]))) {
				currentRamUsage += scriptList[Object.keys(scriptList)[i]].ram;
				continue;
			}
			wasAnyProcessDead = true;
		}
		//let ifProcessesDead = wasAnyProcessDead ? " Preparing to clear process list of dead processes." : "";
		processAmount = Object.keys(scriptList).length;
		let listOfDeadProcesses = [];
		for(var i = 0; i < processAmount; i++) {
			if(!ns.isRunning(parseInt(Object.keys(scriptList)[i]))) {
				listOfDeadProcesses.push(Object.keys(scriptList)[i]);
				continue;
			}
		}
		for(var i = 0; i < listOfDeadProcesses.length; i++) {
			delete scriptList[listOfDeadProcesses[i]];
		}
		ns.clearLog();
		ns.print("Currently using: " + ns.nFormat(currentRamUsage*Math.pow(1000,3), "$0.00b") + " of RAM.");
		await ns.write(fileName, JSON.stringify(scriptList), "w")
		await ns.sleep(10)
	}
}