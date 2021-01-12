namespace LZUTF8 {
	export class AsyncCompressor {
		static compressAsync(input: string | Uint8Array | Buffer, options: CompressionOptions, callback: (result: any, error?: Error) => void) {
			const timer = new Timer();
			const compressor = new Compressor();

			if (!callback)
				throw new TypeError("compressAsync: No callback argument given");

			if (typeof input === "string") {
				input = encodeUTF8(input);
			}
			else if (input == null || !(input instanceof Uint8Array)) {
				callback(undefined, new TypeError("compressAsync: Invalid input argument, only 'string' and 'Uint8Array' are supported"));
				return;
			}

			const sourceBlocks = ArrayTools.splitByteArray(input, options.blockSize!);

			const compressedBlocks: Uint8Array[] = [];

			let compressBlocksStartingAt = (index: number) => {
				if (index < sourceBlocks.length) {
					let compressedBlock: Uint8Array;

					try {
						compressedBlock = compressor.compressBlock(sourceBlocks[index]);
					}
					catch (e) {
						callback(undefined, e);
						return;
					}

					compressedBlocks.push(compressedBlock);

					if (timer.getElapsedTime() <= 20) {
						compressBlocksStartingAt(index + 1);
					}
					else {
						enqueueImmediate(() => compressBlocksStartingAt(index + 1));
						timer.restart();
					}
				}
				else {
					let joinedCompressedBlocks = ArrayTools.concatUint8Arrays(compressedBlocks);

					enqueueImmediate(() => {
						let result: any;

						try {
							result = CompressionCommon.encodeCompressedBytes(joinedCompressedBlocks, options.outputEncoding!);
						}
						catch (e) {
							callback(undefined, e);
							return;
						}

						enqueueImmediate(() => callback(result));
					});
				}
			}

			enqueueImmediate(() => compressBlocksStartingAt(0));
		}

		static createCompressionStream(): stream.Transform {
			const compressor = new Compressor();

			const NodeStream: typeof stream = require("readable-stream");
			const compressionStream = new NodeStream.Transform({ decodeStrings: true, highWaterMark: 65536 });

			compressionStream._transform = (data: Buffer, encoding: string, done: Function) => {
				let buffer: Buffer;

				try {
					buffer = BufferTools.uint8ArrayToBuffer(compressor.compressBlock(BufferTools.bufferToUint8Array(data)));
				}
				catch (e) {
					compressionStream.emit("error", e);
					return;
				}

				compressionStream.push(buffer);

				done();
			}

			return compressionStream;
		}
	}
}
