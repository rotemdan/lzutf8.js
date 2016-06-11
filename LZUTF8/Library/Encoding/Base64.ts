namespace LZUTF8
{
	export namespace Encoding
	{
		export class Base64
		{
			static encode(inputArray: Uint8Array, addPadding = true): string
			{
				if (inputArray == null)
					throw new TypeError("Base64.encode: invalid input type");

				if (inputArray.length == 0)
					return "";

				let map = Encoding.Base64.charCodeMap;

				let output = new StringBuilder();
				let uint24: number;

				for (let readPosition = 0, length = inputArray.length; readPosition < length; readPosition += 3)
				{
					if (readPosition <= length - 3)
					{
						uint24 = inputArray[readPosition] << 16 | inputArray[readPosition + 1] << 8 | inputArray[readPosition + 2];

						output.append(map[(uint24 >>> 18) & 63]);
						output.append(map[(uint24 >>> 12) & 63]);
						output.append(map[(uint24 >>> 6) & 63]);
						output.append(map[(uint24) & 63]);

						uint24 = 0;
					}
					else if (readPosition === length - 2)
					// If two bytes are left, output 3 encoded characters and one padding character
					{
						uint24 = inputArray[readPosition] << 16 | inputArray[readPosition + 1] << 8;

						output.append(map[(uint24 >>> 18) & 63]);
						output.append(map[(uint24 >>> 12) & 63]);
						output.append(map[(uint24 >>> 6) & 63]);

						if (addPadding)
							output.append(Encoding.Base64.paddingCharCode);
					}
					else if (readPosition === length - 1)
					// Arrived at last byte at a position that did not complete a full 3 byte set
					{
						uint24 = inputArray[readPosition] << 16;

						output.append(map[(uint24 >>> 18) & 63]);
						output.append(map[(uint24 >>> 12) & 63]);

						if (addPadding)
						{
							output.append(Encoding.Base64.paddingCharCode);
							output.append(Encoding.Base64.paddingCharCode);
						}
					}
				}

				return output.toString();
			}

			static decode(base64String: string, outputBuffer?: Uint8Array): Uint8Array
			{
				if (typeof base64String !== "string")
					throw new TypeError("Base64.decode: invalid input type");

				if (base64String.length === 0)
					return new Uint8Array(0);

				// Add padding if omitted
				let lengthModulo4 = base64String.length % 4;

				if (lengthModulo4 === 1)
					throw new Error("Invalid Base64 string: length % 4 == 1");
				else if (lengthModulo4 === 2)
					base64String += Encoding.Base64.paddingCharacter + Encoding.Base64.paddingCharacter;
				else if (lengthModulo4 === 3)
					base64String += Encoding.Base64.paddingCharacter;

				let reverseCharCodeMap = Encoding.Base64.reverseCharCodeMap;

				if (!outputBuffer)
					outputBuffer = new Uint8Array(base64String.length);

				let outputPosition = 0;
				let length = base64String.length;

				for (let i = 0; i < length; i += 4)
				{
					let uint24 = (reverseCharCodeMap[base64String.charCodeAt(i)] << 18) |
						(reverseCharCodeMap[base64String.charCodeAt(i + 1)] << 12) |
						(reverseCharCodeMap[base64String.charCodeAt(i + 2)] << 6) |
						(reverseCharCodeMap[base64String.charCodeAt(i + 3)]);

					outputBuffer[outputPosition++] = (uint24 >>> 16) & 255;
					outputBuffer[outputPosition++] = (uint24 >>> 8) & 255;
					outputBuffer[outputPosition++] = (uint24) & 255;
				}

				// Remove 1 or 2 last bytes if padding characters were added to the string
				if (base64String.charAt(length - 1) == Encoding.Base64.paddingCharacter)
					outputPosition--;

				if (base64String.charAt(length - 2) == Encoding.Base64.paddingCharacter)
					outputPosition--;

				return outputBuffer.subarray(0, outputPosition);
			}

			private static paddingCharacter = '=';
			private static charCodeMap: Uint8Array = new Uint8Array([65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 43, 47]);
			private static paddingCharCode = 61;
			private static reverseCharCodeMap: Uint8Array = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 255, 255, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255, 255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 255, 255, 255, 255]);
		}

	}
}