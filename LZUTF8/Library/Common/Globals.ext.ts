module LZUTF8
{
	export function runningInNodeJS()
	{
		return (typeof require === "function") && (typeof module === "object") && (process && process.versions && process.versions.node)
	}

	if (runningInNodeJS())
	{
		module.exports = LZUTF8;
	}
}