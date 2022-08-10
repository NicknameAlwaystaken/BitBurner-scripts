/** @param {NS} ns */
export async function main(ns) {
	let autoexec = JSON.parse(await ns.read("autoexec.txt"))
	let threads = 1;
	let listOfFilesToRemove = ["stocklog.txt", "serverinformation.txt", "hostableservers.txt"];
	for(let i = 0; i < listOfFilesToRemove.length; i++) {
		if(i == 0 && ns.isRunning("wseautomator.js")) continue;
		if(ns.rm(listOfFilesToRemove[i])) {
			ns.tprint("Removed: " + listOfFilesToRemove[i]);
		}
	}
	for(let i = 0; i < autoexec.autorunscripts.length; i++) {
		let process = autoexec.autorunscripts[i];
		ns.print(process);
		if(!ns.isRunning(process))
			ns.run(process, threads)
		await ns.sleep(1000);
	}
}