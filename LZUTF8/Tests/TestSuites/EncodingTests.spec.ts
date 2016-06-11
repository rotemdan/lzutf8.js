namespace LZUTF8
{
	describe("Encodings:", () =>
	{
		describe("UTF8:", () =>
		{
			if (runningInNodeJS())
			{
				it("Correctly encodes and decodes UTF8 strings, with output identical to the Node.js library", () =>
				{
					let charCount = 30000;
					let randomUTF16String = Random.getRandomUTF16StringOfLength(charCount);

					let nodeEncoding = encodeUTF8(randomUTF16String);
					let libraryEncoding = Encoding.UTF8.encode(randomUTF16String);

					expect(ArrayTools.compareSequences(libraryEncoding, nodeEncoding)).toEqual(true);

					let nodeDecoding = decodeUTF8(nodeEncoding)
					let libraryDecoding = Encoding.UTF8.decode(libraryEncoding);

					expect(nodeDecoding).toEqual(libraryDecoding);
					expect(libraryDecoding).toEqual(randomUTF16String);
				});
			}

			it("Handles undefined, null or empty strings (encoding)", () =>
			{
				let emptyByteArray = new Uint8Array(0);

				expect(() => Encoding.UTF8.encode(undefined)).toThrow();
				expect(() => Encoding.UTF8.encode(null)).toThrow();
				expect(Encoding.UTF8.encode("")).toEqual(emptyByteArray);
			});

			it("Handles undefined, null or empty arrays (decoding)", () =>
			{
				expect(() => Encoding.UTF8.decode(undefined)).toThrow();
				expect(() => Encoding.UTF8.decode(null)).toThrow();
				expect(Encoding.UTF8.decode(new Uint8Array(0))).toEqual("");
			});
		});

		describe("Base64:", () =>
		{
			it("Correctly encodes and decodes to base 64 (case 1)", () =>
			{
				let data = new Uint8Array([243, 121, 5, 57, 175, 27, 142, 3, 239, 212]);
				let base64 = Encoding.Base64.encode(data);
				expect(base64).toEqual("83kFOa8bjgPv1A==");
				expect(compareSequences(Encoding.Base64.decode(base64), data)).toBe(true);

				base64 = Encoding.Base64.encode(data, false);
				expect(base64).toEqual("83kFOa8bjgPv1A");
				expect(compareSequences(Encoding.Base64.decode(base64), data)).toBe(true);
			});

			it("Correctly encodes and decodes to base 64 (case 2)", () =>
			{
				let data = new Uint8Array([145, 153, 99, 66, 151, 39, 228, 211, 88, 167, 15]);
				let base64 = Encoding.Base64.encode(data);
				expect(base64).toEqual("kZljQpcn5NNYpw8=");
				expect(compareSequences(Encoding.Base64.decode(base64), data)).toBe(true);

				base64 = Encoding.Base64.encode(data, false);
				expect(base64).toEqual("kZljQpcn5NNYpw8");
				expect(compareSequences(Encoding.Base64.decode(base64), data)).toBe(true);
			});

			it("Handles undefined, null or empty arrays (encoding)", () =>
			{
				let emptyByteArray = new Uint8Array(0);

				expect(() => Encoding.Base64.encode(undefined)).toThrow();
				expect(() => Encoding.Base64.encode(null)).toThrow();
				expect(Encoding.Base64.encode(new Uint8Array(0))).toEqual("");
			});

			it("Handles undefined, null or empty strings (decoding)", () =>
			{
				let emptyByteArray = new Uint8Array(0);

				expect(() => Encoding.Base64.decode(undefined)).toThrow();
				expect(() => Encoding.Base64.decode(null)).toThrow();
				expect(Encoding.Base64.decode("")).toEqual(emptyByteArray);
			});

			if (runningInNodeJS())
			{
				it("Produces output equivalent to node.js library", () =>
				{
					for (let i = 0; i < 100; i++)
					{
						let randomBytes = new Uint8Array(Random.getRandomIntegerArrayOfLength(i, 0, 256));
						let libraryResult = Encoding.Base64.encode(randomBytes);
						let nodeResult = encodeBase64(randomBytes);

						expect(compareSequences(libraryResult, nodeResult)).toBe(true);
						expect(compareSequences(Encoding.Base64.decode(libraryResult), new Buffer(nodeResult, "base64"))).toBe(true);
					}
				});
			}

			/*
			it("Correctly decodes concatenated base64 strings", () =>
			{
				for (let j = 0; j < 10; j++)
				{
					for (let i = 0; i < 100; i++)
					{
						let randomValues1 = convertToByteArray(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						let randomValues2 = convertToByteArray(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						let randomValues3 = convertToByteArray(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						let randomValues4 = convertToByteArray(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						let randomValues5 = convertToByteArray(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));

						let encodedString1: string = encodeBase64(randomValues1);
						let encodedString2: string = encodeBase64(randomValues2);
						let encodedString3: string = encodeBase64(randomValues3);
						let encodedString4: string = encodeBase64(randomValues4);
						let encodedString5: string = encodeBase64(randomValues5);

						let decodedConcatenatedStrings = decodeConcatenatedBase64(encodedString1 + encodedString2 + encodedString3 + encodedString4 + encodedString5);

						let joinedRandomValues = ArrayTools.joinByteArrays([randomValues1, randomValues2, randomValues3, randomValues4, randomValues5]);

						expect(compareSequences(decodedConcatenatedStrings, joinedRandomValues)).toBe(true);
					}
				}
			});
			*/
		});

		describe("BinaryString", () =>
		{
			it("Encodes and decodes random bytes correctly", () =>
			{
				for (let j = 0; j < 100; j++)
				{
					for (let i = 0; i < 100; i++)
					{
						let randomValues = Random.getRandomIntegerArrayOfLength(i, 0, 256);
						let encodedString: string = Encoding.BinaryString.encode(new Uint8Array(randomValues));
						let decodedValues = Encoding.BinaryString.decode(encodedString);

						expect(compareSequences(randomValues, decodedValues)).toBe(true);
						expect(verifyEncoding(encodedString, "BinaryString")).toBe(true);
					}
				}
			});

			it("Decodes concatenated binary strings correctly", () =>
			{
				for (let j = 0; j < 100; j++)
				{
					for (let i = 0; i < 100; i++)
					{
						let randomValues1 = new Uint8Array(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						let randomValues2 = new Uint8Array(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						let randomValues3 = new Uint8Array(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						let randomValues4 = new Uint8Array(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						let randomValues5 = new Uint8Array(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));

						let encodedString1: string = Encoding.BinaryString.encode(randomValues1);
						let encodedString2: string = Encoding.BinaryString.encode(randomValues2);
						let encodedString3: string = Encoding.BinaryString.encode(randomValues3);
						let encodedString4: string = Encoding.BinaryString.encode(randomValues4);
						let encodedString5: string = Encoding.BinaryString.encode(randomValues5);

						let decodedConcatenatedStrings = Encoding.BinaryString.decode(encodedString1 + encodedString2 + encodedString3 + encodedString4 + encodedString5);

						let joinedRandomValues = ArrayTools.joinByteArrays([randomValues1, randomValues2, randomValues3, randomValues4, randomValues5]);

						expect(compareSequences(decodedConcatenatedStrings, joinedRandomValues)).toBe(true);
					}
				}
			});

			it("Handles undefined, null or empty arrays (encoding)", () =>
			{
				expect(() => encodeBinaryString(undefined)).toThrow();
				expect(() => encodeBinaryString(null)).toThrow();
				expect(encodeBinaryString(new Uint8Array(0))).toEqual("");
			});

			it("Handles undefined, null or empty strings (decoding)", () =>
			{
				expect(() => decodeBinaryString(undefined)).toThrow();
				expect(() => decodeBinaryString(null)).toThrow();
				expect(decodeBinaryString("")).toEqual(new Uint8Array(0));
			});
		});
	});
}