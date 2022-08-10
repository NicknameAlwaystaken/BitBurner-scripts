/** @param {NS} ns */

const HackTypes = {
    Hack: "hack",
    Grow: "grow",
    Weaken: "weaken"
}


export async function main(ns) {
	if (ns.args.length < 1) {
		ns.tprint("Not enough arguments! args: targetServer, maxRamOnHome");
		ns.exit();
	}
    let reserveRamServer = "home";
    let homeServer = "home"
    let cores = 1;
    let threads = 1;
	let maxRamOnHome = 0.80;
    let attackMode = "none";
    const attackOrder = ['weakentime', 'growtime', 'weakentime', 'hacktime'];
    let attackOrderCounter = 0;
    let hackPadding = 50;
    let currentHack = HackTypes.Weaken;
    let extraAttackModeThreads = 1000;
    let isAffectingStock = false;
    
    let scriptName = "";
    let scriptRam = 0;

    let originalAttackAmountOnTarget;
    let attackAmountOnTargetLeft;

    let targetMoneyStealPercentage = 0.20;
    let serverMaxMoney;
    let moneyOnServer;
    let serverMinSecurity;
    let serverCurrentSecurity;
    let serverInfo;
    let playerInfo;

    let targetServer = ns.args[0];
    serverMaxMoney = ns.getServerMaxMoney(targetServer);
    moneyOnServer = ns.getServerMoneyAvailable(targetServer);
    serverMinSecurity = ns.getServerMinSecurityLevel(targetServer);
    serverCurrentSecurity = ns.getServerSecurityLevel(targetServer);

	if(ns.args.length > 1) {
    	maxRamOnHome = ns.args[1];
	}
	if(ns.args.length > 2) {
    	attackMode = ns.args[2];
	}

	const hostableServers = "hostableservers.txt";

	ns.disableLog("getServerUsedRam");
	ns.disableLog("getServerSecurityLevel");
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("getServerGrowth");
	ns.disableLog("getServerMaxMoney");
	ns.disableLog("scp");
	ns.disableLog("sleep");
    ns.clearLog();
    
    let hackInfo = [];
    while(true) {
        hackInfo.originalAttackAmountOnTarget = originalAttackAmountOnTarget;
        hackInfo.attackAmountOnTargetLeft = attackAmountOnTargetLeft;
        hackInfo.scriptName = scriptName;
        hackInfo.scriptRam = scriptRam;
        hackInfo.serverCurrentSecurity = serverCurrentSecurity;
        hackInfo.serverMinSecurity = serverMinSecurity;
        hackInfo.threads = threads;
        hackInfo.cores = cores;
        hackInfo.serverMaxMoney = serverMaxMoney;
        hackInfo.moneyOnServer = moneyOnServer;
        hackInfo.targetServer = targetServer;
        hackInfo.targetMoneyStealPercentage = targetMoneyStealPercentage;

        ({ attackOrderCounter, currentHack } = await batchOrdering(attackOrderCounter, ns, targetServer, attackOrder, currentHack, hackPadding));
        
        if(currentHack == HackTypes.Weaken) {
            hackInfo = weakenSetup(ns, hackInfo);
        }
        if(currentHack == HackTypes.Grow) {
            hackInfo = growSetup(ns, hackInfo);
        }
        if(currentHack == HackTypes.Hack) {
            hackInfo = hackSetup(ns, hackInfo);
        }

        for(;;) {
            await ns.scp(hostableServers, homeServer, ns.getServer().hostname)
            let serverList = JSON.parse(await ns.read(hostableServers));
            isAffectingStock = false;
            for(let i = 0; i < serverList.length; i++) {
                //#region safetyChecks
                if(!isAffectingStock && (scriptName == "singlehackattack.js" || scriptName == "singlegrowattack.js") && (attackMode == "hack" || attackMode == "grow")) {
                    isAffectingStock = true;
                    if(hackInfo.originalAttackAmountOnTarget < extraAttackModeThreads) hackInfo.originalAttackAmountOnTarget = extraAttackModeThreads;
                    if(hackInfo.attackAmountOnTargetLeft < extraAttackModeThreads) hackInfo.attackAmountOnTargetLeft = extraAttackModeThreads;
                }
                if(hackInfo.attackAmountOnTargetLeft <= 0) {
                    break;
                }
                let hostServer = serverList[i];
                let hostServerName = hostServer.name;
                let hostServerMaxRam = hostServer.maxram;
                if(ns.isRunning(hackInfo.scriptName, hostServerName, targetServer, isAffectingStock)) { 
                    continue;
                }
                if(hostServerName == reserveRamServer) hostServerMaxRam *= maxRamOnHome;
                let hostServerUsedRam = ns.getServerUsedRam(hostServerName);
                let hostServerRam = hostServerMaxRam - hostServerUsedRam;

                
                //#endregion safetyChecks
                if(hostServerRam >= hackInfo.scriptRam && hackInfo.attackAmountOnTargetLeft > 0) {
                    if(!(await ns.scp(hackInfo.scriptName, "home", hostServerName))) {
                        ns.tprint("Copy did not work for server '" + hostServerName + "'");
                    }
                    hackInfo.attackAmountOnTargetLeft = Math.max(hackInfo.attackAmountOnTargetLeft, 1)
                    let maxScriptCapacityOnServer = Math.max(parseInt(hostServerRam / hackInfo.scriptRam), 1);
                    let scriptsToRun = maxScriptCapacityOnServer;
                    if(scriptsToRun > hackInfo.attackAmountOnTargetLeft) { // Server doesn't have enough RAM to run all of the threads
                        scriptsToRun = hackInfo.attackAmountOnTargetLeft;
                    }
                    hackInfo.attackAmountOnTargetLeft -= scriptsToRun;
                    ns.print("Attacks left: " + hackInfo.attackAmountOnTargetLeft);
                    if(!ns.isRunning(hackInfo.scriptName, hostServerName, targetServer, isAffectingStock)) {
                        let execPid = ns.exec(hackInfo.scriptName, hostServerName, scriptsToRun, targetServer, isAffectingStock);
                    }
                }
                await ns.sleep(50);
            }
            if(hackInfo.attackAmountOnTargetLeft < 1) {
                break;
            }
            await ns.sleep(200);
        }
		await ns.sleep(500);
    }
}



