module LZUTF8
{
	export function runningInNodeJS()
	{
		return ((typeof process === "object") && (typeof process.versions === "object") && (typeof process.versions.node === "string"));
	}

	if (typeof module === "object" && typeof module.exports === "object")
	{
		module.exports = LZUTF8;
	}
}