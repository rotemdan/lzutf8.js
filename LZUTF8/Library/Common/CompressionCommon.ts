namespace LZUTF8
{
	export class CompressionCommon
	{
		static getCroppedBuffer(buffer: Uint8Array, cropStartOffset: number, cropLength: number, additionalCapacity: number = 0): Uint8Array
		{
			let croppedBuffer = new Uint8Array(cropLength + additionalCapacity);
			croppedBuffer.set(buffer.subarray(cropStartOffset, cropStartOffset + cropLength));

			return croppedBuffer;
		}

		static getCroppedAndAppendedBuffer(buffer: Uint8Array, cropStartOffset: number, cropLength: number, bufferToAppend: Uint8Array): Uint8Array
		{
			return ArrayTools.joinByteArrays([buffer.subarray(cropStartOffset, cropStartOffset + cropLength), bufferToAppend]);
		}

		static detectCompressionSourceEncoding(input: any): string
		{
			if (input == null)
				throw new TypeError(`detectCompressionSourceEncoding: input is null or undefined`);

			if (typeof input === "string")
				return "String";
			else if (input instanceof Uint8Array || (typeof Buffer === "function" && Buffer.isBuffer(input)))
				return "ByteArray";
			else
				throw new TypeError(`detectCompressionSourceEncoding: input must be of type 'string', 'Uint8Array' or 'Buffer'`);
		}

		static encodeCompressedBytes(compressedBytes: Uint8Array, outputEncoding: string): any
		{
			switch (outputEncoding)
			{
				case "ByteArray":
					return compressedBytes;
				case "Buffer":
					return ArrayTools.uint8ArrayToBuffer(compressedBytes);
				case "BinaryString":
					return encodeBinaryString(compressedBytes);
				case "Base64":
					return encodeBase64(compressedBytes);
				default:
					throw new TypeError("encodeCompressedBytes: invalid output encoding requested");
			}
		}

		static decodeCompressedData(compressedData: any, inputEncoding: string): Uint8Array
		{
			if (inputEncoding == null)
				throw new TypeError("decodeCompressedData: Input is null or undefined");

			switch (inputEncoding)
			{
				case "ByteArray":
					if (!(compressedData instanceof Uint8Array))
						throw new TypeError("decodeCompressedData: ByteArray input type was specified but input is not a Uint8Array");

					return compressedData;
				case "BinaryString":
					if (typeof compressedData !== "string")
						throw new TypeError("decodeCompressedData: BinaryString input type was specified but input is not a string");

					return decodeBinaryString(compressedData);
				case "Base64":
					if (typeof compressedData !== "string")
						throw new TypeError("decodeCompressedData: Base64 input type was specified but input is not a string");

					return decodeBase64(compressedData);
				default:
					throw new TypeError(`decodeCompressedData: invalid input encoding '${inputEncoding}' requested`);
			}
		}

		static encodeDecompressedBytes(decompressedBytes: Uint8Array, outputEncoding: string): any
		{
			switch (outputEncoding)
			{
				case "ByteArray":
					return decompressedBytes;
				case "Buffer":
					return ArrayTools.uint8ArrayToBuffer(decompressedBytes);
				case "String":
					return decodeUTF8(decompressedBytes);
				default:
					throw new TypeError("encodeDecompressedBytes: invalid output encoding requested");
			}
		}
	}

	export interface CompressorHashTable
	{
		addValueToBucket(bucketIndex: number, valueToAdd: number);
		getArraySegmentForBucketIndex(bucketIndex: number, outputObject?: ArraySegment<number>): ArraySegment<number>;
		getUsedBucketCount(): number;
		getTotalElementCount(): number;
	}
} 