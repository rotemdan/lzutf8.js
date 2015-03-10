module LZUTF8
{
	// Core
	export function compress(input: any, options?: CompressionOptions): any
	{
		if (input === undefined || input === null)
			throw "compress: undefined or null input received";

		options = ObjectTools.extendObject({ outputEncoding: "ByteArray" }, options);

		var compressor = new Compressor();
		var compressedBytes = compressor.compressBlock(input);

		return CompressionCommon.encodeCompressedBytes(compressedBytes, options.outputEncoding);
	}

	export function decompress(input: any, options?: CompressionOptions): any
	{
		if (input === undefined || input === null)
			throw "decompress: undefined or null input received";

		options = ObjectTools.extendObject({ inputEncoding: "ByteArray", outputEncoding: "String" }, options);

		input = CompressionCommon.decodeCompressedData(input, options.inputEncoding);

		var decompressor = new Decompressor();
		var decompressedBytes = decompressor.decompressBlock(input);

		return CompressionCommon.encodeDecompressedBytes(decompressedBytes, options.outputEncoding);
	}

	// Async
	export function compressAsync(input: any, options: CompressionOptions, callback: (result: any) => void)
	{
		if (input === undefined || input === null)
			throw "compressAsync: undefined or null input received";

		if (callback == null)
			callback = () => { };


		var defaultOptions: CompressionOptions =
			{
				inputEncoding: CompressionCommon.detectCompressionSourceEncoding(input),
				outputEncoding: "ByteArray",
				useWebWorker: true,
				blockSize: 65536
			}

		options = ObjectTools.extendObject(defaultOptions, options);

		if (options.useWebWorker === true && WebWorker.isSupported())
		{
			WebWorker.createGlobalWorkerIfItDoesntExist();
			WebWorker.compressAsync(input, options, callback);
		}
		else
		{

			AsyncCompressor.compressAsync(input, options, callback);
		}
	}

	export function decompressAsync(input: any, options: CompressionOptions, callback: (result: any) => void)
	{
		if (input === undefined || input === null)
			throw "decompressAsync: undefined or null input received";

		if (callback == null)
			callback = () => { };

		var defaultOptions: CompressionOptions =
			{
				inputEncoding: "ByteArray",
				outputEncoding: "String",
				useWebWorker: true,
				blockSize: 65536
			}

		options = ObjectTools.extendObject(defaultOptions, options);

		if (options.useWebWorker === true && WebWorker.isSupported())
		{
			WebWorker.createGlobalWorkerIfItDoesntExist();
			WebWorker.decompressAsync(input, options, callback);
		}
		else
		{
			AsyncDecompressor.decompressAsync(input, options, callback);
		}
	}

	// Node.js streams
	export function createCompressionStream(): stream.Transform
	{
		return AsyncCompressor.createCompressionStream();
	}

	export function createDecompressionStream(): stream.Transform
	{
		return AsyncDecompressor.createDecompressionStream();
	}
	
	// Encodings
	export function encodeUTF8(str: string): ByteArray
	{
		if (runningInNodeJS())
			return convertToByteArray(new Buffer(str, "utf8"));
		else
			return LZUTF8.Encoding.UTF8.encode(str);
	}

	export function decodeUTF8(input: any): string
	{
		input = convertToByteArray(input);

		if (runningInNodeJS())
			return input.toString("utf8");
		else
			return Encoding.UTF8.decode(input);
	}

	export function encodeBase64(input: any): string
	{
		input = convertToByteArray(input);

		if (runningInNodeJS())
			return input.toString("base64");
		else
			return Encoding.Base64.encode(input);
	}

	export function decodeBase64(str: string): ByteArray
	{
		if (runningInNodeJS())
			return convertToByteArray(new Buffer(str, "base64"));
		else
			return Encoding.Base64.decode(str);
	}

	export function decodeConcatenatedBase64(concatBase64Strings: string): ByteArray
	{
		var base64Strings: string[] = [];

		for (var offset = 0; offset < concatBase64Strings.length; )
		{
			var endPosition = concatBase64Strings.indexOf("=", offset);

			if (endPosition == -1)
			{
				endPosition = concatBase64Strings.length;
			}
			else
			{
				if (concatBase64Strings[endPosition] == "=")
					endPosition++;

				if (concatBase64Strings[endPosition] == "=") // Note: if endPosition equals string length the char would be undefined
					endPosition++;
			}

			base64Strings.push(concatBase64Strings.substring(offset, endPosition));
			offset = endPosition;
		}

		var decodedByteArrays: ByteArray[] = [];

		for (var i = 0; i < base64Strings.length; i++)
		{
			decodedByteArrays.push(decodeBase64(base64Strings[i]));
		}

		return ArrayTools.joinByteArrays(decodedByteArrays);
	}

	export function encodeBinaryString(input: any): string
	{
		input = convertToByteArray(input);
		return Encoding.BinaryString.encode(input);
	}

	export function decodeBinaryString(str: string): ByteArray
	{
		return Encoding.BinaryString.decode(str);
	}

	export interface CompressionOptions
	{
		inputEncoding?: string;
		outputEncoding?: string;
		useWebWorker?: boolean;
		blockSize?: number;
	}
}