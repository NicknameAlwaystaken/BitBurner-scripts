/** @param {NS} ns */
export async function main(ns) {
    var target = ns.args[0];
    var affectStock = ns.args[1];
	await ns.grow(target, {stock: affectStock});
}