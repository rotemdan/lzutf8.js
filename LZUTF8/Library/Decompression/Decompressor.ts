module LZUTF8
{
	export class Decompressor
	{
		MaximumMatchDistance = 32767;

		outputBuffer: ByteArray;
		outputPosition: number = 0;

		inputBufferRemainder: ByteArray;
		outputBufferRemainder: ByteArray;

		decompressBlockToString(input: ByteArray): string
		{
			return decodeUTF8(this.decompressBlock(input));
		}

		decompressBlock(input: ByteArray): ByteArray
		{
			if (input === undefined || input === null)
				throw "decompressBlock: undefined or null input received";

			input = convertToByteArray(input);

			if (this.inputBufferRemainder)
			{
				input = ArrayTools.joinByteArrays([this.inputBufferRemainder, input]);
				this.inputBufferRemainder = undefined;
			}

			var outputStartPosition = this.cropOutputBufferToWindowAndInitialize(Math.max(input.length * 4, 1024));

			for (var readPosition = 0, inputLength = input.length; readPosition < inputLength; readPosition++)
			{
				var inputValue = input[readPosition];

				if (inputValue >>> 6 != 3)
				{
					// If at the continuation byte of a UTF-8 codepoint sequence, output the literal value and continue
					this.outputByte(inputValue);
					continue;
				}

				// At this point it is know that the current byte is the lead byte of either a UTF-8 codepoint or a sized pointer sequence.
				var sequenceLengthIdentifier = inputValue >>> 5; // 6 for 2 bytes, 7 for at least 3 bytes

				// If bytes in read position imply the start of a truncated input sequence (either a literal codepoint or a pointer)
				// keep the remainder to be decoded with the next buffer
				if ( readPosition == inputLength - 1 ||
					(readPosition == inputLength - 2 && sequenceLengthIdentifier == 7))
				{
					this.inputBufferRemainder = newByteArray(input.subarray(readPosition));
					break;
				}

				// If at the leading byte of a UTF-8 codepoint byte sequence
				if (input[readPosition + 1] >>> 7 === 1)
				{
					// Output the literal value
					this.outputByte(inputValue);
				}
				else
				{
					// Beginning of a pointer sequence
					var matchLength = inputValue & 31;
					var matchDistance;

					if (sequenceLengthIdentifier == 6) // 2 byte pointer type, distance was smaller than 128
					{
						matchDistance = input[readPosition + 1];
						readPosition += 1;
					}
					else // 3 byte pointer type, distance was greater or equal to 128
					{
						matchDistance = (input[readPosition + 1] << 8) | (input[readPosition + 2]); // Big endian
						readPosition += 2;
					}

					var matchPosition = this.outputPosition - matchDistance;

					// Copy the match bytes to output
					for (var offset = 0; offset < matchLength; offset++)
						this.outputByte(this.outputBuffer[matchPosition + offset]);
				}
			}

			this.rollBackIfOutputBufferEndsWithATruncatedMultibyteSequence();
			return CompressionCommon.getCroppedBuffer(this.outputBuffer, outputStartPosition, this.outputPosition - outputStartPosition);
		}

		private outputByte(value: number)
		{
			if (this.outputPosition === this.outputBuffer.length)
				this.outputBuffer = ArrayTools.doubleByteArrayCapacity(this.outputBuffer);

			this.outputBuffer[this.outputPosition++] = value;
		}

		private cropOutputBufferToWindowAndInitialize(initialCapacity: number): number
		{
			if (!this.outputBuffer)
			{
				this.outputBuffer = newByteArray(initialCapacity);
				return 0;
			}

			var cropLength = Math.min(this.outputPosition, this.MaximumMatchDistance);
			this.outputBuffer = CompressionCommon.getCroppedBuffer(this.outputBuffer, this.outputPosition - cropLength, cropLength, initialCapacity);

			this.outputPosition = cropLength;

			if (this.outputBufferRemainder)
			{
				for (var i = 0; i < this.outputBufferRemainder.length; i++)
					this.outputByte(this.outputBufferRemainder[i]);

				this.outputBufferRemainder = undefined;
			}

			return cropLength;
		}

		private rollBackIfOutputBufferEndsWithATruncatedMultibyteSequence()
		{
			for (var offset = 1; offset <= 4 && this.outputPosition - offset >= 0; offset++)
			{
				var value = this.outputBuffer[this.outputPosition - offset];

				if ((offset < 4 && (value >>> 3) === 30) ||  // Leading byte of a 4 byte UTF8 sequence
					(offset < 3 && (value >>> 4) === 14) ||  // Leading byte of a 3 byte UTF8 sequence
					(offset < 2 && (value >>> 5) === 6))     // Leading byte of a 2 byte UTF8 sequence
				{

					this.outputBufferRemainder = newByteArray(this.outputBuffer.subarray(this.outputPosition - offset, this.outputPosition));
					this.outputPosition -= offset;

					return;
				}
			}
		}
	}
}