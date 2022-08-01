/** @param {NS} ns */
export async function main(ns) {
	while(true) {
		var autoexec = JSON.parse(await ns.read("autoexec.txt"))
		await ns.sleep(500)
		var threads = 1;
		for(var i = 0; i < autoexec.autorunscripts.length; i++) {
			let process = autoexec.autorunscripts[i];
			ns.print(process);
			if(!ns.isRunning(process))
				ns.run(process, threads)
			await ns.sleep(500);
		}
		await ns.sleep(10000);
	}
}