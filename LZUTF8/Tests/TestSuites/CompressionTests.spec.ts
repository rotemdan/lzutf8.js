//if (typeof window == "object") window["Uint8Array"] = undefined;
//jasmine.DEFAULT_TIMEOUT_INTERVAL = 400;

module LZUTF8
{
	describe("LZ-UTF8:", () =>
	{
		describe("Test inputs:", () =>
		{
			var addTestsForInputString = (testStringTitle: string, inputString: string) =>
			{
				describe(testStringTitle + ":", () =>
				{
					describe("Basic tests with diffferent types of hash tables:", () =>
					{
						var compressor1 = new Compressor(false);
						var compressor2 = new Compressor(true);
						var compressedData1 = compressor1.compressBlock(inputString);
						var compressedData2 = compressor2.compressBlock(inputString);

						it("Compresses correctly with simple hash table", () =>
						{
							expect(compareSequences(decompress(compressedData1), inputString)).toBe(true);
							expect(compressedData1.length).toBeLessThan(encodeUTF8(inputString).length);
						});

						it("Compresses correctly with custom hash table", () =>
						{
							expect(compareSequences(decompress(compressedData2), inputString)).toBe(true);
							expect(compressedData2.length).toBeLessThan(encodeUTF8(inputString).length);
						});

						it("Outputs the exact same data for both the simple and custom hash tables", () =>
						{
							expect(compareSequences(compressedData1, compressedData2)).toBe(true);
						});

						it("Creates a simple hash table with a bucket count larger than 0", () =>
						{
							expect(compressor1.prefixHashTable.getUsedBucketCount()).toBeGreaterThan(0);
						});

						it("Creates a custom hash table with a bucket count larger than 0", () =>
						{
							expect(compressor2.prefixHashTable.getUsedBucketCount()).toBeGreaterThan(0);
						});

						it("Both the simple and custom hash tables have the same bucket usage", () =>
						{
							expect(compressor1.prefixHashTable.getUsedBucketCount()).toEqual(compressor2.prefixHashTable.getUsedBucketCount());
						});

						it("Both the simple and custom hash tables have the same total element count", () =>
						{
							expect(compressor1.prefixHashTable.getTotalElementCount()).toEqual(compressor2.prefixHashTable.getTotalElementCount());
						});
					});

					describe("Multi-part compression/decompression:", () =>
					{
						it("Compresses and decompresses correctly when input and output are divided into multiple arbitrary parts", () =>
						{
							var inputStringAsUTF8 = encodeUTF8(inputString);
							var part1 = inputStringAsUTF8.subarray(0, Math.floor(inputStringAsUTF8.length * 0.377345));
							var part2 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.377345), Math.floor(inputStringAsUTF8.length * 0.377345) + 2);
							var part3 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.377345) + 2, Math.floor(inputStringAsUTF8.length * 0.719283471));
							var part4 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.719283471), Math.floor(inputStringAsUTF8.length * 0.822345178225));
							var part5 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.822345178225));

							var compressor = new Compressor();
							var compressedData1 = compressor.compressBlock(part1);
							var compressedData2 = compressor.compressBlock(part2);
							var compressedData3 = compressor.compressBlock(part3);
							var compressedData4 = compressor.compressBlock(part4);
							var compressedData5 = compressor.compressBlock(part5);

							var joinedCompressedData = ArrayTools.joinByteArrays([compressedData1, compressedData2, compressedData3, compressedData4, compressedData5]);

							var decompressor = new Decompressor();
							var decompressedString1 = decompressor.decompressBlockToString(joinedCompressedData.subarray(0, Math.floor(joinedCompressedData.length * 0.2123684521)));
							var decompressedString2 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.2123684521), Math.floor(joinedCompressedData.length * 0.41218346219)));
							var decompressedString3 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.41218346219), Math.floor(joinedCompressedData.length * 0.74129384652)));
							var decompressedString4 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.74129384652), Math.floor(joinedCompressedData.length * 0.74129384652) + 2));
							var decompressedString5 = decompressor.decompressBlockToString(newByteArray(0));
							var decompressedString6 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.74129384652) + 2, Math.floor(joinedCompressedData.length * 0.9191234791281724)));
							var decompressedString7 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.9191234791281724)));

							expect(compareSequences(decompressedString1 + decompressedString2 + decompressedString3 + decompressedString4 + decompressedString5 + decompressedString6 + decompressedString7, inputString)).toBe(true);
						});

						it("Compresses and decompresses correctly when input and output are divided into hundreds of small random parts", () =>
						{
							var truncatedLength = 5001;
							var truncatedInputString = truncateUTF16String(inputString, truncatedLength);
							var input = encodeUTF8(truncatedInputString);
							var compressor = new Compressor();

							var compressedParts: ByteArray[] = [];
							for (var offset = 0; offset < input.length;)
							{
								var randomLength = Math.floor(Math.random() * 4);
								var endOffset = Math.min(offset + randomLength, input.length);

								var part = compressor.compressBlock(input.subarray(offset, endOffset));
								compressedParts.push(part);
								offset += randomLength;
							}

							var joinedCompressedParts = ArrayTools.joinByteArrays(compressedParts);

							var decompressor = new Decompressor();

							var decompressedParts: ByteArray[] = [];
							for (var offset = 0; offset < input.length;)
							{
								expect(joinedCompressedParts).toBeDefined();

								var randomLength = Math.floor(Math.random() * 4);
								var endOffset = Math.min(offset + randomLength, joinedCompressedParts.length);
								var part = decompressor.decompressBlock(joinedCompressedParts.subarray(offset, endOffset));

								expect(() => Encoding.UTF8.decode(part)).not.toThrow(); // Make sure the part is a valid and untruncated UTF-8 sequence

								decompressedParts.push(part);
								offset += randomLength;
							}

							var joinedDecompressedParts = ArrayTools.joinByteArrays(decompressedParts);

							expect(compareSequences(decodeUTF8(joinedDecompressedParts), truncatedInputString)).toBe(true);
						});
					});

					describe("Special properties:", () =>
					{
						it("Will decompresses the uncompressed string to itself (assuring UTF-8 backwards compatibility)", () =>
						{
							var decompressedUncompressedString = decompress(encodeUTF8(inputString));

							expect(compareSequences(decompressedUncompressedString, inputString)).toBe(true);
						});
					});
				});
			};

			addTestsForInputString("Lorem ipsum", TestData.loremIpsum);
			addTestsForInputString("Chinese text", TestData.chineseText);
			addTestsForInputString("Hindi text", TestData.hindiText);
			addTestsForInputString("Random unicode characters (up to codepoint 1112064)", Random.getRandomUTF16StringOfLength(2000));
			addTestsForInputString("Long mixed text", TestData.hindiText + TestData.loremIpsum + TestData.hindiText + TestData.chineseText + TestData.chineseText);
			addTestsForInputString("Repeating String 'aaaaaaa'..", repeatString("aaaaaaaaaa", 2000));
		});

		describe("Sycnhronous operations with different input and output encodings", () =>
		{
			var sourceAsString = TestData.hindiText.substr(0, 100);
			var sourceAsByteArray = encodeUTF8(sourceAsString);

			function addTestForEncodingCombination(testedSourceEncoding: string, testedCompressedEncoding: string, testedDecompressedEncoding: string)
			{
				it("Successfuly compresses a " + testedSourceEncoding + " to a " + testedCompressedEncoding + " and decompresses to a " + testedDecompressedEncoding, () =>
				{
					var source: any;
					if (testedSourceEncoding == "String")
						source = sourceAsString;
					else
						source = sourceAsByteArray;

					var compressedData = compress(source, { outputEncoding: testedCompressedEncoding });

					expect(verifyEncoding(compressedData, testedCompressedEncoding)).toBe(true);

					var decompressedData = decompress(compressedData, { inputEncoding: testedCompressedEncoding, outputEncoding: testedDecompressedEncoding });

					if (testedDecompressedEncoding == "String")
						expect(compareSequences(decompressedData, sourceAsString)).toBe(true);
					else if (testedDecompressedEncoding == "ByteArray")
						expect(compareSequences(decompressedData, sourceAsByteArray)).toBe(true);
				});
			}

			addTestForEncodingCombination("String", "ByteArray", "String");
			addTestForEncodingCombination("String", "ByteArray", "ByteArray");
			addTestForEncodingCombination("String", "BinaryString", "String");
			addTestForEncodingCombination("String", "BinaryString", "ByteArray");
			addTestForEncodingCombination("String", "Base64", "String");
			addTestForEncodingCombination("String", "Base64", "ByteArray");

			addTestForEncodingCombination("ByteArray", "ByteArray", "String");
			addTestForEncodingCombination("ByteArray", "ByteArray", "ByteArray");
			addTestForEncodingCombination("ByteArray", "BinaryString", "String");
			addTestForEncodingCombination("ByteArray", "BinaryString", "ByteArray");
			addTestForEncodingCombination("ByteArray", "Base64", "String");
			addTestForEncodingCombination("ByteArray", "Base64", "ByteArray");

		});

		describe("Asynchronous operations with different input and output encodings:", () =>
		{
			var sourceAsString = TestData.hindiText.substr(0,100);
			var sourceAsByteArray = encodeUTF8(sourceAsString);

			function addTestForEncodingCombination(testedSourceEncoding: string, testedCompressedEncoding: string, testedDecompressedEncoding: string, webWorkerEnabled: boolean)
			{
				it("Successfuly compresses a " + testedSourceEncoding + " to a " + testedCompressedEncoding + " and decompresses to a " + testedDecompressedEncoding, (done) =>
				{
					var source: any;
					if (testedSourceEncoding == "String")
						source = sourceAsString;
					else
						source = sourceAsByteArray;

					compressAsync(source, { outputEncoding: testedCompressedEncoding, useWebWorker: webWorkerEnabled, blockSize: 31 }, (compressedData) =>
					{
						expect(verifyEncoding(compressedData, testedCompressedEncoding)).toBe(true);

						decompressAsync(compressedData, { inputEncoding: testedCompressedEncoding, outputEncoding: testedDecompressedEncoding, useWebWorker: webWorkerEnabled, blockSize: 23 }, (decompressedData) =>
						{
							if (testedDecompressedEncoding == "String")
								expect(compareSequences(decompressedData, sourceAsString)).toBe(true);
							else if (testedDecompressedEncoding == "ByteArray")
								expect(compareSequences(decompressedData, sourceAsByteArray)).toBe(true);

							done();
						});
					});
				});
			}

			// Async tests without web worker

			describe("Without web worker:", () =>
			{
				addTestForEncodingCombination("String", "ByteArray", "String", false);
				addTestForEncodingCombination("String", "ByteArray", "ByteArray", false);
				addTestForEncodingCombination("String", "BinaryString", "String", false);
				addTestForEncodingCombination("String", "BinaryString", "ByteArray", false);
				addTestForEncodingCombination("String", "Base64", "String", false);
				addTestForEncodingCombination("String", "Base64", "ByteArray", false);

				addTestForEncodingCombination("ByteArray", "ByteArray", "String", false);
				addTestForEncodingCombination("ByteArray", "ByteArray", "ByteArray", false);
				addTestForEncodingCombination("ByteArray", "BinaryString", "String", false);
				addTestForEncodingCombination("ByteArray", "BinaryString", "ByteArray", false);
				addTestForEncodingCombination("ByteArray", "Base64", "String", false);
				addTestForEncodingCombination("ByteArray", "Base64", "ByteArray", false);
			});

			describe("With web worker (if supported):", () =>
			{
				addTestForEncodingCombination("String", "ByteArray", "String", true);
				addTestForEncodingCombination("String", "ByteArray", "ByteArray", true);
				addTestForEncodingCombination("String", "BinaryString", "String", true);
				addTestForEncodingCombination("String", "BinaryString", "ByteArray", true);
				addTestForEncodingCombination("String", "Base64", "String", true);
				addTestForEncodingCombination("String", "Base64", "ByteArray", true);

				addTestForEncodingCombination("ByteArray", "ByteArray", "String", true);
				addTestForEncodingCombination("ByteArray", "ByteArray", "ByteArray", true);
				addTestForEncodingCombination("ByteArray", "BinaryString", "String", true);
				addTestForEncodingCombination("ByteArray", "BinaryString", "ByteArray", true);
				addTestForEncodingCombination("ByteArray", "Base64", "String", true);
				addTestForEncodingCombination("ByteArray", "Base64", "ByteArray", true);
			});

			describe("With automatic setting for web worker:", () =>
			{
				addTestForEncodingCombination("String", "ByteArray", "String", undefined);
				addTestForEncodingCombination("String", "ByteArray", "ByteArray", undefined);
				addTestForEncodingCombination("String", "BinaryString", "String", undefined);
				addTestForEncodingCombination("String", "BinaryString", "ByteArray", undefined);
				addTestForEncodingCombination("String", "Base64", "String", undefined);
				addTestForEncodingCombination("String", "Base64", "ByteArray", undefined);

				addTestForEncodingCombination("ByteArray", "ByteArray", "String", undefined);
				addTestForEncodingCombination("ByteArray", "ByteArray", "ByteArray", undefined);
				addTestForEncodingCombination("ByteArray", "BinaryString", "String", undefined);
				addTestForEncodingCombination("ByteArray", "BinaryString", "ByteArray", undefined);
				addTestForEncodingCombination("ByteArray", "Base64", "String", undefined);
				addTestForEncodingCombination("ByteArray", "Base64", "ByteArray", undefined);
			});

			describe("Simultanous async operations:", () =>
			{
				var randomString1 = Random.getRandomUTF16StringOfLength(1001);
				var randomString2 = Random.getRandomUTF16StringOfLength(1301);

				it("Successfuly completes two async operation started in parallel (without web worker)", (done) =>
				{
					var firstIsDone = false;
					var secondIsDone = false;

					compressAsync(randomString1, { blockSize: 221, useWebWorker: false }, (result) =>
					{
						expect(compareSequences(decompress(result), randomString1)).toBe(true);
						firstIsDone = true;

						if (secondIsDone)
							done();
					});

					compressAsync(randomString2, { blockSize: 321, useWebWorker: false }, (result) =>
					{
						expect(compareSequences(decompress(result), randomString2)).toBe(true);
						secondIsDone = true;

						if (firstIsDone)
							done();
					});
				});

				it("Successfuly completes two async operation started in parallel (with web worker if supported)", (done) =>
				{
					var firstIsDone = false;
					var secondIsDone = false;

					compressAsync(TestData.chineseText, { useWebWorker: true }, (result) =>
					{
						expect(compareSequences(decompress(result), TestData.chineseText)).toBe(true);
						firstIsDone = true;

						if (secondIsDone)
							done();
					});

					compressAsync(TestData.loremIpsum, { useWebWorker: true }, (result) =>
					{
						expect(compareSequences(decompress(result), TestData.loremIpsum)).toBe(true);
						secondIsDone = true;

						if (firstIsDone)
							done();
					});
				});
			});

			describe("Async operations with a custom web worker URI", () =>
			{
				beforeEach(() =>
				{
					WebWorker.terminate();
					WebWorker.scriptURI = "../Build/lzutf8.js";
				});

				afterEach(() =>
				{
					WebWorker.terminate();
					WebWorker.scriptURI = undefined;
				});


				if (WebWorker.isSupported())
				{
					addTestForEncodingCombination("ByteArray", "BinaryString", "String", true);
				}
			});
		});

		describe("Error handling:",() =>
		{
			it("Throws on undefined or null input for synchronous compression and decompression",() =>
			{
				expect(() => compress(undefined)).toThrow();
				expect(() => compress(null)).toThrow();
				expect(() => decompress(undefined)).toThrow();
				expect(() => decompress(null)).toThrow();

				var compressor = new Compressor();
				expect(() => compressor.compressBlock(undefined)).toThrow();
				expect(() => compressor.compressBlock(null)).toThrow();

				var decompressor = new Decompressor();
				expect(() => decompressor.decompressBlock(undefined)).toThrow();
				expect(() => decompressor.decompressBlock(null)).toThrow();

			});

			// Async with web workers
			it("Invokes callback with error for undefined input in asynchronous compression (with web workers)",(done) =>
			{
				compressAsync(undefined, { useWebWorker: true },(result, error) =>
				{
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});

			it("Invokes callback with error for invalid input in asynchronous compression (with web workers)",(done) =>
			{
				compressAsync(new Date(), { useWebWorker: true },(result, error) =>
				{
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});

			it("Invokes callback with error for undefined input in asynchronous decompression (with web workers)",(done) =>
			{
				decompressAsync(undefined, { useWebWorker: true },(result, error) =>
				{
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});

			it("Invokes callback with error for invalid input in asynchronous decompression (with web workers)",(done) =>
			{
				decompressAsync(new Date(), { inputEncoding: "Base64", useWebWorker: true },(result, error) =>
				{
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});

			// Async without web workers
			it("Invokes callback with error for undefined input in asynchronous compression (without web workers)",(done) =>
			{
				compressAsync(undefined, { useWebWorker: false },(result, error) =>
				{
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});

			it("Invokes callback with error for invalid input in asynchronous compression (without web workers)",(done) =>
			{
				compressAsync(new Date(), { useWebWorker: false },(result, error) =>
				{
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});

			it("Invokes callback with error for undefined input in asynchronous decompression (without web workers)",(done) =>
			{
				decompressAsync(undefined, { useWebWorker: false },(result, error) =>
				{
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});

			it("Invokes callback with error for invalid input in asynchronous decompression (without web workers)",(done) =>
			{
				decompressAsync(new Date(), { inputEncoding: "Base64", useWebWorker: false },(result, error) =>
				{
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});
		});

		describe("Trivial cases:",() =>
		{
			it("Handles zero length input for compression and decompression", () =>
			{
				expect(compress(newByteArray(0))).toEqual(newByteArray(0));

				expect(decompress(newByteArray(0))).toEqual("");
				expect(decompress(newByteArray(0), { outputEncoding: "ByteArray" })).toEqual(newByteArray(0));

				var compressor = new Compressor();
				expect(compressor.compressBlock(newByteArray(0))).toEqual(newByteArray(0));

				var decompressor = new Decompressor();
				expect(decompressor.decompressBlock(newByteArray(0))).toEqual(newByteArray(0));
				expect(decompressor.decompressBlockToString(newByteArray(0))).toEqual("");
			});
		});


		describe("Special bytestream features:", () =>
		{
			it("Allows concatenation of multiple compressed and uncompressed streams to a single, valid compressed stream", () =>
			{
				var compressdData1 = compress(TestData.chineseText);
				var rawData = encodeUTF8(TestData.hindiText);
				var compressedData2 = compress(TestData.chineseText);
				var compressedData3 = compress(TestData.loremIpsum);

				var mixedData = ArrayTools.joinByteArrays([compressdData1, rawData, compressedData2, compressedData3]);

				var decompressedMixedData: string = decompress(mixedData);

				expect(compareSequences(decompressedMixedData, TestData.chineseText + TestData.hindiText + TestData.chineseText + TestData.loremIpsum)).toBe(true);
			});
		});

		if (runningInNodeJS())
		{
			describe("Node.js streams integration:", () =>
			{
				it("Correctly compresses and decompresses through streams", (done: Function) =>
				{
					var compressionStream = createCompressionStream();
					var decompressionStream = createDecompressionStream();

					compressionStream.pipe(decompressionStream);
					compressionStream.write(TestData.hindiText);

					decompressionStream.on("readable", () =>
					{
						var result = decompressionStream.read().toString("utf8");
						expect(result).toEqual(TestData.hindiText);
						done();
					});
				});
			});
		}
	});
}