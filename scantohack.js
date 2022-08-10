/** @param {NS} ns */
import { updateStocksInfo } from "wseautomator.js"

const AttackModes = {
	None: "none",
	Hack: "hack",
	Grow: "grow",
	Any: "any"
}

let scriptList = []

export async function main(ns) {
	const multiScript = "multiattack.js",
		serverInformation = "serverinformation.txt",
		hostableServers = "hostableservers.txt",
		stocktoserver = "stocktoserver.txt",
		usedMaxRAMOnHomeDecimal = 64,
		homeServer = "home",
		threads = 1;
	
	while(!ns.fileExists(hostableServers) || !ns.fileExists(serverInformation) || !ns.fileExists(stocktoserver)) {
		await ns.sleep(5000)
	}
	
	let stockServerID;

	let playerInfo = ns.getPlayer();

	//ns.disableLog("ALL");
	ns.disableLog("sleep");
	ns.disableLog("getServerUsedRam");
	ns.disableLog("getServerMaxRam");
	ns.disableLog("getServerMaxMoney");
	ns.disableLog("getHackingLevel");
	ns.disableLog("getServerRequiredHackingLevel");
	ns.disableLog("scp");
	ns.disableLog("exec");
	ns.disableLog("kill");
	ns.clearLog();
	
	
	scriptList = [];

	while(true) {
		if(playerInfo.hasWseAccount && playerInfo.hasTixApiAccess) stockServerID = JSON.parse(await ns.read(stocktoserver));
		let serversToHack = JSON.parse(await ns.read(serverInformation));
        let hostServerList = JSON.parse(await ns.read(hostableServers));
		await updateScriptList(ns, multiScript, serversToHack.hackableservers);
		const scriptRam = ns.getScriptRam(multiScript);
		for (let i = 0; i < serversToHack.hackableservers.length; i++) {
			//ns.print("Started checking hackable servers.")
			let attackMode = AttackModes.None;
			let targetServer = serversToHack.hackableservers[i];
			if(!ns.hasRootAccess(targetServer) || ns.getServerMaxMoney(targetServer) < 1 || 
					ns.getHackingLevel() < ns.getServerRequiredHackingLevel(targetServer)) {
				continue;
			}
			let hostServer = "";
			//ns.print("Started checking hostable servers.")
            for(let i = 0; i < hostServerList.length; i++) {
				if(hostServerList[i].name == homeServer) {
					await ns.sleep(50);
					continue;
				}
				let tempVarServer = hostServerList[i].name;
				let hostServerMaxRam = hostServerList[i].maxram;
				let hostServerUsedRam = ns.getServerUsedRam(tempVarServer);
				let hostServerUsableRam = hostServerMaxRam - hostServerUsedRam;
				if(hostServerUsableRam > scriptRam) {
					hostServer = tempVarServer;
					await ns.sleep(50);
					break;
				}
				await ns.sleep(50);
			}
			if(hostServer == "") break;
			//ns.print("Started checking attackmodes from stocklist.")
			if(playerInfo.hasWseAccount && playerInfo.hasTixApiAccess) attackMode = await checkServerForStock(stockServerID, targetServer, ns, AttackModes);
			//ns.print("Done checking stocklist.")
			await ns.sleep(50)
			let reserveOnHome;
			let homeServerMaxRam = ns.getServerMaxRam(homeServer);
			reserveOnHome = amountLeftAfterDecimalReserve(homeServerMaxRam, usedMaxRAMOnHomeDecimal);
			let serverArgs = [targetServer, reserveOnHome, attackMode];
			/*
			ns.print("serverArgs.length: " + serverArgs.length)
			ns.print("serverArgs[0]: " + serverArgs[0])
			await ns.sleep(5000);
			*/
			//ns.print("Started checking if any scripts running.")
			await ns.sleep(50)
			if (attackMode != AttackModes.None) {
				//ns.print("Attackmode != none");
				if(attackMode == AttackModes.Hack) {
					//ns.print("Attackmode != Hack");
					serverArgs = [targetServer, reserveOnHome, AttackModes.Grow];
					if(await isScriptRunning(ns, serverArgs, true)) {
						//ns.print("Was running, now killed");
						serverArgs = [targetServer, reserveOnHome, AttackModes.Hack];
						await scpToExecScript(ns, multiScript, homeServer, hostServer, hostableServers, threads, serverArgs, scriptRam);
						//ns.print("Script is running");
						continue;
					}
				}
				else if(attackMode == AttackModes.Grow) {
					//ns.print("Attackmode != Grow");
					serverArgs = [targetServer, reserveOnHome, AttackModes.Hack];
					if(await isScriptRunning(ns, serverArgs, true)) {
						//ns.print("Was running, now killed");
						serverArgs = [targetServer, reserveOnHome, AttackModes.Grow];
						await scpToExecScript(ns, multiScript, homeServer, hostServer, hostableServers, threads, serverArgs, scriptRam);
						//ns.print("Script is running");
						continue;
					}
				}
			}
			if (await isScriptRunning(ns, serverArgs, false)) {
				await ns.sleep(50);
				continue;
			}
			//ns.print("No earlier script running, attempting now");
			await scpToExecScript(ns, multiScript, homeServer, hostServer, hostableServers, threads, serverArgs, scriptRam);
			//ns.print("Script is running");
		}
		await ns.sleep(50);
	}
}