async function batchOrdering(attackOrderCounter, ns, targetServer, attackOrder, currentHack, hackPadding) {
    if (attackOrderCounter >= 4)
        attackOrderCounter == 0;
    let serverInfo = ns.getServer(targetServer);
    let playerInfo = ns.getPlayer();

    let timeInfoRequirements = [];
    timeInfoRequirements.serverInfo = serverInfo;
    timeInfoRequirements.playerInfo = playerInfo;
    timeInfoRequirements.targetServer = targetServer;

    let nextHackTimes = [];
    nextHackTimes = await calculateTimeDelay(ns, timeInfoRequirements);

    let attackDelays = [];
    let longestAttack = 0;
    longestAttack = nextHackTimes[attackOrder[0]];
    for (let i = 0; i < attackOrder.length; i++) {
        attackDelays[i] = [attackOrder[i], (longestAttack - nextHackTimes[attackOrder[i]])];
    }
    attackDelays.sort(function (a, b) {
        var valueA, valueB;

        valueA = a[1]; // Where 1 is your index, from your example
        valueB = b[1];
        if (valueA < valueB) {
            return -1;
        }
        else if (valueA > valueB) {
            return 1;
        }
        return 0;
    });
    let sleepTimer = 0;
    if (attackOrderCounter == 0) {
        currentHack = HackTypes.Weaken;
        sleepTimer = 0;
    }
    else if (attackOrderCounter == 1) {
        currentHack = HackTypes.Weaken;
        sleepTimer = (attackDelays[attackOrderCounter][1] + hackPadding);
    }
    else if (attackOrderCounter == 2) {
        currentHack = HackTypes.Grow;
        sleepTimer = (attackDelays[attackOrderCounter][1] + hackPadding);
    }
    else if (attackOrderCounter == 3) {
        currentHack = HackTypes.Hack;
        sleepTimer = (attackDelays[attackOrderCounter][1] + hackPadding);
    }
    await ns.sleep(sleepTimer);
    attackOrderCounter++;
    return { attackOrderCounter, currentHack };
}

