namespace LZUTF8 {
	if (runningInNodeJS()) {
		process.on('uncaughtException', function (e: any) {
			log(e);
		});
	}
}
