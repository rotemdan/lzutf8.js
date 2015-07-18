module LZUTF8
{
	export function runningInNodeJS()
	{
		return ((typeof process === "object") && (typeof process.versions === "object") && (typeof process.versions.node === "string"));
	}

	if (module && module.exports)
	{
		module.exports = LZUTF8;
	}
}