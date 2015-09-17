module LZUTF8
{
	export class AsyncCompressor
	{
		static compressAsync(input: string | Uint8Array, options: CompressionOptions, callback: (result: any, error?: Error) => void)
		{
			var timer = new Timer();
			var compressor = new Compressor();

			if (!callback)
				throw new TypeError("compressAsync: No callback argument given");

			if (typeof input === "string")
			{
				input = encodeUTF8(<string> input);
			}
			else if (input == null || !(input instanceof Uint8Array))
			{
				callback(undefined, new TypeError("compressAsync: Invalid input argument"));
				return;
			}

			var sourceBlocks = ArrayTools.splitByteArray(<Uint8Array> input, options.blockSize);

			var compressedBlocks: Uint8Array[] = [];

			var compressBlocksStartingAt = (index: number) =>
			{
				if (index < sourceBlocks.length)
				{
					try
					{
						var compressedBlock = compressor.compressBlock(sourceBlocks[index]);
					}
					catch (e)
					{
						callback(undefined, e);
						return;
					}

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
						try
						{
							var result = CompressionCommon.encodeCompressedBytes(joinedCompressedBlocks, options.outputEncoding);
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

			enqueueImmediate(() => compressBlocksStartingAt(0));
		}

		static createCompressionStream(): stream.Transform
		{
			var compressor = new Compressor();

			var NodeStream: typeof stream = require("stream");
			var compressionStream = new NodeStream.Transform({ decodeStrings: true, highWaterMark: 65536 });

			compressionStream._transform = (data: Buffer, encoding: string, done: Function) =>
			{
				try
				{
					var buffer = new Buffer(compressor.compressBlock(new Uint8Array(data)));
				}
				catch (e)
				{
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