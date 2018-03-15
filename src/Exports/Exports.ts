namespace LZUTF8 {
	export type UncompressedEncoding = "String" | "ByteArray";
	export type CompressedEncoding = "ByteArray" | "Buffer" | "Base64" | "BinaryString" | "StorageBinaryString";
	export type DecompressedEncoding = "String" | "ByteArray" | "Buffer";

	export type CompressionOptions = {
		inputEncoding?: UncompressedEncoding;
		outputEncoding?: CompressedEncoding;
		useWebWorker?: boolean;
		blockSize?: number;
	}

	export type DecompressionOptions = {
		inputEncoding?: CompressedEncoding;
		outputEncoding?: DecompressedEncoding;
		useWebWorker?: boolean;
		blockSize?: number;
	}

	export function compress(input: string | Uint8Array | Buffer, options: CompressionOptions = {}): Uint8Array | Buffer | string {
		if (input == null)
			throw new TypeError("compress: undefined or null input received");

		const inputEncoding = CompressionCommon.detectCompressionSourceEncoding(input);

		options = ObjectTools.override({ inputEncoding, outputEncoding: "ByteArray" }, options);

		const compressor = new Compressor();
		const compressedBytes = compressor.compressBlock(input);

		return CompressionCommon.encodeCompressedBytes(compressedBytes, options.outputEncoding!);
	}

	export function decompress(input: Uint8Array | Buffer | string, options: DecompressionOptions = {}): string | Uint8Array | Buffer {
		if (input == null)
			throw new TypeError("decompress: undefined or null input received");

		options = ObjectTools.override({ inputEncoding: "ByteArray", outputEncoding: "String" }, options);

		const inputBytes = CompressionCommon.decodeCompressedBytes(input, options.inputEncoding!);

		const decompressor = new Decompressor();
		const decompressedBytes = decompressor.decompressBlock(inputBytes);

		return CompressionCommon.encodeDecompressedBytes(decompressedBytes, options.outputEncoding!);
	}

	export function compressAsync(input: string | Uint8Array | Buffer, options: CompressionOptions, callback: (result?: Uint8Array | Buffer | string, error?: Error) => void) {
		if (callback == null)
			callback = () => { };

		let inputEncoding: UncompressedEncoding;

		try {
			inputEncoding = CompressionCommon.detectCompressionSourceEncoding(input);
		}
		catch (e) {
			callback(undefined, e);
			return;
		}

		options = ObjectTools.override({
			inputEncoding: inputEncoding,
			outputEncoding: "ByteArray",
			useWebWorker: true,
			blockSize: 65536
		}, options);

		enqueueImmediate(() => {
			if (options.useWebWorker && WebWorker.createGlobalWorkerIfNeeded()) {
				WebWorker.compressAsync(input, options, callback);
			}
			else {
				AsyncCompressor.compressAsync(input, options, callback);
			}
		});
	}

	export function decompressAsync(input: Uint8Array | Buffer | string, options: DecompressionOptions, callback: (result?: string | Uint8Array | Buffer, error?: Error) => void) {
		if (callback == null)
			callback = () => { };

		if (input == null) {
			callback(undefined, new TypeError("decompressAsync: undefined or null input received"));
			return;
		}

		options = ObjectTools.override({
			inputEncoding: "ByteArray",
			outputEncoding: "String",
			useWebWorker: true,
			blockSize: 65536
		}, options);

		const normalizedInput: Uint8Array | string = BufferTools.convertToUint8ArrayIfNeeded(input);

		EventLoop.enqueueImmediate(() => {
			if (options.useWebWorker && WebWorker.createGlobalWorkerIfNeeded()) {
				WebWorker.decompressAsync(normalizedInput, options, callback);
			}
			else {
				AsyncDecompressor.decompressAsync(input, options, callback);
			}
		});
	}

	// Node.js streams
	export function createCompressionStream(): stream.Transform {
		return AsyncCompressor.createCompressionStream();
	}

	export function createDecompressionStream(): stream.Transform {
		return AsyncDecompressor.createDecompressionStream();
	}

	// Encodings
	export function encodeUTF8(str: string): Uint8Array {
		return Encoding.UTF8.encode(str);
	}

	export function decodeUTF8(input: Uint8Array): string {
		return Encoding.UTF8.decode(input);
	}

	export function encodeBase64(input: Uint8Array): string {
		return Encoding.Base64.encode(input);
	}

	export function decodeBase64(str: string): Uint8Array {
		return Encoding.Base64.decode(str);
	}

	export function encodeBinaryString(input: Uint8Array): string {
		return Encoding.BinaryString.encode(input);
	}

	export function decodeBinaryString(str: string): Uint8Array {
		return Encoding.BinaryString.decode(str);
	}

	export function encodeStorageBinaryString(input: Uint8Array): string {
		return Encoding.StorageBinaryString.encode(input);
	}

	export function decodeStorageBinaryString(str: string): Uint8Array {
		return Encoding.StorageBinaryString.decode(str);
	}
}