function amountLeftAfterDecimalReserve(homeServerMaxRam, usedMaxRAMOnHomeDecimal) {
	return (homeServerMaxRam - usedMaxRAMOnHomeDecimal) / homeServerMaxRam;
}

async function checkServerForStock(stockServerID, targetServer, ns, AttackModes) {
	let checkMode = AttackModes.None;
	for (let a = 0; a < Object.keys(stockServerID).length; a++) {
		//ns.print("Listing through stockServerID")
		if (stockServerID[a].server.length == 2) {
			//ns.print("stock has 2 servers")
			if (stockServerID[a].server[0] == targetServer || stockServerID[a].server[1] == targetServer) {
				//ns.print("stock has 1 server")
				let stocksInfo = await updateStocksInfo(ns);
				//ns.print("Stock info read")
				let count = Object.keys(stocksInfo).length;
				for (let j = 0; j < count; j++) {
					//ns.print("Getting current stock for 2 servers")
					let currentStock = stocksInfo[Object.keys(stocksInfo)[j]];
					let currentSharesAmount = currentStock.position[0];
					if (currentStock.name == stockServerID[a].stockname) {
						if (currentSharesAmount > 0) {
							checkMode = AttackModes.Grow;
							return checkMode;
						}
					}
					await ns.sleep(50);
				}
				checkMode = AttackModes.Hack;
				return checkMode;
			}
		}
		else if (stockServerID[a].server == targetServer) {
			//ns.print("stock has 1 server")
			let stocksInfo = await updateStocksInfo(ns);
			//ns.print("Stock info read")
			let count = Object.keys(stocksInfo).length;
			for (let j = 0; j < count; j++) {
				//ns.print("Getting current stock for 1 server")
				let currentStock = stocksInfo[Object.keys(stocksInfo)[j]];
				let currentSharesAmount = currentStock.position[0];
				if (currentStock.name == stockServerID[a].stockname) {
					if (currentSharesAmount > 0) {
						checkMode = AttackModes.Grow;
						return checkMode;
					}
				}
				await ns.sleep(50);
			}
			checkMode = AttackModes.Hack;
			return checkMode;
		}
		await ns.sleep(50);
	}
	await ns.sleep(50);
	return checkMode;
}
async function scpToExecScript(ns, multiScript, homeServer, hostServer, hostableServers, threads, serverArgs) {
    if (!(await ns.scp(multiScript, homeServer, hostServer))) {
        ns.tprint("Copy did not work for server '" + hostServer + "'");
        //continue;
    }
    if (!(await ns.scp(hostableServers, homeServer, hostServer))) {
        ns.tprint("Copy did not work for server '" + hostServer + "'");
        //continue;
    }
    let processID = ns.exec(multiScript, hostServer, threads, ...serverArgs);
    //let scriptInfo = ns.getRunningScript(processID);
    if (processID != 0) {
		ns.print("Run: " + hostServer + " | Target: " + serverArgs[0] + " | Attack mode: " + serverArgs[2] + " +");
	}
}



async function updateScriptList(ns, multiScript, hackableServers) {
	let hostableServersFile = "hostableservers.txt"
	let hostableServers = JSON.parse(await ns.read(hostableServersFile));

	scriptList = [];

	for(let i = 0; i < hostableServers.length; i++) {
		let hostName = hostableServers[i].name;
		let processes = [];
		processes = ns.ps(hostName);
		for(let j = 0; j < processes.length; j++) {
			let process = processes[j];
			if(process.filename == multiScript) {
				process['hostname'] = hostName;
				scriptList.push(process);
			}
			await ns.sleep(50);
		}
		await ns.sleep(50);
	}
	ns.print("Hackable servers: " + hackableServers.length + " Current amount of servers being hacked: " + scriptList.length)
}

async function isScriptRunning(ns, serverArgs, killIfRunning = false) {
	let scriptIsRunning = false;
	for(let i = 0; i < scriptList.length; i++) {
		let script = scriptList[i];
		if(ns.isRunning(script.pid) && script.args[0] == serverArgs[0] && script.args[2] == serverArgs[2]) {
			if(killIfRunning && ns.kill(script.filename, script.hostname, ...script.args)) {
				ns.print("Kill: " + script.hostname + " | Target: " + script.args[0] + " | Attack mode: " + script.args[2] + " -");
			}
			scriptIsRunning = true;
		}
		await ns.sleep(50);
	}
	return scriptIsRunning;
}

/*
{
	"WDS": "",
	"ECP": "ecorp",
	"MGCP": "megacorp",
	"BLD": "blade",
	"CLRK": "clarkinc",
	"OMTK": "omnitek",
	"FSIG": "4sigma",
	"KGI": "kuai-gong",
	"DCOMM": "defcomm",
	"VITA": "vitalife",
	"ICRS": "icarus",
	"UNV": "univ-energy",
	"AERO": "aerocorp",
	"SLRS": "solaris",
	"GPH": "global-pharm",
	"NVMD": "nova-med",
	"LXO": "lexo-corp",
	"RHOC": "rho-construction",
	"APHE": "alpha-ent",
	"SYSC": "syscore",
	"CTK": "comptek",
	"NTLK": "netlink",
	"OMGA": "omega-net",
	"JGN": "joesguns",
	"SGC": "sigma-cosmetics",
	"CTYS": "catalyst",
	"MDYN": "microdyne",
	"TITN": "titan-labs",
	"FLCM": "fulcrumtech",
	"STM": "stormtech",
	"HLS": "helios",
	"OMN": "omnia",
	"FNS": "foodnstuff"
}
*/