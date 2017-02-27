namespace LZUTF8 {
	export class AsyncDecompressor {
		static decompressAsync(input: any, options: DecompressionOptions, callback: (result: any, error?: Error) => void) {
			if (!callback)
				throw new TypeError("decompressAsync: No callback argument given");

			const timer = new Timer();
			try {
				input = CompressionCommon.decodeCompressedBytes(input, options.inputEncoding!);
			}
			catch (e) {
				callback(undefined, e);
				return;
			}

			const decompressor = new Decompressor();
			const sourceBlocks = ArrayTools.splitByteArray(input, options.blockSize!);

			const decompressedBlocks: Uint8Array[] = [];

			const decompressBlocksStartingAt = (index: number) => {
				if (index < sourceBlocks.length) {
					let decompressedBlock: Uint8Array;

					try {
						decompressedBlock = decompressor.decompressBlock(sourceBlocks[index]);
					}
					catch (e) {
						callback(undefined, e);
						return;
					}

					decompressedBlocks.push(decompressedBlock);

					if (timer.getElapsedTime() <= 20) {
						decompressBlocksStartingAt(index + 1);
					}
					else {
						enqueueImmediate(() => decompressBlocksStartingAt(index + 1));
						timer.restart();
					}
				}
				else {
					let joinedDecompressedBlocks = ArrayTools.concatUint8Arrays(decompressedBlocks);

					enqueueImmediate(() => {
						let result: any;

						try {
							result = CompressionCommon.encodeDecompressedBytes(joinedDecompressedBlocks, options.outputEncoding!);
						}
						catch (e) {
							callback(undefined, e);
							return;
						}

						enqueueImmediate(() => callback(result));
					});
				}
			}

			enqueueImmediate(() => decompressBlocksStartingAt(0));
		}

		static createDecompressionStream(): stream.Transform {
			const decompressor = new Decompressor();

			const NodeStream: typeof stream = require("stream");
			const decompressionStream = new NodeStream.Transform({ decodeStrings: true, highWaterMark: 65536 });

			decompressionStream._transform = (data: Buffer, encoding: string, done: Function) => {
				let buffer: Buffer;

				try {
					buffer = BufferTools.uint8ArrayToBuffer(decompressor.decompressBlock(BufferTools.bufferToUint8Array(data)));
				}
				catch (e) {
					decompressionStream.emit("error", e);
					return;
				}

				decompressionStream.push(buffer);

				done();
			}

			return decompressionStream;
		}
	}
}
