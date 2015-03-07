module LZUTF8
{
	export function runningInNodeJS()
	{
		return (typeof require == "function") && (typeof module == "object")
	}

	if (runningInNodeJS())
	{
		/*
		process.on('uncaughtException', function (e)
		{
			console.log(e);
		});
		*/

		module.exports = LZUTF8;
	}
}