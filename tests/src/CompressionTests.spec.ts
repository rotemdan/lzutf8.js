namespace LZUTF8 {
	describe("LZ-UTF8:", () => {
		describe("Test inputs:", () => {
			const addTestsForInputString = (testStringTitle: string, inputString: string) => {
				describe(testStringTitle + ":", () => {
					describe("Basic tests with diffferent types of hash tables:", () => {
						let compressor1: Compressor;
						let compressor2: Compressor;
						let compressedData1: Uint8Array;
						let compressedData2: Uint8Array;

						beforeEach(() => {
							compressor1 = new Compressor(false);
							compressor2 = new Compressor(true);
							compressedData1 = compressor1.compressBlock(inputString);
							compressedData2 = compressor2.compressBlock(inputString);
						})

						it("Compresses correctly with simple hash table", () => {
							expect(decompress(compressedData1)).toEqual(inputString);
							expect(compressedData1.length).toBeLessThan(encodeUTF8(inputString).length);
						});

						it("Compresses correctly with custom hash table", () => {
							expect(decompress(compressedData2)).toEqual(inputString);
							expect(compressedData2.length).toBeLessThan(encodeUTF8(inputString).length);
						});

						it("Outputs the exact same data for both the simple and custom hash tables", () => {
							expect(compressedData1).toEqual(compressedData2);
						});

						it("Creates a simple hash table with a bucket count larger than 0", () => {
							expect(compressor1.prefixHashTable.getUsedBucketCount()).toBeGreaterThan(0);
						});

						it("Creates a custom hash table with a bucket count larger than 0", () => {
							expect(compressor2.prefixHashTable.getUsedBucketCount()).toBeGreaterThan(0);
						});

						it("Both the simple and custom hash tables have the same bucket usage", () => {
							expect(compressor1.prefixHashTable.getUsedBucketCount()).toEqual(compressor2.prefixHashTable.getUsedBucketCount());
						});

						it("Both the simple and custom hash tables have the same total element count", () => {
							expect(compressor1.prefixHashTable.getTotalElementCount()).toEqual(compressor2.prefixHashTable.getTotalElementCount());
						});
					});

					describe("Multi-part compression/decompression:", () => {
						it("Compresses and decompresses correctly when input and output are divided into multiple arbitrary parts", () => {
							const inputStringAsUTF8 = encodeUTF8(inputString);
							const part1 = inputStringAsUTF8.subarray(0, Math.floor(inputStringAsUTF8.length * 0.377345));
							const part2 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.377345), Math.floor(inputStringAsUTF8.length * 0.377345) + 2);
							const part3 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.377345) + 2, Math.floor(inputStringAsUTF8.length * 0.719283471));
							const part4 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.719283471), Math.floor(inputStringAsUTF8.length * 0.822345178225));
							const part5 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.822345178225));

							const compressor = new Compressor();
							const compressedData1 = compressor.compressBlock(part1);
							const compressedData2 = compressor.compressBlock(part2);
							const compressedData3 = compressor.compressBlock(part3);
							const compressedData4 = compressor.compressBlock(part4);
							const compressedData5 = compressor.compressBlock(part5);

							const joinedCompressedData = ArrayTools.concatUint8Arrays([compressedData1, compressedData2, compressedData3, compressedData4, compressedData5]);

							const decompressor = new Decompressor();
							const decompressedString1 = decompressor.decompressBlockToString(joinedCompressedData.subarray(0, Math.floor(joinedCompressedData.length * 0.2123684521)));
							const decompressedString2 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.2123684521), Math.floor(joinedCompressedData.length * 0.41218346219)));
							const decompressedString3 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.41218346219), Math.floor(joinedCompressedData.length * 0.74129384652)));
							const decompressedString4 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.74129384652), Math.floor(joinedCompressedData.length * 0.74129384652) + 2));
							const decompressedString5 = decompressor.decompressBlockToString(new Uint8Array(0));
							const decompressedString6 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.74129384652) + 2, Math.floor(joinedCompressedData.length * 0.9191234791281724)));
							const decompressedString7 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.9191234791281724)));

							expect(decompressedString1 + decompressedString2 + decompressedString3 + decompressedString4 + decompressedString5 + decompressedString6 + decompressedString7).toEqual(inputString);
						});

						it("Compresses and decompresses correctly when input and output are divided into hundreds of small random parts", () => {
							const truncatedLength = 5001;
							const truncatedInputString = truncateUTF16String(inputString, truncatedLength);
							const input = encodeUTF8(truncatedInputString);
							const compressor = new Compressor();

							const compressedParts: Uint8Array[] = [];
							for (let offset = 0; offset < input.length;) {
								const randomLength = Math.floor(Math.random() * 4);
								const endOffset = Math.min(offset + randomLength, input.length);

								const part = compressor.compressBlock(input.subarray(offset, endOffset));
								compressedParts.push(part);
								offset += randomLength;
							}

							const joinedCompressedParts = ArrayTools.concatUint8Arrays(compressedParts);

							const decompressor = new Decompressor();

							const decompressedParts: Uint8Array[] = [];
							for (let offset = 0; offset < input.length;) {
								expect(joinedCompressedParts).toBeDefined();

								const randomLength = Math.floor(Math.random() * 4);
								const endOffset = Math.min(offset + randomLength, joinedCompressedParts.length);
								const part = decompressor.decompressBlock(joinedCompressedParts.subarray(offset, endOffset));

								expect(() => Encoding.UTF8.decode(part)).not.toThrow(); // Make sure the part is a valid and untruncated UTF-8 sequence

								decompressedParts.push(part);
								offset += randomLength;
							}

							const joinedDecompressedParts = ArrayTools.concatUint8Arrays(decompressedParts);

							expect(decodeUTF8(joinedDecompressedParts)).toEqual(truncatedInputString);
						});
					});

					describe("Special properties:", () => {
						it("Will decompresses the uncompressed string to itself (assuring UTF-8 backwards compatibility)", () => {
							const decompressedUncompressedString = decompress(encodeUTF8(inputString));

							expect(decompressedUncompressedString).toEqual(inputString);
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

		describe("Synchronous operations with different input and output encodings", () => {
			const sourceAsString = TestData.hindiText.substr(0, 100);
			const sourceAsByteArray = encodeUTF8(sourceAsString);

			function addTestForEncodingCombination(testedSourceEncoding: string, testedCompressedEncoding: CompressedEncoding, testedDecompressedEncoding: UncompressedEncoding) {
				it("Successfuly compresses a " + testedSourceEncoding + " to a " + testedCompressedEncoding + " and decompresses to a " + testedDecompressedEncoding, () => {
					let source: string | Uint8Array;

					if (testedSourceEncoding == "String")
						source = sourceAsString;
					else
						source = sourceAsByteArray;

					const compressedData = compress(source, { outputEncoding: testedCompressedEncoding });

					expect(verifyEncoding(compressedData, testedCompressedEncoding)).toBe(true);

					const decompressedData = decompress(compressedData, { inputEncoding: testedCompressedEncoding, outputEncoding: testedDecompressedEncoding });

					if (testedDecompressedEncoding == "String")
						expect(decompressedData).toEqual(sourceAsString);
					else if (testedDecompressedEncoding == "ByteArray")
						expect(decompressedData).toEqual(sourceAsByteArray);
				});
			}

			addTestForEncodingCombination("String", "ByteArray", "String");
			addTestForEncodingCombination("String", "ByteArray", "ByteArray");
			addTestForEncodingCombination("String", "BinaryString", "String");
			addTestForEncodingCombination("String", "BinaryString", "ByteArray");
			addTestForEncodingCombination("String", "Base64", "String");
			addTestForEncodingCombination("String", "Base64", "ByteArray");

			if (runningInNodeJS()) {
				addTestForEncodingCombination("String", "Buffer", "String");
				addTestForEncodingCombination("String", "Buffer", "ByteArray");
			}

			addTestForEncodingCombination("ByteArray", "ByteArray", "String");
			addTestForEncodingCombination("ByteArray", "ByteArray", "ByteArray");
			addTestForEncodingCombination("ByteArray", "BinaryString", "String");
			addTestForEncodingCombination("ByteArray", "BinaryString", "ByteArray");
			addTestForEncodingCombination("ByteArray", "Base64", "String");
			addTestForEncodingCombination("ByteArray", "Base64", "ByteArray");

			if (runningInNodeJS()) {
				addTestForEncodingCombination("ByteArray", "Buffer", "String");
				addTestForEncodingCombination("ByteArray", "Buffer", "ByteArray");
			}
		});

		describe("Asynchronous operations with different input and output encodings:", () => {
			const sourceAsString = TestData.hindiText.substr(0, 100);
			const sourceAsByteArray = encodeUTF8(sourceAsString);

			function addTestForEncodingCombination(testedSourceEncoding: string, testedCompressedEncoding: CompressedEncoding, testedDecompressedEncoding: UncompressedEncoding, webWorkerEnabled?: boolean) {
				it("Successfuly compresses a " + testedSourceEncoding + " to a " + testedCompressedEncoding + " and decompresses to a " + testedDecompressedEncoding, (done) => {
					let source: any;
					if (testedSourceEncoding == "String")
						source = sourceAsString;
					else
						source = sourceAsByteArray;

					compressAsync(source, { outputEncoding: testedCompressedEncoding, useWebWorker: webWorkerEnabled, blockSize: 31 }, (compressedData) => {
						expect(verifyEncoding(compressedData, testedCompressedEncoding)).toBe(true);

						decompressAsync(compressedData!, { inputEncoding: testedCompressedEncoding, outputEncoding: testedDecompressedEncoding, useWebWorker: webWorkerEnabled, blockSize: 23 }, (decompressedData) => {
							if (testedDecompressedEncoding == "String")
								expect(decompressedData).toEqual(sourceAsString);
							else if (testedDecompressedEncoding == "ByteArray")
								expect(decompressedData).toEqual(sourceAsByteArray);

							done();
						});
					});
				});
			}

			// Async tests without web worker
			describe("Without web worker:", () => {
				addTestForEncodingCombination("String", "ByteArray", "String", false);
				addTestForEncodingCombination("String", "ByteArray", "ByteArray", false);
				addTestForEncodingCombination("String", "BinaryString", "String", false);
				addTestForEncodingCombination("String", "BinaryString", "ByteArray", false);
				addTestForEncodingCombination("String", "Base64", "String", false);
				addTestForEncodingCombination("String", "Base64", "ByteArray", false);

				if (runningInNodeJS()) {
					addTestForEncodingCombination("String", "Buffer", "String", false);
					addTestForEncodingCombination("String", "Buffer", "ByteArray", false);
				}

				addTestForEncodingCombination("ByteArray", "ByteArray", "String", false);
				addTestForEncodingCombination("ByteArray", "ByteArray", "ByteArray", false);
				addTestForEncodingCombination("ByteArray", "BinaryString", "String", false);
				addTestForEncodingCombination("ByteArray", "BinaryString", "ByteArray", false);
				addTestForEncodingCombination("ByteArray", "Base64", "String", false);
				addTestForEncodingCombination("ByteArray", "Base64", "ByteArray", false);

				if (runningInNodeJS()) {
					addTestForEncodingCombination("ByteArray", "Buffer", "String", false);
					addTestForEncodingCombination("ByteArray", "Buffer", "ByteArray", false);
				}
			});

			describe("With web worker (if supported):", () => {
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

			describe("With automatic setting for web worker:", () => {
				addTestForEncodingCombination("String", "ByteArray", "String", undefined);
				addTestForEncodingCombination("String", "ByteArray", "ByteArray", undefined);
				addTestForEncodingCombination("String", "BinaryString", "String", undefined);
				addTestForEncodingCombination("String", "BinaryString", "ByteArray", undefined);
				addTestForEncodingCombination("String", "Base64", "String", undefined);
				addTestForEncodingCombination("String", "Base64", "ByteArray", undefined);

				if (runningInNodeJS()) {
					addTestForEncodingCombination("String", "Buffer", "String", undefined);
					addTestForEncodingCombination("String", "Buffer", "ByteArray", undefined);
				}

				addTestForEncodingCombination("ByteArray", "ByteArray", "String", undefined);
				addTestForEncodingCombination("ByteArray", "ByteArray", "ByteArray", undefined);
				addTestForEncodingCombination("ByteArray", "BinaryString", "String", undefined);
				addTestForEncodingCombination("ByteArray", "BinaryString", "ByteArray", undefined);
				addTestForEncodingCombination("ByteArray", "Base64", "String", undefined);
				addTestForEncodingCombination("ByteArray", "Base64", "ByteArray", undefined);

				if (runningInNodeJS()) {
					addTestForEncodingCombination("ByteArray", "Buffer", "String", undefined);
					addTestForEncodingCombination("ByteArray", "Buffer", "ByteArray", undefined);
				}
			});

			describe("Simultanous async operations:", () => {
				const randomString1 = Random.getRandomUTF16StringOfLength(1001);
				const randomString2 = Random.getRandomUTF16StringOfLength(1301);

				it("Successfuly compconstes two async operation started in parallel (without web worker)", (done) => {
					let firstIsDone = false;
					let secondIsDone = false;

					compressAsync(randomString1, { blockSize: 221, useWebWorker: false }, (result) => {
						expect(decompress(result!)).toEqual(randomString1);
						firstIsDone = true;

						if (secondIsDone)
							done();
					});

					compressAsync(randomString2, { blockSize: 321, useWebWorker: false }, (result) => {
						expect(decompress(result!)).toEqual(randomString2);
						secondIsDone = true;

						if (firstIsDone)
							done();
					});
				});

				it("Successfuly executes two async operation started in parallel (with web worker if supported)", (done) => {
					let firstIsDone = false;
					let secondIsDone = false;

					compressAsync(TestData.chineseText, { useWebWorker: true }, (result) => {
						expect(decompress(result!)).toEqual(TestData.chineseText);
						firstIsDone = true;

						if (secondIsDone)
							done();
					});

					compressAsync(TestData.loremIpsum, { useWebWorker: true }, (result) => {
						expect(decompress(result!)).toEqual(TestData.loremIpsum);
						secondIsDone = true;

						if (firstIsDone)
							done();
					});
				});
			});

			describe("Async operations with a custom web worker URI", () => {
				beforeEach(() => {
					WebWorker.terminate();
					WebWorker.scriptURI = "../build/development/lzutf8.js";
				});

				afterEach(() => {
					WebWorker.terminate();
					WebWorker.scriptURI = undefined;
				});


				if (WebWorker.createGlobalWorkerIfNeeded()) {
					addTestForEncodingCombination("ByteArray", "BinaryString", "String", true);
				}
			});
		});

		describe("Error handling:", () => {
			it("Throws on undefined or null input for synchronous compression and decompression", () => {
				expect(() => compress(<any> undefined)).toThrow();
				expect(() => compress(<any> null)).toThrow();
				expect(() => decompress(<any> undefined)).toThrow();
				expect(() => decompress(<any> null)).toThrow();

				const compressor = new Compressor();
				expect(() => compressor.compressBlock(<any> undefined)).toThrow();
				expect(() => compressor.compressBlock(<any> null)).toThrow();

				const decompressor = new Decompressor();
				expect(() => decompressor.decompressBlock(<any> undefined)).toThrow();
				expect(() => decompressor.decompressBlock(<any> null)).toThrow();

			});

			// Async with web workers
			it("Invokes callback with error for undefined input in asynchronous compression (with web workers)", (done) => {
				compressAsync(<any> undefined, { useWebWorker: true }, (result, error) => {
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});

			it("Invokes callback with error for invalid input type in asynchronous compression (with web workers)", (done) => {
				compressAsync(<any> new Date(), { useWebWorker: true }, (result, error) => {
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});

			it("Invokes callback with error for undefined input in asynchronous decompression (with web workers)", (done) => {
				decompressAsync(<any> undefined, { useWebWorker: true }, (result, error) => {
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});

			it("Invokes callback with error for invalid input type in asynchronous decompression (with web workers)", (done) => {
				decompressAsync(<any> new Date(), { inputEncoding: "Base64", useWebWorker: true }, (result, error) => {
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});

			// Async without web workers
			it("Invokes callback with error for undefined input in asynchronous compression (without web workers)", (done) => {
				compressAsync(<any> undefined, { useWebWorker: false }, (result, error) => {
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});

			it("Invokes callback with error for invalid input type in asynchronous compression (without web workers)", (done) => {
				compressAsync(<any> new Date(), { useWebWorker: false }, (result, error) => {
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});

			it("Invokes callback with error for undefined input in asynchronous decompression (without web workers)", (done) => {
				decompressAsync(<any> undefined, { useWebWorker: false }, (result, error) => {
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});

			it("Invokes callback with error for invalid input type in asynchronous decompression (without web workers)", (done) => {
				decompressAsync(<any> new Date(), { inputEncoding: "Base64", useWebWorker: false }, (result, error) => {
					expect(result).toBe(undefined);
					expect(error).toBeDefined();
					done();
				});
			});
		});

		describe("Trivial cases:", () => {
			it("Handles zero length input for compression and decompression", () => {
				expect(compress(new Uint8Array(0))).toEqual(new Uint8Array(0));

				expect(decompress(new Uint8Array(0))).toEqual("");
				expect(decompress(new Uint8Array(0), { outputEncoding: "ByteArray" })).toEqual(new Uint8Array(0));

				const compressor = new Compressor();
				expect(compressor.compressBlock(new Uint8Array(0))).toEqual(new Uint8Array(0));

				const decompressor = new Decompressor();
				expect(decompressor.decompressBlock(new Uint8Array(0))).toEqual(new Uint8Array(0));
				expect(decompressor.decompressBlockToString(new Uint8Array(0))).toEqual("");
			});

			if (runningInNodeJS()) {
				it("Automatically converts Buffers to Uint8Arrays (sync)", () => {
					const compressedText = compress(new Buffer(TestData.loremIpsum));
					const decompressedText = decompress(new Buffer(<Uint8Array>compressedText));

					expect(decompressedText).toEqual(TestData.loremIpsum);
				});

				it("Automatically converts Buffers to Uint8Arrays (sync, incremental)", () => {
					const compressor = new Compressor();
					const compressedText = compressor.compressBlock(<any>new Buffer(TestData.loremIpsum));

					const decompressor = new Decompressor();
					const decompressedText = decompressor.decompressBlock(<any>new Buffer(compressedText));

					expect(decodeUTF8(decompressedText)).toEqual(TestData.loremIpsum);
				});

				it("Automatically converts Buffers to Uint8Arrays (async)", (done) => {
					compressAsync(new Buffer(TestData.loremIpsum), {}, (compressedText) => {
						decompressAsync(new Buffer(<any> compressedText), {}, (decompressedText) => {
							expect(decompressedText).toEqual(TestData.loremIpsum);
							done();
						});
					});
				});

			}
		});


		describe("Special bytestream features:", () => {
			it("Allows concatenation of multiple compressed and uncompressed streams to a single, valid compressed stream", () => {
				const compressdData1 = compress(TestData.chineseText);
				const rawData = encodeUTF8(TestData.hindiText);
				const compressedData2 = compress(TestData.chineseText);
				const compressedData3 = compress(TestData.loremIpsum);

				const mixedData = ArrayTools.concatUint8Arrays(<Uint8Array[]>[compressdData1, rawData, compressedData2, compressedData3]);

				const decompressedMixedData = decompress(mixedData);
				expect(decompressedMixedData).toEqual(TestData.chineseText + TestData.hindiText + TestData.chineseText + TestData.loremIpsum);
			});
		});

		if (runningInNodeJS()) {
			describe("Node.js streams integration:", () => {
				it("Correctly compresses and decompresses through streams", (done: Function) => {
					const compressionStream = createCompressionStream();
					const decompressionStream = createDecompressionStream();

					compressionStream.pipe(decompressionStream);
					compressionStream.write(TestData.hindiText);

					decompressionStream.on("readable", () => {
						const result = decompressionStream.read().toString("utf8");
						expect(result).toEqual(TestData.hindiText);
						done();
					});
				});
			});
		}
	});
}
