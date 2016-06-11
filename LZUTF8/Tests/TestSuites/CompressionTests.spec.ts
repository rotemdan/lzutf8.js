//if (typeof window == "object") window["Uint8Array"] = undefined;
//jasmine.DEFAULT_TIMEOUT_INTERVAL = 400;

namespace LZUTF8
{
	describe("LZ-UTF8:", () =>
	{
		describe("Test inputs:", () =>
		{
			let addTestsForInputString = (testStringTitle: string, inputString: string) =>
			{
				describe(testStringTitle + ":", () =>
				{
					describe("Basic tests with diffferent types of hash tables:", () =>
					{
						let compressor1 = new Compressor(false);
						let compressor2 = new Compressor(true);
						let compressedData1 = compressor1.compressBlock(inputString);
						let compressedData2 = compressor2.compressBlock(inputString);

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
							let inputStringAsUTF8 = encodeUTF8(inputString);
							let part1 = inputStringAsUTF8.subarray(0, Math.floor(inputStringAsUTF8.length * 0.377345));
							let part2 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.377345), Math.floor(inputStringAsUTF8.length * 0.377345) + 2);
							let part3 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.377345) + 2, Math.floor(inputStringAsUTF8.length * 0.719283471));
							let part4 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.719283471), Math.floor(inputStringAsUTF8.length * 0.822345178225));
							let part5 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.822345178225));

							let compressor = new Compressor();
							let compressedData1 = compressor.compressBlock(part1);
							let compressedData2 = compressor.compressBlock(part2);
							let compressedData3 = compressor.compressBlock(part3);
							let compressedData4 = compressor.compressBlock(part4);
							let compressedData5 = compressor.compressBlock(part5);

							let joinedCompressedData = ArrayTools.joinByteArrays([compressedData1, compressedData2, compressedData3, compressedData4, compressedData5]);

							let decompressor = new Decompressor();
							let decompressedString1 = decompressor.decompressBlockToString(joinedCompressedData.subarray(0, Math.floor(joinedCompressedData.length * 0.2123684521)));
							let decompressedString2 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.2123684521), Math.floor(joinedCompressedData.length * 0.41218346219)));
							let decompressedString3 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.41218346219), Math.floor(joinedCompressedData.length * 0.74129384652)));
							let decompressedString4 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.74129384652), Math.floor(joinedCompressedData.length * 0.74129384652) + 2));
							let decompressedString5 = decompressor.decompressBlockToString(new Uint8Array(0));
							let decompressedString6 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.74129384652) + 2, Math.floor(joinedCompressedData.length * 0.9191234791281724)));
							let decompressedString7 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.9191234791281724)));

							expect(compareSequences(decompressedString1 + decompressedString2 + decompressedString3 + decompressedString4 + decompressedString5 + decompressedString6 + decompressedString7, inputString)).toBe(true);
						});

						it("Compresses and decompresses correctly when input and output are divided into hundreds of small random parts", () =>
						{
							let truncatedLength = 5001;
							let truncatedInputString = truncateUTF16String(inputString, truncatedLength);
							let input = encodeUTF8(truncatedInputString);
							let compressor = new Compressor();

							let compressedParts: Uint8Array[] = [];
							for (let offset = 0; offset < input.length;)
							{
								let randomLength = Math.floor(Math.random() * 4);
								let endOffset = Math.min(offset + randomLength, input.length);

								let part = compressor.compressBlock(input.subarray(offset, endOffset));
								compressedParts.push(part);
								offset += randomLength;
							}

							let joinedCompressedParts = ArrayTools.joinByteArrays(compressedParts);

							let decompressor = new Decompressor();

							let decompressedParts: Uint8Array[] = [];
							for (let offset = 0; offset < input.length;)
							{
								expect(joinedCompressedParts).toBeDefined();

								let randomLength = Math.floor(Math.random() * 4);
								let endOffset = Math.min(offset + randomLength, joinedCompressedParts.length);
								let part = decompressor.decompressBlock(joinedCompressedParts.subarray(offset, endOffset));

								expect(() => Encoding.UTF8.decode(part)).not.toThrow(); // Make sure the part is a valid and untruncated UTF-8 sequence

								decompressedParts.push(part);
								offset += randomLength;
							}

							let joinedDecompressedParts = ArrayTools.joinByteArrays(decompressedParts);

							expect(compareSequences(decodeUTF8(joinedDecompressedParts), truncatedInputString)).toBe(true);
						});
					});

					describe("Special properties:", () =>
					{
						it("Will decompresses the uncompressed string to itself (assuring UTF-8 backwards compatibility)", () =>
						{
							let decompressedUncompressedString = decompress(encodeUTF8(inputString));

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

		describe("Synchronous operations with different input and output encodings", () =>
		{
			let sourceAsString = TestData.hindiText.substr(0, 100);
			let sourceAsByteArray = encodeUTF8(sourceAsString);

			function addTestForEncodingCombination(testedSourceEncoding: string, testedCompressedEncoding: string, testedDecompressedEncoding: string)
			{
				it("Successfuly compresses a " + testedSourceEncoding + " to a " + testedCompressedEncoding + " and decompresses to a " + testedDecompressedEncoding, () =>
				{
					let source: any;
					if (testedSourceEncoding == "String")
						source = sourceAsString;
					else
						source = sourceAsByteArray;

					let compressedData = compress(source, { outputEncoding: testedCompressedEncoding });

					expect(verifyEncoding(compressedData, testedCompressedEncoding)).toBe(true);

					let decompressedData = decompress(compressedData, { inputEncoding: testedCompressedEncoding, outputEncoding: testedDecompressedEncoding });

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
			let sourceAsString = TestData.hindiText.substr(0,100);
			let sourceAsByteArray = encodeUTF8(sourceAsString);

			function addTestForEncodingCombination(testedSourceEncoding: string, testedCompressedEncoding: string, testedDecompressedEncoding: string, webWorkerEnabled: boolean)
			{
				it("Successfuly compresses a " + testedSourceEncoding + " to a " + testedCompressedEncoding + " and decompresses to a " + testedDecompressedEncoding, (done) =>
				{
					let source: any;
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
				let randomString1 = Random.getRandomUTF16StringOfLength(1001);
				let randomString2 = Random.getRandomUTF16StringOfLength(1301);

				it("Successfuly completes two async operation started in parallel (without web worker)", (done) =>
				{
					let firstIsDone = false;
					let secondIsDone = false;

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
					let firstIsDone = false;
					let secondIsDone = false;

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

				let compressor = new Compressor();
				expect(() => compressor.compressBlock(undefined)).toThrow();
				expect(() => compressor.compressBlock(null)).toThrow();

				let decompressor = new Decompressor();
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

			it("Invokes callback with error for invalid input type in asynchronous compression (with web workers)",(done) =>
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

			it("Invokes callback with error for invalid input type in asynchronous decompression (with web workers)",(done) =>
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

			it("Invokes callback with error for invalid input type in asynchronous compression (without web workers)",(done) =>
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

			it("Invokes callback with error for invalid input type in asynchronous decompression (without web workers)",(done) =>
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
				expect(compress(new Uint8Array(0))).toEqual(new Uint8Array(0));

				expect(decompress(new Uint8Array(0))).toEqual("");
				expect(decompress(new Uint8Array(0), { outputEncoding: "ByteArray" })).toEqual(new Uint8Array(0));

				let compressor = new Compressor();
				expect(compressor.compressBlock(new Uint8Array(0))).toEqual(new Uint8Array(0));

				let decompressor = new Decompressor();
				expect(decompressor.decompressBlock(new Uint8Array(0))).toEqual(new Uint8Array(0));
				expect(decompressor.decompressBlockToString(new Uint8Array(0))).toEqual("");
			});

			if (runningInNodeJS())
			{
				it("Automatically converts Buffers to Uint8Arrays (sync)", () =>
				{
					let compressedText = compress(new Buffer(TestData.loremIpsum));
					let decompressedText = decompress(new Buffer(compressedText));

					expect(decompressedText).toEqual(TestData.loremIpsum);
				});

				it("Automatically converts Buffers to Uint8Arrays (sync, incremental)", () =>
				{
					let compressor = new Compressor();
					let compressedText = compressor.compressBlock(<any> new Buffer(TestData.loremIpsum));

					let decompressor = new Decompressor();
					let decompressedText = decompressor.decompressBlock(<any> new Buffer(compressedText));

					expect(decodeUTF8(decompressedText)).toEqual(TestData.loremIpsum);
				});


				it("Automatically converts Buffers to Uint8Arrays (async)", (done) =>
				{
					compressAsync(new Buffer(TestData.loremIpsum), {}, (compressedText) =>
					{
						decompressAsync(new Buffer(compressedText), {}, (decompressedText) =>
						{
							expect(decompressedText).toEqual(TestData.loremIpsum);
							done();
						});
					});
				});

			}
		});


		describe("Special bytestream features:", () =>
		{
			it("Allows concatenation of multiple compressed and uncompressed streams to a single, valid compressed stream", () =>
			{
				let compressdData1 = compress(TestData.chineseText);
				let rawData = encodeUTF8(TestData.hindiText);
				let compressedData2 = compress(TestData.chineseText);
				let compressedData3 = compress(TestData.loremIpsum);

				let mixedData = ArrayTools.joinByteArrays([compressdData1, rawData, compressedData2, compressedData3]);

				let decompressedMixedData: string = decompress(mixedData);

				expect(compareSequences(decompressedMixedData, TestData.chineseText + TestData.hindiText + TestData.chineseText + TestData.loremIpsum)).toBe(true);
			});
		});

		if (runningInNodeJS())
		{
			describe("Node.js streams integration:", () =>
			{
				it("Correctly compresses and decompresses through streams", (done: Function) =>
				{
					let compressionStream = createCompressionStream();
					let decompressionStream = createDecompressionStream();

					compressionStream.pipe(decompressionStream);
					compressionStream.write(TestData.hindiText);

					decompressionStream.on("readable", () =>
					{
						let result = decompressionStream.read().toString("utf8");
						expect(result).toEqual(TestData.hindiText);
						done();
					});
				});
			});
		}
	});
}