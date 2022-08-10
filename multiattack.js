/** @param {NS} ns */


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
    let extraAttackModeThreads = 1000;
    let isAffectingStock = false;
    
    let scriptName;
    let scriptRam;

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

	let hostableServers = "hostableservers.txt";

    var counter = 0;
	ns.disableLog("sleep");
	ns.disableLog("getServerUsedRam");
	ns.disableLog("getServerSecurityLevel");
	ns.disableLog("getServerMoneyAvailable");
	ns.disableLog("getServerGrowth");
	ns.disableLog("getServerMaxMoney");
	ns.disableLog("scp");
    ns.clearLog();
    
    while(true) {
        if(attackMode == "hack"){
            if(counter == 0 || counter == 2) {
                ({ originalAttackAmountOnTarget, attackAmountOnTargetLeft, scriptName, 
                    scriptRam } = weakenSetup(ns, serverCurrentSecurity, serverMinSecurity, 
                        originalAttackAmountOnTarget, threads, cores, attackAmountOnTargetLeft, scriptName, scriptRam));
            }
            if(counter == 1 || counter == 3) {
                ({ serverMaxMoney, originalAttackAmountOnTarget, serverCurrentSecurity, attackAmountOnTargetLeft,
                    scriptName, scriptRam } = hackSetup(ns, serverMaxMoney, targetServer, originalAttackAmountOnTarget,
                        targetMoneyStealPercentage, serverCurrentSecurity, attackAmountOnTargetLeft, scriptName, scriptRam));
            }
        }
        else if(attackMode == "grow"){
            if(counter == 0 || counter == 2) {
                ({ originalAttackAmountOnTarget, attackAmountOnTargetLeft, scriptName, 
                    scriptRam } = weakenSetup(ns, serverCurrentSecurity, serverMinSecurity, 
                        originalAttackAmountOnTarget, threads, cores, attackAmountOnTargetLeft, scriptName, scriptRam));
            }
            if(counter == 1 || counter == 3) {
                if(ns.getServerGrowth(targetServer) > 1) {
                    ({ serverMaxMoney, moneyOnServer, originalAttackAmountOnTarget, serverCurrentSecurity, 
                        attackAmountOnTargetLeft, scriptName, scriptRam } = growSetup(ns, serverMaxMoney, 
                            targetServer, moneyOnServer, originalAttackAmountOnTarget, cores, serverCurrentSecurity, attackAmountOnTargetLeft, 
                            scriptName, scriptRam));
                }
            }
        }
        else {
            if(counter == 0) {
                ({ originalAttackAmountOnTarget, attackAmountOnTargetLeft, scriptName, 
                    scriptRam } = weakenSetup(ns, serverCurrentSecurity, serverMinSecurity, 
                        originalAttackAmountOnTarget, threads, cores, attackAmountOnTargetLeft, scriptName, scriptRam));
            }
            if(counter == 1) {
                if(ns.getServerGrowth(targetServer) > 1) {
                    ({ serverMaxMoney, moneyOnServer, originalAttackAmountOnTarget, serverCurrentSecurity, 
                        attackAmountOnTargetLeft, scriptName, scriptRam } = growSetup(ns, serverMaxMoney, 
                            targetServer, moneyOnServer, originalAttackAmountOnTarget, cores, serverCurrentSecurity, attackAmountOnTargetLeft, 
                            scriptName, scriptRam));
                }
                else {
                    counter++;
                }
            }
            if(counter == 2) {
                ({ originalAttackAmountOnTarget, attackAmountOnTargetLeft, scriptName, 
                    scriptRam } = weakenSetup(ns, serverCurrentSecurity, serverMinSecurity, 
                        originalAttackAmountOnTarget, threads, cores, attackAmountOnTargetLeft, scriptName, scriptRam));
            }
            if(counter == 3) {
                ({ serverMaxMoney, originalAttackAmountOnTarget, serverCurrentSecurity, attackAmountOnTargetLeft,
                    scriptName, scriptRam } = hackSetup(ns, serverMaxMoney, targetServer, originalAttackAmountOnTarget,
                        targetMoneyStealPercentage, serverCurrentSecurity, attackAmountOnTargetLeft, scriptName, scriptRam));
            }
        }
        while(true) {
            await ns.scp(hostableServers, homeServer, ns.getServer().hostname)
            let serverList = JSON.parse(await ns.read(hostableServers));
            isAffectingStock = false;
            for(let i = 0; i < serverList.length; i++) {
                //#region safetyChecks
                if(!isAffectingStock && (scriptName == "singlehackattack.js" || scriptName == "singlegrowattack.js") && (attackMode == "hack" || attackMode == "grow")) {
                    isAffectingStock = true;
                    if(originalAttackAmountOnTarget < extraAttackModeThreads) originalAttackAmountOnTarget = extraAttackModeThreads;
                    if(attackAmountOnTargetLeft < extraAttackModeThreads) attackAmountOnTargetLeft = extraAttackModeThreads;
                }
                if(!(attackAmountOnTargetLeft > 0)) {
                    break;
                }
                let hostServer = serverList[i];
                let hostServerName = hostServer.name;
                let hostServerMaxRam = hostServer.maxram;
                if(ns.isRunning(scriptName, hostServerName, targetServer, isAffectingStock)) { 
                    continue;
                }
                if(hostServerName == reserveRamServer) hostServerMaxRam *= maxRamOnHome;
                let hostServerUsedRam = ns.getServerUsedRam(hostServerName);
                let hostServerRam = hostServerMaxRam - hostServerUsedRam;

                //#endregion safetyChecks
                if(hostServerRam >= scriptRam && attackAmountOnTargetLeft > 0) {
                    if(!(await ns.scp(scriptName, "home", hostServerName))) {
                        ns.tprint("Copy did not work for server '" + hostServerName + "'");
                    }
                    attackAmountOnTargetLeft = Math.max(attackAmountOnTargetLeft, 1)
                    let maxScriptCapacityOnServer = Math.max(parseInt(hostServerRam / scriptRam), 1);
                    let scriptsToRun = maxScriptCapacityOnServer;
                    if(scriptsToRun > attackAmountOnTargetLeft) { // Server doesn't have enough RAM to run all of the threads
                        scriptsToRun = attackAmountOnTargetLeft;
                    }
                    if(!Number.isInteger(scriptsToRun) || scriptsToRun < 1) scriptsToRun = 1;
                    attackAmountOnTargetLeft -= scriptsToRun;
                    if(!ns.isRunning(scriptName, hostServerName, targetServer, isAffectingStock)) {
                        let execPid = ns.exec(scriptName, hostServerName, scriptsToRun, targetServer, isAffectingStock);
                    }
                }
                await ns.sleep(200);
            }
            if(attackAmountOnTargetLeft < 1) {
                serverInfo = ns.getServer(targetServer);
                playerInfo = ns.getPlayer();
                if(originalAttackAmountOnTarget > 0) await calculateTimeDelay(counter, ns, targetServer, attackMode, serverInfo, playerInfo);
                break;
            }
            await ns.sleep(200);
        }
        counter++;
        if(counter >= 4) {
            counter = 0;
        }
		await ns.sleep(500);
    }
}



