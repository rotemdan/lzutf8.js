module LZUTF8
{
	export class EncodingBenchmarks
	{
		randomBytes: ByteArray;
		binaryString: string;
		base64String: string;

		randomUTF16String: string;
		encodedRandomString: ByteArray;

		constructor()
		{
			this.randomUTF16String = EncodingBenchmarks.getRandomUTF16StringOfLength(250000);
			this.randomBytes = encodeUTF8(this.randomUTF16String);
			//console.log(this.randomBytes.length);
		}

		encodeBase64()
		{
			this.base64String = Encoding.Base64.encode(this.randomBytes);
		}

		decodeBase64()
		{
			Encoding.Base64.decode(this.base64String);
		}

		encodeBinaryString()
		{
			this.binaryString = Encoding.BinaryString.encode(this.randomBytes);
		}

		decodeBinaryString()
		{
			Encoding.BinaryString.decode(this.binaryString);
		}

		encodeUTF8()
		{
			this.encodedRandomString = Encoding.UTF8.encode(this.randomUTF16String);
		}

		decodeUTF8()
		{
			Encoding.UTF8.decode(this.encodedRandomString);
		}

		static getRandomIntegerInRange(low, high)
		{
			return low + Math.floor(Math.random() * (high - low));
		}

		static getRandomUTF16StringOfLength(length)
		{
			var randomString = "";

			for (var i = 0; i < length; i++)
			{
				do
				{
					var randomCodePoint = EncodingBenchmarks.getRandomIntegerInRange(0, 0x10FFFF + 1);
				} while (randomCodePoint >= 0xD800 && randomCodePoint <= 0xDFFF);

				randomString += LZUTF8.Encoding.UTF8.getStringFromUnicodeCodePoint(randomCodePoint);
			}

			return randomString;
		}

		static start()
		{
			var bench = new EncodingBenchmarks();
			var benchmark = new Benchmark(bench, { maximumSamples: 1000, maximumTime: 200, logToDocument: true });
			benchmark.runAll([]);
		}
	}
}