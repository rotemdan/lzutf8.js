namespace LZUTF8 {
	describe("Encodings:", () => {
		describe("BinaryString", () => {
			it("Encodes and decodes a simple set of bytes", () => {
				const bytes = new Uint8Array([1, 2, 3, 4, 5])
				const encodedString = Encoding.BinaryString.encode(bytes);
				const decodedValues = Encoding.BinaryString.decode(encodedString);

				expect(decodedValues).toEqual(bytes);
				expect(verifyEncoding(encodedString, "BinaryString")).toBe(true);
			});

			it("Encodes and decodes random bytes", () => {
				for (let j = 0; j < 100; j++) {
					for (let i = 0; i < 100; i++) {
						const randomValues = new Uint8Array(Random.getRandomIntegerArrayOfLength(i, 0, 256));
						const encodedString = Encoding.BinaryString.encode(randomValues);
						const decodedValues = Encoding.BinaryString.decode(encodedString);

						expect(randomValues).toEqual(decodedValues);
						expect(verifyEncoding(encodedString, "BinaryString")).toBe(true);
					}
				}
			});

			it("Decodes concatenated binary strings correctly", () => {
				for (let j = 0; j < 100; j++) {
					for (let i = 0; i < 100; i++) {
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

						let joinedRandomValues = ArrayTools.concatUint8Arrays([randomValues1, randomValues2, randomValues3, randomValues4, randomValues5]);

						expect(decodedConcatenatedStrings).toEqual(joinedRandomValues);
					}
				}
			});

			it("Handles undefined, null or empty arrays (encoding)", () => {
				expect(() => encodeBinaryString(<any> undefined)).toThrow();
				expect(() => encodeBinaryString(<any> null)).toThrow();
				expect(encodeBinaryString(new Uint8Array(0))).toEqual("");
			});

			it("Handles undefined, null or empty strings (decoding)", () => {
				expect(() => decodeBinaryString(<any> undefined)).toThrow();
				expect(() => decodeBinaryString(<any> null)).toThrow();
				expect(decodeBinaryString("")).toEqual(new Uint8Array(0));
			});
		});
	});
}
