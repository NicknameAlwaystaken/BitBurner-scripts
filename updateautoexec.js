/** @param {NS} ns */
export async function main(ns) {
	var fileName = "autoexec.txt"
	var autoexec = JSON.parse("{\"autorunscripts\":[]}")
	autoexec.autorunscripts.push("monitorramuse.js")
	autoexec.autorunscripts.push("wseautomator.js")
	autoexec.autorunscripts.push("servernuke.js")
	autoexec.autorunscripts.push("scantohack.js")
	autoexec.autorunscripts.push("buyserver.js")
	autoexec.autorunscripts.push("codingcontract.js")

	await ns.write(fileName, JSON.stringify(autoexec), "w")
	ns.tprint(autoexec);
}