function growSetup(ns, serverMaxMoney, targetServer, moneyOnServer, originalAttackAmountOnTarget, cores, serverCurrentSecurity, attackAmountOnTargetLeft, scriptName, scriptRam) {
    serverMaxMoney = ns.getServerMaxMoney(targetServer);
    moneyOnServer = ns.getServerMoneyAvailable(targetServer);

    if (moneyOnServer < 1) {
        originalAttackAmountOnTarget = 1000;
    }
    else {
        originalAttackAmountOnTarget = ns.growthAnalyze(targetServer, 1 / (moneyOnServer / serverMaxMoney), cores);
    }
    serverCurrentSecurity = ns.getServerSecurityLevel(targetServer) + ns.growthAnalyzeSecurity(originalAttackAmountOnTarget, targetServer, cores);
    attackAmountOnTargetLeft = originalAttackAmountOnTarget;
    scriptName = "singlegrowattack.js";
    scriptRam = ns.getScriptRam("singlegrowattack.js");
    return { serverMaxMoney, moneyOnServer, originalAttackAmountOnTarget, serverCurrentSecurity, attackAmountOnTargetLeft, scriptName, scriptRam };
}

function weakenSetup(ns, serverCurrentSecurity, serverMinSecurity, originalAttackAmountOnTarget, threads, cores, attackAmountOnTargetLeft, scriptName, scriptRam) {
    
    let serverSecurityToBeWeakened = serverCurrentSecurity - serverMinSecurity;

    originalAttackAmountOnTarget = serverSecurityToBeWeakened / ns.weakenAnalyze(threads, cores);
    attackAmountOnTargetLeft = originalAttackAmountOnTarget;

    scriptName = "singleweakenattack.js";
    scriptRam = ns.getScriptRam("singleweakenattack.js");
    return { originalAttackAmountOnTarget, attackAmountOnTargetLeft, scriptName, scriptRam };
}