function growSetup(ns, hackInfo) {
    hackInfo.serverMaxMoney = ns.getServerMaxMoney(hackInfo.targetServer);
    hackInfo.moneyOnServer = ns.getServerMoneyAvailable(hackInfo.targetServer);

    if (hackInfo.moneyOnServer < 1) {
        hackInfo.originalAttackAmountOnTarget = 1000;
    }
    else {
        hackInfo.originalAttackAmountOnTarget = ns.growthAnalyze(hackInfo.targetServer, 1 / (hackInfo.moneyOnServer / hackInfo.serverMaxMoney), hackInfo.cores);
    }
    hackInfo.serverCurrentSecurity = ns.getServerSecurityLevel(hackInfo.targetServer) + ns.growthAnalyzeSecurity(hackInfo.originalAttackAmountOnTarget, hackInfo.targetServer, hackInfo.cores);
    hackInfo.attackAmountOnTargetLeft = hackInfo.originalAttackAmountOnTarget;
    hackInfo.scriptName = "singlegrowattack.js";
    hackInfo.scriptRam = ns.getScriptRam(hackInfo.scriptName);
    return hackInfo;
}

function weakenSetup(ns, hackInfo) {
    
    let serverSecurityToBeWeakened = hackInfo.serverCurrentSecurity - hackInfo.serverMinSecurity;

    hackInfo.originalAttackAmountOnTarget = serverSecurityToBeWeakened / ns.weakenAnalyze(hackInfo.threads, hackInfo.cores);
    hackInfo.attackAmountOnTargetLeft = hackInfo.originalAttackAmountOnTarget;

    hackInfo.scriptName = "singleweakenattack.js";
    hackInfo.scriptRam = ns.getScriptRam(hackInfo.scriptName);
    return hackInfo;
}

function hackSetup(ns, hackInfo) {
    
    hackInfo.serverMaxMoney = ns.getServerMaxMoney(hackInfo.targetServer);

    hackInfo.originalAttackAmountOnTarget = ns.hackAnalyzeThreads(hackInfo.targetServer, hackInfo.serverMaxMoney * hackInfo.targetMoneyStealPercentage);
    hackInfo.serverCurrentSecurity = ns.getServerSecurityLevel(hackInfo.targetServer) + ns.hackAnalyzeSecurity(hackInfo.originalAttackAmountOnTarget, hackInfo.targetServer);
    hackInfo.attackAmountOnTargetLeft = hackInfo.originalAttackAmountOnTarget;
    hackInfo.scriptName = "singlehackattack.js";
    hackInfo.scriptRam = ns.getScriptRam(hackInfo.scriptName);
    return hackInfo;
}

async function calculateTimeDelay(ns, timeInfoRequirements) {

    let weakenHackTime = getWeakenTime(ns, timeInfoRequirements);
    let growHackTime = getGrowTime(ns, timeInfoRequirements);
    let hackHackTime = getHackTime(ns, timeInfoRequirements);

    let newHackTimes = [];
    newHackTimes.weakentime = [];
    newHackTimes.growtime = [];
    newHackTimes.hacktime = [];
    newHackTimes['weakentime'].push(weakenHackTime)
    newHackTimes['growtime'].push(growHackTime)
    newHackTimes['hacktime'].push(hackHackTime)

    return newHackTimes;
}

function getHackTime(ns, timeInfoRequirements) {
    let timeTakes;
    if (ns.fileExists("Formulas.exe")) {
        timeTakes = ns.formulas.hacking.hackTime(timeInfoRequirements.serverInfo, timeInfoRequirements.playerInfo);
    }
    else {
        timeTakes = ns.getHackTime(timeInfoRequirements.targetServer);
    }
    return timeTakes;
}


function getGrowTime(ns, timeInfoRequirements) {
    let timeTakes;
    if (ns.fileExists("Formulas.exe")) {
        timeTakes = ns.formulas.hacking.growTime(timeInfoRequirements.serverInfo, timeInfoRequirements.playerInfo);
    }
    else {
        timeTakes = ns.getGrowTime(timeInfoRequirements.targetServer, timeInfoRequirements.serverInfo);
    }
    return timeTakes;
}


function getWeakenTime(ns, timeInfoRequirements) {
    let timeTakes;
    if (ns.fileExists("Formulas.exe")) {
        timeTakes = ns.formulas.hacking.weakenTime(timeInfoRequirements.serverInfo, timeInfoRequirements.playerInfo);
    }
    else {
        timeTakes = ns.getWeakenTime(timeInfoRequirements.targetServer);
    }
    return timeTakes;
}