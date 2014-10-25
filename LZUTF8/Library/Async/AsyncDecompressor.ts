module LZUTF8
{
	export class AsyncDecompressor
	{
		static decompressAsync(input: any, options: CompressionOptions, callback: (result: any) => void)
		{
			var timer = new Timer();
			input = CompressionCommon.decodeCompressedData(input, options.inputEncoding);

			var decompressor = new Decompressor();
			var sourceBlocks = ArrayTools.splitByteArray(input, options.blockSize);

			var decompressedBlocks: ByteArray[] = [];

			var decompressBlocksStartingAt = (index: number) =>
			{
				if (index < sourceBlocks.length)
				{
					var decompressedBlock = decompressor.decompressBlock(sourceBlocks[index]);
					decompressedBlocks.push(decompressedBlock);


					if (timer.getElapsedTime() <= 20)
					{
						decompressBlocksStartingAt(index + 1);
					}
					else
					{
						enqueueImmediate(() => decompressBlocksStartingAt(index + 1));
						timer.restart();
					}
					
				}
				else
				{
					var joinedDecompressedBlocks = ArrayTools.joinByteArrays(decompressedBlocks);

					enqueueImmediate(() =>
					{
						var result = CompressionCommon.encodeDecompressedBytes(joinedDecompressedBlocks, options.outputEncoding);
						enqueueImmediate(() => callback(result));
					});
				}
			}

			enqueueImmediate(() => decompressBlocksStartingAt(0));
		}

		static createDecompressionStream(): stream.Transform
		{
			var decompressor = new Decompressor();

			var NodeStream: typeof stream = require("stream");
			var decompressionStream = new NodeStream.Transform({ decodeStrings: true, highWaterMark: 65536 });

			decompressionStream._transform = (data: Buffer, encoding: string, done: Function) =>
			{
				var buffer = decompressor.decompressBlock(convertToByteArray(data));
				decompressionStream.push(buffer);

				done();
			}

			return decompressionStream;
		}
	}
} 