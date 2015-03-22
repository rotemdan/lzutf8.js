module LZUTF8
{
	export module Encoding
	{
		export class UTF8
		{
			static encode(str: string, outputArray?: ByteArray): ByteArray
			{
				if (!str || str.length == 0)
					return newByteArray(0);

				if (!outputArray)
					outputArray = newByteArray(str.length * 4);

				var writeIndex = 0;

				for (var readIndex = 0; readIndex < str.length; readIndex++)
				{
					var charCode = Encoding.UTF8.getUnicodeCodePoint(str, readIndex);

					if (charCode < 128)          // 0x7F + 1
					{
						outputArray[writeIndex++] = charCode;
					}
					else if (charCode < 2048)    // 0x7FF + 1
					{
						outputArray[writeIndex++] = 192 | (charCode >>> 6);
						outputArray[writeIndex++] = 128 | (charCode & 63);
					}
					else if (charCode < 65536)   // 0xFFFF + 1
					{
						outputArray[writeIndex++] = 224 | (charCode >>> 12);
						outputArray[writeIndex++] = 128 | ((charCode >>> 6) & 63);
						outputArray[writeIndex++] = 128 | (charCode & 63);
					}
					else if (charCode < 1114112) // 0x10FFFF + 1
					{
						outputArray[writeIndex++] = 240 | (charCode >>> 18);
						outputArray[writeIndex++] = 128 | ((charCode >>> 12) & 63);
						outputArray[writeIndex++] = 128 | ((charCode >>> 6) & 63);
						outputArray[writeIndex++] = 128 | (charCode & 63);

						readIndex++; // A character outside the BMP had to be made from two surrogate characters
					}
					else
						throw new Error("UTF8.encode: Invalid UTF-16 string: Encountered a character unsupported by UTF-8/16 (RFC 3629)");
				}

				return outputArray.subarray(0, writeIndex);
			}

			static decode(utf8Bytes: ByteArray): string
			{
				if (!utf8Bytes || utf8Bytes.length == 0)
					return "";

				var output = new StringBuilder();
				var outputCodePoint: number, leadByte: number;

				for (var readIndex = 0, length = utf8Bytes.length; readIndex < length;)
				{
					leadByte = utf8Bytes[readIndex];

					if ((leadByte >>> 7) === 0)
					{
						outputCodePoint = leadByte;
						readIndex += 1;
					}
					else if ((leadByte >>> 5) === 6)
					{
						if (readIndex + 1 >= length)
							throw new Error("UTF8.decode: Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);

						outputCodePoint = ((leadByte & 31) << 6) | (utf8Bytes[readIndex + 1] & 63);
						readIndex += 2;
					}
					else if ((leadByte >>> 4) === 14)
					{
						if (readIndex + 2 >= length)
							throw new Error("UTF8.decode: Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);

						outputCodePoint = ((leadByte & 15) << 12) | ((utf8Bytes[readIndex + 1] & 63) << 6) | (utf8Bytes[readIndex + 2] & 63);
						readIndex += 3;
					}
					else if ((leadByte >>> 3) === 30)
					{
						if (readIndex + 3 >= length)
							throw new Error("UTF8.decode: Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);

						outputCodePoint = ((leadByte & 7) << 18) | ((utf8Bytes[readIndex + 1] & 63) << 12) | ((utf8Bytes[readIndex + 2] & 63) << 6) | (utf8Bytes[readIndex + 3] & 63);
						readIndex += 4;
					}
					else
						throw new Error("UTF8.decode: Invalid UTF-8 stream: An invalid lead byte value encountered at position " + readIndex);

					output.appendCodePoint(outputCodePoint);
				}

				return output.toString();
			}

			static getUnicodeCodePoint(str: string, position: number): number
			{
				var charCode = str.charCodeAt(position);

				if (charCode < 0xD800 || charCode > 0xDBFF)
					return charCode;
				else
				{
					var nextCharCode = str.charCodeAt(position + 1);

					if (nextCharCode >= 0xDC00 && nextCharCode <= 0xDFFF)
						return 0x10000 + (((charCode - 0xD800) << 10) + (nextCharCode - 0xDC00));
					else
						throw new Error("getUnicodeCodePoint: Received a lead surrogate character not followed by a trailing one");
				}
			}

			static getStringFromUnicodeCodePoint(codePoint: number): string
			{
				if (codePoint <= 0xFFFF)
					return String.fromCharCode(codePoint);
				else if (codePoint <= 0x10FFFF)
					return String.fromCharCode(
						0xD800 + ((codePoint - 0x10000) >>> 10),
						0xDC00 + ((codePoint - 0x10000) & 1023));
				else
					throw new Error("getStringFromUnicodeCodePoint: A code point of " + codePoint + " cannot be encoded in UTF-16");
			}
		}
	}
} 