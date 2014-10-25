﻿module LZUTF8
{
	export class AsyncCompressor
	{
		static compressAsync(input: any, options: CompressionOptions, callback: (result: any) => void)
		{
			var timer = new Timer();
			var compressor = new Compressor();

			if (typeof input == "string")
				input = encodeUTF8(input);

			var sourceBlocks = ArrayTools.splitByteArray(input, options.blockSize);

			var compressedBlocks: ByteArray[] = [];

			var compressBlocksStartingAt = (index: number) =>
			{
				if (index < sourceBlocks.length)
				{
					var compressedBlock = compressor.compressBlock(sourceBlocks[index]);
					compressedBlocks.push(compressedBlock);

					if (timer.getElapsedTime() <= 20)
					{
						compressBlocksStartingAt(index + 1);
					}
					else
					{
						enqueueImmediate(() => compressBlocksStartingAt(index + 1));
						timer.restart();
					}
				}
				else
				{
					var joinedCompressedBlocks = ArrayTools.joinByteArrays(compressedBlocks);

					enqueueImmediate(() =>
					{
						var result = CompressionCommon.encodeCompressedBytes(joinedCompressedBlocks, options.outputEncoding);
						enqueueImmediate(() => callback(result));
					});
				}
			}

			enqueueImmediate(() => compressBlocksStartingAt(0));
		}

		static createCompressionStream(): stream.Transform
		{
			var compressor = new Compressor();

			var NodeStream: typeof stream = require("stream");
			var compressionStream = new NodeStream.Transform({ decodeStrings: true, highWaterMark: 65536 });

			compressionStream._transform = (data: Buffer, encoding: string, done: Function) =>
			{
				var buffer = compressor.compressBlock(convertToByteArray(data));
				compressionStream.push(buffer);

				done();
			}

			return compressionStream;
		}
	}
} 