namespace LZUTF8 {
	export class EncodingBenchmarks {
		randomBytes: Uint8Array;
		binaryString: string;
		base64String: string;

		randomUTF16String: string;
		encodedRandomString: Uint8Array;

		constructor() {
			this.randomUTF16String = getRandomUTF16StringOfLength(250000);
			this.randomBytes = encodeUTF8(this.randomUTF16String);
			//log(this.randomBytes.length);
		}

		encodeBase64() {
			this.base64String = encodeBase64(this.randomBytes);
		}

		decodeBase64() {
			decodeBase64(this.base64String);
		}

		encodeBinaryString() {
			this.binaryString = encodeBinaryString(this.randomBytes);
		}

		decodeBinaryString() {
			decodeBinaryString(this.binaryString);
		}

		encodeUTF8() {
			this.encodedRandomString = encodeUTF8(this.randomUTF16String);
		}

		decodeUTF8() {
			decodeUTF8(this.encodedRandomString);
		}

		static start() {
			let bench = new EncodingBenchmarks();
			let benchmark = new Benchmark(bench, { maximumSamples: 1000, maximumTime: 200, logToDocument: true });
			benchmark.runAll([]);
		}
	}
}
