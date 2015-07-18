module LZUTF8
{
	export function runningInNodeJS()
	{
		return ((typeof process === "object") && (typeof process.versions === "object") && (typeof process.versions.node === "string"));
	}

	if (runningInNodeJS())
	{
		module.exports = LZUTF8;
	}
}