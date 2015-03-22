module LZUTF8
{
	export function runningInNodeJS()
	{
		return (typeof require === "function") && (typeof module === "object")
	}

	if (runningInNodeJS())
	{
		module.exports = LZUTF8;
	}
}