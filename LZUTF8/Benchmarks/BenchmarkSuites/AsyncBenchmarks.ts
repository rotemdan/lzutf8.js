module LZUTF8
{
	export class AsyncBenchmarks
	{
		static benchmark(testData: any, compressedEncoding: string, decompressedEncoding: string, useWebWorker: boolean, done: Action)
		{
			var timer = new Timer();
			compress(testData, { outputEncoding: compressedEncoding });
			timer.logAndRestart("compress");

			compressAsync(testData, { outputEncoding: compressedEncoding, useWebWorker: useWebWorker }, (result) =>
			{
				timer.logAndRestart("compressAsync");

				decompressAsync(result, { inputEncoding: compressedEncoding, outputEncoding: decompressedEncoding, useWebWorker: useWebWorker }, () =>
				{
					timer.logAndRestart("decompressAsync");
					done();
				});
			});
		}

		static start()
		{
			//var testData = TestData.hindiText + TestData.hindiText + TestData.hindiText + TestData.hindiText + TestData.hindiText;
			var testData = TestData.loremIpsum;

			var timer = new Timer();

			WebWorker.createGlobalWorkerIfItDoesntExist();
			//
			compressAsync("", { useWebWorker: true }, () =>
			{
				timer.logAndRestart("createGlobalWorkerIfItDoesntExist");


				//document.write("<br/>Without web worker:<br/>");
				AsyncBenchmarks.benchmark(testData, "BinaryString", "String", false, () =>
				{
					//document.write("<br/>With web worker:<br/>");
					AsyncBenchmarks.benchmark(testData, "BinaryString", "String", true, () => { });
				});
				
			});
		}
	}
}