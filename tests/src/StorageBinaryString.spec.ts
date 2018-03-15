namespace LZUTF8 {
	describe("Encodings:", () => {
		describe("StorageBinaryString", () => {
			it("Encodes and decodes a simple set of bytes", () => {
				const bytes = new Uint8Array([1, 2, 3, 4, 5])
				const encodedString = Encoding.StorageBinaryString.encode(bytes);
				const decodedValues = Encoding.StorageBinaryString.decode(encodedString);

				expect(decodedValues).toEqual(bytes);
				expect(verifyEncoding(encodedString, "StorageBinaryString")).toBe(true);
			});

			it("Encodes and decodes random bytes", () => {
				for (let j = 0; j < 100; j++) {
					for (let i = 0; i < 100; i++) {
						const randomValues = new Uint8Array(Random.getRandomIntegerArrayOfLength(i, 0, 256));
						const encodedString = Encoding.StorageBinaryString.encode(randomValues);
						const decodedValues = Encoding.StorageBinaryString.decode(encodedString);

						expect(verifyEncoding(encodedString, "StorageBinaryString")).toBe(true);
						expect(randomValues).toEqual(decodedValues);
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

						let encodedString1: string = Encoding.StorageBinaryString.encode(randomValues1);
						let encodedString2: string = Encoding.StorageBinaryString.encode(randomValues2);
						let encodedString3: string = Encoding.StorageBinaryString.encode(randomValues3);
						let encodedString4: string = Encoding.StorageBinaryString.encode(randomValues4);
						let encodedString5: string = Encoding.StorageBinaryString.encode(randomValues5);

						let decodedConcatenatedStrings = Encoding.StorageBinaryString.decode(encodedString1 + encodedString2 + encodedString3 + encodedString4 + encodedString5);

						let joinedRandomValues = ArrayTools.concatUint8Arrays([randomValues1, randomValues2, randomValues3, randomValues4, randomValues5]);

						expect(decodedConcatenatedStrings).toEqual(joinedRandomValues);
					}
				}
			});

			it("Handles undefined, null or empty arrays (encoding)", () => {
				expect(() => encodeStorageBinaryString(<any>undefined)).toThrow();
				expect(() => encodeStorageBinaryString(<any>null)).toThrow();
				expect(encodeStorageBinaryString(new Uint8Array(0))).toEqual("");
			});

			it("Handles undefined, null or empty strings (decoding)", () => {
				expect(() => decodeStorageBinaryString(<any>undefined)).toThrow();
				expect(() => decodeStorageBinaryString(<any>null)).toThrow();
				expect(decodeStorageBinaryString("")).toEqual(new Uint8Array(0));
			});

			if (typeof sessionStorage !== "undefined") {
				it("Produces strings that can be stored in sessionStorage", () => {
					for (let i = 0; i< 1000; i++) {
						const randomBinaryData = new Uint8Array(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
						const encodedData = encodeStorageBinaryString(randomBinaryData);
						sessionStorage.setItem('lzutf8_test_storage_binary_string', encodedData);
						const readResult = sessionStorage.getItem('lzutf8_test_storage_binary_string');
						sessionStorage.removeItem('lzutf8_test_storage_binary_string');

						expect(readResult).toEqual(encodedData);
						expect(verifyEncoding(readResult, "StorageBinaryString")).toBe(true);
						expect(decodeStorageBinaryString(readResult!)).toEqual(randomBinaryData);
					}
				});
			}
		});
	});
}
