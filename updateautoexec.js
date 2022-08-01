/** @param {NS} ns */
export async function main(ns) {
	var fileName = "autoexec.txt"
	var autoexec = JSON.parse("{\"autorunscripts\":[]}")
	autoexec.autorunscripts.push("monitorramuse.js")
	autoexec.autorunscripts.push("servernuke.js")
	autoexec.autorunscripts.push("updatehostableservers.js")
	autoexec.autorunscripts.push("updateserverstohack.js")
	autoexec.autorunscripts.push("scantohack.js")
	autoexec.autorunscripts.push("buyserver.js")
	autoexec.autorunscripts.push("monitorramuse.js")

	await ns.write(fileName, JSON.stringify(autoexec), "w")
	ns.tprint(autoexec);
}