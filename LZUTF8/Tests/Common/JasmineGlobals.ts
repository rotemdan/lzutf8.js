namespace LZUTF8
{
	if (runningInNodeJS())
	{
		process.on('uncaughtException', function (e)
		{
			log(e);
		});
	}
}