namespace LZUTF8 {
	export namespace Encoding {
		export namespace UTF8 {
			declare const TextEncoder: any;
			declare const TextDecoder: any;
			let nativeTextEncoder: any;
			let nativeTextDecoder: any;

			export const encode = function (str: string): Uint8Array {
				if (!str || str.length == 0)
					return new Uint8Array(0);

				if (runningInNodeJS()) {
					return BufferTools.bufferToUint8Array(new Buffer(str, "utf8"));
				}
				else if (createNativeTextEncoderAndDecoderIfAvailable()) {
					return nativeTextEncoder.encode(str);
				}
				else {
					return encodeWithJS(str);
				}
			}

			export const decode = function (utf8Bytes: Uint8Array): string {
				if (!utf8Bytes || utf8Bytes.length == 0)
					return "";

				if (runningInNodeJS()) {
					return BufferTools.uint8ArrayToBuffer(utf8Bytes).toString("utf8");
				}
				else if (createNativeTextEncoderAndDecoderIfAvailable()) {
					return nativeTextDecoder.decode(utf8Bytes);
				}
				else {
					return decodeWithJS(utf8Bytes);
				}
			}

			export const encodeWithJS = function (str: string, outputArray?: Uint8Array): Uint8Array {
				if (!str || str.length == 0)
					return new Uint8Array(0);

				if (!outputArray)
					outputArray = new Uint8Array(str.length * 4);

				let writeIndex = 0;

				for (let readIndex = 0; readIndex < str.length; readIndex++) {
					const charCode = CodePoint.encodeFromString(str, readIndex);

					if (charCode <= 0x7F) {
						outputArray[writeIndex++] = charCode;
					}
					else if (charCode <= 0x7FF) {
						outputArray[writeIndex++] = 0xC0 | (charCode >>> 6);
						outputArray[writeIndex++] = 0x80 | (charCode & 63);
					}
					else if (charCode <= 0xFFFF) {
						outputArray[writeIndex++] = 0xE0 | (charCode >>> 12);
						outputArray[writeIndex++] = 0x80 | ((charCode >>> 6) & 63);
						outputArray[writeIndex++] = 0x80 | (charCode & 63);
					}
					else if (charCode <= 0x10FFFF) {
						outputArray[writeIndex++] = 0xF0 | (charCode >>> 18);
						outputArray[writeIndex++] = 0x80 | ((charCode >>> 12) & 63);
						outputArray[writeIndex++] = 0x80 | ((charCode >>> 6) & 63);
						outputArray[writeIndex++] = 0x80 | (charCode & 63);

						readIndex++; // A character outside the BMP had to be made from two surrogate characters
					}
					else
						throw new Error("Invalid UCS-2 string: Encountered a character unsupported by UTF-8/16 (RFC 3629)");
				}

				return outputArray.subarray(0, writeIndex);
			}

			export const decodeWithJS = function (utf8Bytes: Uint8Array, startOffset = 0, endOffset?: number): string {
				if (!utf8Bytes || utf8Bytes.length == 0)
					return "";

				if (endOffset === undefined)
					endOffset = utf8Bytes.length;

				const output = new StringBuilder();

				let outputCodePoint: number;
				let leadByte: number;

				for (let readIndex = startOffset, length = endOffset; readIndex < length;) {
					leadByte = utf8Bytes[readIndex];

					if ((leadByte >>> 7) === 0) {
						outputCodePoint = leadByte;
						readIndex += 1;
					}
					else if ((leadByte >>> 5) === 6) {
						if (readIndex + 1 >= endOffset)
							throw new Error("Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);

						outputCodePoint = ((leadByte & 31) << 6) | (utf8Bytes[readIndex + 1] & 63);
						readIndex += 2;
					}
					else if ((leadByte >>> 4) === 14) {
						if (readIndex + 2 >= endOffset)
							throw new Error("Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);

						outputCodePoint = ((leadByte & 15) << 12) | ((utf8Bytes[readIndex + 1] & 63) << 6) | (utf8Bytes[readIndex + 2] & 63);
						readIndex += 3;
					}
					else if ((leadByte >>> 3) === 30) {
						if (readIndex + 3 >= endOffset)
							throw new Error("Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);

						outputCodePoint = ((leadByte & 7) << 18) | ((utf8Bytes[readIndex + 1] & 63) << 12) | ((utf8Bytes[readIndex + 2] & 63) << 6) | (utf8Bytes[readIndex + 3] & 63);
						readIndex += 4;
					}
					else
						throw new Error("Invalid UTF-8 stream: An invalid lead byte value encountered at position " + readIndex);

					output.appendCodePoint(outputCodePoint);
				}

				return output.getOutputString();
			}

			export const createNativeTextEncoderAndDecoderIfAvailable = function (): boolean {
				if (nativeTextEncoder)
					return true;

				if (typeof TextEncoder == "function") {
					nativeTextEncoder = new TextEncoder("utf-8");
					nativeTextDecoder = new TextDecoder("utf-8");

					return true;
				}
				else
					return false;
			}
		}
	}
}
