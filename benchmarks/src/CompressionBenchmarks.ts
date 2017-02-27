namespace LZUTF8 {
	export class CompressionBenchmarks {
		compressedString: Uint8Array;

		constructor() {
		}

		beforeEach() {
		}

		compressHindiText() {
			this.compressedString = <Uint8Array>compress(TestData.hindiText);
		}

		decompressHindiText() {
			decompress(this.compressedString);
		}

		compressChineseText() {
			this.compressedString = <Uint8Array>compress(TestData.chineseText);
		}

		decompressChineseText() {
			decompress(this.compressedString);
		}

		compressLoremIpsum() {
			this.compressedString = <Uint8Array>compress(TestData.loremIpsum);
		}

		decompressLoremIpsum() {
			decompress(this.compressedString);
		}

		static start() {
			let bench = new CompressionBenchmarks();
			let benchmark = new Benchmark(bench, { maximumSamples: 1000, maximumTime: 200, logToDocument: true });
			benchmark.runAll([]);
		}
	}
}
