namespace LZUTF8 {
	export namespace CompressionCommon {
		export const getCroppedBuffer = function(buffer: Uint8Array, cropStartOffset: number, cropLength: number, additionalCapacity: number = 0): Uint8Array {
			let croppedBuffer = new Uint8Array(cropLength + additionalCapacity);
			croppedBuffer.set(buffer.subarray(cropStartOffset, cropStartOffset + cropLength));

			return croppedBuffer;
		}

		export const getCroppedAndAppendedByteArray = function(bytes: Uint8Array, cropStartOffset: number, cropLength: number, byteArrayToAppend: Uint8Array): Uint8Array {
			return ArrayTools.concatUint8Arrays([bytes.subarray(cropStartOffset, cropStartOffset + cropLength), byteArrayToAppend]);
		}

		export const detectCompressionSourceEncoding = function(input: string | Uint8Array | Buffer): UncompressedEncoding {
			if (input == null)
				throw new TypeError(`detectCompressionSourceEncoding: input is null or undefined`);

			if (typeof input === "string")
				return "String";
			else if (input instanceof Uint8Array || (typeof Buffer === "function" && Buffer.isBuffer(input)))
				return "ByteArray";
			else
				throw new TypeError(`detectCompressionSourceEncoding: input must be of type 'string', 'Uint8Array' or 'Buffer'`);
		}

		export const encodeCompressedBytes = function(compressedBytes: Uint8Array, outputEncoding: CompressedEncoding): Uint8Array | Buffer | string {
			switch (outputEncoding) {
				case "ByteArray":
					return compressedBytes;
				case "Buffer":
					return BufferTools.uint8ArrayToBuffer(compressedBytes);
				case "Base64":
					return encodeBase64(compressedBytes);
				case "BinaryString":
					return encodeBinaryString(compressedBytes);
				case "StorageBinaryString":
					return encodeStorageBinaryString(compressedBytes);
				default:
					throw new TypeError("encodeCompressedBytes: invalid output encoding requested");
			}
		}

		export const decodeCompressedBytes = function (compressedData: Uint8Array | Buffer | string, inputEncoding: CompressedEncoding): Uint8Array {
			if (inputEncoding == null)
				throw new TypeError("decodeCompressedData: Input is null or undefined");

			switch (inputEncoding) {
				case "ByteArray":
				case "Buffer":
					const normalizedBytes = BufferTools.convertToUint8ArrayIfNeeded(compressedData);

					if (!(normalizedBytes instanceof Uint8Array))
						throw new TypeError("decodeCompressedData: 'ByteArray' or 'Buffer' input type was specified but input is not a Uint8Array or Buffer");

					return normalizedBytes;
				case "Base64":
					if (typeof compressedData !== "string")
						throw new TypeError("decodeCompressedData: 'Base64' input type was specified but input is not a string");

					return decodeBase64(compressedData);
				case "BinaryString":
					if (typeof compressedData !== "string")
						throw new TypeError("decodeCompressedData: 'BinaryString' input type was specified but input is not a string");

					return decodeBinaryString(compressedData);
				case "StorageBinaryString":
					if (typeof compressedData !== "string")
						throw new TypeError("decodeCompressedData: 'StorageBinaryString' input type was specified but input is not a string");

					return decodeStorageBinaryString(compressedData);

				default:
					throw new TypeError(`decodeCompressedData: invalid input encoding requested: '${inputEncoding}'`);
			}
		}

		export const encodeDecompressedBytes = function(decompressedBytes: Uint8Array, outputEncoding: DecompressedEncoding): string | Uint8Array | Buffer {
			switch (outputEncoding) {
				case "String":
					return decodeUTF8(decompressedBytes);
				case "ByteArray":
					return decompressedBytes;
				case "Buffer":
					if (typeof Buffer !== "function")
						throw new TypeError("encodeDecompressedBytes: a 'Buffer' type was specified but is not supported at the current envirnment")

					return BufferTools.uint8ArrayToBuffer(decompressedBytes);
				default:
					throw new TypeError("encodeDecompressedBytes: invalid output encoding requested");
			}
		}
	}
}
