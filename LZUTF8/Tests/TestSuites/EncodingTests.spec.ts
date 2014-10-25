module LZUTF8
{
	describe("Encodings:", () =>
	{
		describe("UTF8:", () =>
		{
			if (runningInNodeJS())
			{

				it("Correctly encodes and decodes UTF8 strings, with output identical to the Node.js library", () =>
				{
					var charCount = 30000;
					var randomUTF16String = Random.getRandomUTF16StringOfLength(charCount);

					var nodeEncoding = encodeUTF8(randomUTF16String);
					var libraryEncoding = Encoding.UTF8.encode(randomUTF16String);

					expect(ArrayTools.compareSequences(libraryEncoding, nodeEncoding)).toEqual(true);

					var nodeDecoding = decodeUTF8(nodeEncoding)
					var libraryDecoding = Encoding.UTF8.decode(libraryEncoding);

					expect(nodeDecoding).toEqual(libraryDecoding);
					expect(libraryDecoding).toEqual(randomUTF16String);
				});
			}

			it("Accepts undefined, null or empty strings (encoding)", () =>
			{
				var emptyByteArray = newByteArray(0);

				expect(Encoding.UTF8.encode(undefined)).toEqual(emptyByteArray);
				expect(Encoding.UTF8.encode(null)).toEqual(emptyByteArray);
				expect(Encoding.UTF8.encode("")).toEqual(emptyByteArray);
			});

			it("Accepts undefined, null or empty arrays (decoding)", () =>
			{

				expect(Encoding.UTF8.decode(undefined)).toEqual("");
				expect(Encoding.UTF8.decode(null)).toEqual("");
				expect(Encoding.UTF8.decode(newByteArray(0))).toEqual("");
			});
		});

		describe("Base64:", () =>
		{
			it("Correctly encodes and decodes to base 64 (case 1)", () =>
			{
				var data = convertToByteArray([243, 121, 5, 57, 175, 27, 142, 3, 239, 212]);
				var base64 = Encoding.Base64.encode(data);
				expect(base64).toEqual("83kFOa8bjgPv1A==");
				expect(compareSequences(Encoding.Base64.decode(base64), data)).toBe(true);

				var base64 = Encoding.Base64.encode(data, false);
				expect(base64).toEqual("83kFOa8bjgPv1A");
				expect(compareSequences(Encoding.Base64.decode(base64), data)).toBe(true);
			});

			it("Correctly encodes and decodes to base 64 (case 2)", () =>
			{
				var data = convertToByteArray([145, 153, 99, 66, 151, 39, 228, 211, 88, 167, 15]);
				var base64 = Encoding.Base64.encode(data);
				expect(base64).toEqual("kZljQpcn5NNYpw8=");
				expect(compareSequences(Encoding.Base64.decode(base64), data)).toBe(true);

				var base64 = Encoding.Base64.encode(data, false);
				expect(base64).toEqual("kZljQpcn5NNYpw8");
				expect(compareSequences(Encoding.Base64.decode(base64), data)).toBe(true);
			});

			it("Accepts undefined, null or empty arrays (encoding)", () =>
			{
				var emptyByteArray = newByteArray(0);

				expect(Encoding.Base64.encode(undefined)).toEqual("");
				expect(Encoding.Base64.encode(null)).toEqual("");
				expect(Encoding.Base64.encode(newByteArray(0))).toEqual("");
			});

			it("Accepts undefined, null or empty strings (decoding)", () =>
			{
				var emptyByteArray = newByteArray(0);

				expect(Encoding.Base64.decode(undefined)).toEqual(emptyByteArray);
				expect(Encoding.Base64.decode(null)).toEqual(emptyByteArray);
				expect(Encoding.Base64.decode("")).toEqual(emptyByteArray);
			});

			if (runningInNodeJS())
			{
				it("Produces output equivalent to node.js library", () =>
				{
					for (var i = 0; i < 100; i++)
					{
						var randomBytes = convertToByteArray(Random.getRandomIntegerArrayOfLength(i, 0, 256));
						var libraryResult = Encoding.Base64.encode(randomBytes);
						var nodeResult = encodeBase64(randomBytes);

						expect(compareSequences(libraryResult, nodeResult)).toBe(true);
						expect(compareSequences(Encoding.Base64.decode(libraryResult), new Buffer(nodeResult, "base64"))).toBe(true);
					}
				});
			}

			it("Correctly decodes concatenated base64 strings", () =>
			{
				for (var j = 0; j < 10; j++)
				{
					for (var i = 0; i < 100; i++)
					{
						var randomValues1 = convertToByteArray(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						var randomValues2 = convertToByteArray(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						var randomValues3 = convertToByteArray(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						var randomValues4 = convertToByteArray(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						var randomValues5 = convertToByteArray(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));

						var encodedString1: string = encodeBase64(randomValues1);
						var encodedString2: string = encodeBase64(randomValues2);
						var encodedString3: string = encodeBase64(randomValues3);
						var encodedString4: string = encodeBase64(randomValues4);
						var encodedString5: string = encodeBase64(randomValues5);

						var decodedConcatenatedStrings = decodeConcatBase64(encodedString1 + encodedString2 + encodedString3 + encodedString4 + encodedString5);

						var joinedRandomValues = ArrayTools.joinByteArrays([randomValues1, randomValues2, randomValues3, randomValues4, randomValues5]);

						expect(compareSequences(decodedConcatenatedStrings, joinedRandomValues)).toBe(true);
					}
				}
			});
		});

		describe("BinaryString", () =>
		{
			it("Encodes and decodes random bytes correctly", () =>
			{
				for (var j = 0; j < 100; j++)
				{
					for (var i = 0; i < 100; i++)
					{
						var randomValues = Random.getRandomIntegerArrayOfLength(i, 0, 256);
						var encodedString: string = Encoding.BinaryString.encode(convertToByteArray(randomValues));
						var decodedValues = Encoding.BinaryString.decode(encodedString);

						expect(compareSequences(randomValues, decodedValues)).toBe(true);
						expect(verifyEncoding(encodedString, "BinaryString")).toBe(true);
					}
				}
			});

			it("Decodes concatenated binary strings correctly", () =>
			{
				for (var j = 0; j < 100; j++)
				{
					for (var i = 0; i < 100; i++)
					{
						var randomValues1 = convertToByteArray(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						var randomValues2 = convertToByteArray(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						var randomValues3 = convertToByteArray(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						var randomValues4 = convertToByteArray(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						var randomValues5 = convertToByteArray(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));

						var encodedString1: string = Encoding.BinaryString.encode(randomValues1);
						var encodedString2: string = Encoding.BinaryString.encode(randomValues2);
						var encodedString3: string = Encoding.BinaryString.encode(randomValues3);
						var encodedString4: string = Encoding.BinaryString.encode(randomValues4);
						var encodedString5: string = Encoding.BinaryString.encode(randomValues5);

						var decodedConcatenatedStrings = Encoding.BinaryString.decode(encodedString1 + encodedString2 + encodedString3 + encodedString4 + encodedString5);

						var joinedRandomValues = ArrayTools.joinByteArrays([randomValues1, randomValues2, randomValues3, randomValues4, randomValues5]);

						expect(compareSequences(decodedConcatenatedStrings, joinedRandomValues)).toBe(true);
					}
				}
			});

			it("Accepts undefined, null or empty arrays (encoding)", () =>
			{
				expect(encodeBinaryString(undefined)).toEqual("");
				expect(encodeBinaryString(null)).toEqual("");
				expect(encodeBinaryString(newByteArray(0))).toEqual("");
			});

			it("Accepts undefined, null or empty strings (decoding)", () =>
			{
				expect(decodeBinaryString(undefined)).toEqual(newByteArray(0));
				expect(decodeBinaryString(null)).toEqual(newByteArray(0));
				expect(decodeBinaryString("")).toEqual(newByteArray(0));
			});
		});
	});

	/*
	describe("CRC32:", () =>
	{
		it("Correctly calculates CRC32 for uint8 arrays", () =>
		{
			var checksum = CRC32.getChecksum(Encoding.decodeHex("22404c7bd311a5fd"))
			expect(checksum).toEqual(1436274127);

			var checksum = CRC32.getChecksum(Encoding.decodeHex("2b7e151628aed2a6abf7158809cf4f3c"))
			expect(checksum).toEqual(4142484572);

			var checksum = CRC32.getChecksum(Encoding.encodeUTF8("The quick brown fox jumps over the lazy dog"));
			expect(checksum).toEqual(1095738169);
		});
	});

	describe("Hex:", () =>
	{
		it("Correctly encodes and decodes to hex", () =>
		{
			var data = [34, 64, 76, 123, 211, 17];
			var hex = Encoding.encodeHex(new Uint8Array(data));
			expect(hex).toEqual("22404c7bd311");
			expect(ArrayTools.compareArrays(Encoding.decodeHex(hex), data)).toBe(true);
		});
		
		if (runningInNodeJS())
		{
			it("Produces output equivalent to node.js library", () =>
			{
				for (var i = 0; i < 100; i++)
				{
					var randomBytes = JSRandomGenerator.getRandomIntegerArrayOfLength(i, 0, 256);
					expect(Encoding.encodeHex(new Uint8Array(randomBytes))).toEqual((new Buffer(randomBytes)).toString("hex"));
				}
			});
		}
	});
	*/
}