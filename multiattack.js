/** @param {NS} ns */


export async function main(ns) {
	if (ns.args.length < 1) {
		ns.tprint("Not enough arguments! args: targetServer, maxRamOnHome");
		ns.exit();
	}
    const reserveRamServer = "home";
    let cores = 1;
    let threads = 1;
	let maxRamOnHome = 0.90;
    
    let scriptName;
    let scriptRam;

    let originalAttackAmountOnTarget;
    let attackAmountOnTargetLeft;

    let targetMoneyStealPercentage = 0.20;
    let serverMaxMoney;
    let moneyOnServer;
    let serverMinSecurity;
    let serverCurrentSecurity;

    let playerInfo;

    playerInfo = ns.getPlayer();
    let targetServer = ns.args[0];
    serverMaxMoney = ns.getServerMaxMoney(targetServer);
    moneyOnServer = ns.getServerMoneyAvailable(targetServer);
    serverMinSecurity = ns.getServerMinSecurityLevel(targetServer);
    serverCurrentSecurity = ns.getServerSecurityLevel(targetServer);

	if(ns.args.length > 2) {
    	maxRamOnHome = ns.args[1];
	}

	let fileName = "hostableservers.txt";
	let serverList = JSON.parse(await ns.read(fileName));
	let port = ns.getPortHandle(1);

    var counter = 0;
    while(true) {
        if(ns.getServerMoneyAvailable(targetServer) < 1) return;
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
        while(true) {
            serverList = JSON.parse(await ns.read(fileName));
            for(let i = 0; i < serverList.hostableservers.length; i++) {
                //#region safetyChecks
                if(attackAmountOnTargetLeft < 1) {
                    await calculateTimeDelay(counter, ns, targetServer);
                    break;
                }
                let currentServer = serverList.hostableservers[i];
                if(ns.isRunning(scriptName, currentServer, targetServer)) { 
                    continue;
                }
                let currentServerMaxRam = ns.getServerMaxRam(currentServer);
                if(currentServer == reserveRamServer) currentServerMaxRam *= maxRamOnHome;
                let currentServerUsedRam = ns.getServerUsedRam(currentServer);
                let currentServerRam = currentServerMaxRam - currentServerUsedRam;
                //#endregion safetyChecks
                if(currentServerRam >= scriptRam && attackAmountOnTargetLeft > 0) {
                    if(!(await ns.scp(scriptName, "home", currentServer))) {
                        ns.tprint("Copy did not work for server '" + currentServer + "'");
                    }
                    let maxScriptCapacityOnServer = parseInt(currentServerRam / scriptRam);
                    let scriptsToRun = maxScriptCapacityOnServer;
                    if(scriptsToRun > attackAmountOnTargetLeft) { // Server doesn't have enough RAM to run all of the threads
                        scriptsToRun = attackAmountOnTargetLeft;
                    }
                    let execPid = ns.exec(scriptName, currentServer, scriptsToRun, targetServer);
                    attackAmountOnTargetLeft -= maxScriptCapacityOnServer;
                    if(ns.isRunning("monitorramuse.js", "home")){
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
                }
                await ns.sleep(100);
            }
            if(attackAmountOnTargetLeft < 1) {
                await calculateTimeDelay(counter, ns, targetServer);
                break;
            }
            ns.print("Original thread count: " + parseInt(originalAttackAmountOnTarget) + " thread count left: " + parseInt(attackAmountOnTargetLeft))
            await ns.sleep(100);
        }
        counter++;
        if(counter >= 4) {
            counter = 0;
        }
		await ns.sleep(100);
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
    if (originalAttackAmountOnTarget === -1) {
        ns.print("Not enough money on the server!");
        ns.exit();
    }
    serverCurrentSecurity = ns.getServerSecurityLevel(targetServer) + ns.hackAnalyzeSecurity(originalAttackAmountOnTarget, targetServer);
    attackAmountOnTargetLeft = originalAttackAmountOnTarget;
    scriptName = "singlehackattack.js";
    scriptRam = ns.getScriptRam("singlehackattack.js");
    return { serverMaxMoney, originalAttackAmountOnTarget, serverCurrentSecurity, attackAmountOnTargetLeft, scriptName, scriptRam };
}

async function calculateTimeDelay(counter, ns, targetServer) {
    let sleepTimer;
    if (counter == 0) {
        let currentStep = getWeakenTime(ns, targetServer);
        let nextStep = getGrowTime(ns, targetServer);
        sleepTimer = currentStep - nextStep;
    }
    if (counter == 1) {
        let currentStep = getGrowTime(ns);
        let nextStep = getWeakenTime(ns, targetServer, targetServer);
        sleepTimer = currentStep - nextStep;
    }
    if (counter == 2) {
        let currentStep = getWeakenTime(ns, targetServer);
        let nextStep = getHackTime(ns, targetServer);
        sleepTimer = currentStep - nextStep;
    }
    if (counter == 3) {
        let currentStep = getHackTime(ns, targetServer);
        let nextStep = getWeakenTime(ns, targetServer);
        sleepTimer = currentStep - nextStep;
    }
    if (sleepTimer < 200)
        sleepTimer = 200;
    await ns.sleep(sleepTimer);
}

function getHackTime(ns, targetServer) {
    let timeTakes;
    if (ns.fileExists("Formulas.exe")) {
        timeTakes = ns.formulas.hacking.hackTime(ns.getServer(targetServer), ns.getPlayer());
    }
    else {
        timeTakes = ns.getHackTime(targetServer);
    }
    return timeTakes;
}


function getGrowTime(ns, targetServer) {
    let timeTakes;
    if (ns.fileExists("Formulas.exe")) {
        timeTakes = ns.formulas.hacking.growTime(ns.getServer(targetServer), ns.getPlayer());
    }
    else {
        timeTakes = ns.getGrowTime(targetServer);
    }
    return timeTakes;
}


function getWeakenTime(ns, targetServer) {
    let timeTakes;
    if (ns.fileExists("Formulas.exe")) {
        timeTakes = ns.formulas.hacking.weakenTime(ns.getServer(targetServer), ns.getPlayer());
    }
    else {
        timeTakes = ns.getWeakenTime(targetServer);
    }
    return timeTakes;
}