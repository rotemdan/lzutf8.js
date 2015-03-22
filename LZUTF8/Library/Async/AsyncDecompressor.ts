module LZUTF8
{
	export class AsyncDecompressor
	{
		static decompressAsync(input: any, options: CompressionOptions, callback: (result: any, error?: Error) => void)
		{
			var timer = new Timer();
			try
			{
				input = CompressionCommon.decodeCompressedData(input, options.inputEncoding);
			}
			catch (e)
			{
				callback(undefined, e);
				return;
			}

			var decompressor = new Decompressor();
			var sourceBlocks = ArrayTools.splitByteArray(input, options.blockSize);

			var decompressedBlocks: ByteArray[] = [];

			var decompressBlocksStartingAt = (index: number) =>
			{
				if (index < sourceBlocks.length)
				{
					try
					{
						var decompressedBlock = decompressor.decompressBlock(sourceBlocks[index]);
					}
					catch (e)
					{
						callback(undefined, e);
						return;
					}

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
						try
						{
							var result = CompressionCommon.encodeDecompressedBytes(joinedDecompressedBlocks, options.outputEncoding);
						}
						catch (e)
						{
							callback(undefined, e);
							return;
						}

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
				try
				{
					var buffer = decompressor.decompressBlock(convertToByteArray(data));
				}
				catch (e)
				{
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