function hackSetup(ns, serverMaxMoney, targetServer, originalAttackAmountOnTarget, targetMoneyStealPercentage, serverCurrentSecurity, attackAmountOnTargetLeft, scriptName, scriptRam) {
    
    serverMaxMoney = ns.getServerMaxMoney(targetServer);

    originalAttackAmountOnTarget = ns.hackAnalyzeThreads(targetServer, serverMaxMoney * targetMoneyStealPercentage);
    serverCurrentSecurity = ns.getServerSecurityLevel(targetServer) + ns.hackAnalyzeSecurity(originalAttackAmountOnTarget, targetServer);
    attackAmountOnTargetLeft = originalAttackAmountOnTarget;
    scriptName = "singlehackattack.js";
    scriptRam = ns.getScriptRam("singlehackattack.js");
    return { serverMaxMoney, originalAttackAmountOnTarget, serverCurrentSecurity, attackAmountOnTargetLeft, scriptName, scriptRam };
}

async function calculateTimeDelay(counter, ns, targetServer, attackMode, serverInfo, playerInfo) {
    let timeInfoRequirements = {
        targetServer:targetServer,
        serverInfo:serverInfo,
        playerInfo:playerInfo
    }
    let sleepTimer = 0;
    if (counter == 0) {
        let currentStep = getWeakenTime(ns, timeInfoRequirements);
        let nextStep = 0;
        if(attackMode != "none") {
            if(attackMode == "hack") {
                nextStep = getHackTime(ns, timeInfoRequirements);
            }
        }
        else {
            nextStep = getGrowTime(ns, timeInfoRequirements);
        }
        sleepTimer = currentStep - nextStep;
    }
    if (counter == 1) {
        let currentStep = 0;
        let nextStep = 0;
        if(attackMode != "none") {
            if(attackMode == "hack") {
                currentStep = getHackTime(ns, timeInfoRequirements);
                nextStep = getWeakenTime(ns, timeInfoRequirements);
                sleepTimer = currentStep - nextStep;
            }
        }
        else {
            currentStep = getGrowTime(ns, timeInfoRequirements);
            nextStep = getWeakenTime(ns, timeInfoRequirements);
            sleepTimer = currentStep - nextStep;
        }
    }
    if (counter == 2) {
        let currentStep = getWeakenTime(ns, timeInfoRequirements);
        let nextStep = 0;
        if(attackMode != "none") {
            if(attackMode == "hack") {
                nextStep = getHackTime(ns, timeInfoRequirements);
            }
        }
        else {
            nextStep = getGrowTime(ns, timeInfoRequirements);
        }
        sleepTimer = currentStep - nextStep;
    }
    if (counter == 3) {
        let currentStep = 0;
        let nextStep = 0;
        if(attackMode != "none") {
            if(attackMode == "hack") {
                currentStep = getHackTime(ns, timeInfoRequirements);
                nextStep = getWeakenTime(ns, timeInfoRequirements);
                sleepTimer = currentStep - nextStep;
            }
        }
        else {
            currentStep = getGrowTime(ns, timeInfoRequirements);
            nextStep = getWeakenTime(ns, timeInfoRequirements);
            sleepTimer = currentStep - nextStep;
        }
    }
    if (sleepTimer < 50)
        sleepTimer = 50;
    await ns.sleep(sleepTimer);
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