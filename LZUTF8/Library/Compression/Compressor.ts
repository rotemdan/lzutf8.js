module LZUTF8
{
	export class Compressor
	{
		MinimumSequenceLength = 4;
		MaximumSequenceLength = 31;
		MaximumMatchDistance = 32767;
		PrefixHashTableSize = 65537;

		inputBuffer: ByteArray;
		inputBufferStreamOffset: number = 1;

		outputBuffer: ByteArray;
		outputBufferPosition: number;

		prefixHashTable: CompressorHashTable;

		constructor(useCustomPrefixHashTable = true)
		{
			if (useCustomPrefixHashTable && typeof Uint32Array == "function")
				this.prefixHashTable = new CompressorCustomHashTable(this.PrefixHashTableSize);
			else
				this.prefixHashTable = new CompressorSimpleHashTable(this.PrefixHashTableSize);
		}

		compressBlock(input: any): ByteArray
		{
			if (input === undefined || input === null)
				throw "compressBlock: undefined or null input received";

			if (typeof input == "string")
				input = encodeUTF8(input);

			return this.compressByteArrayBlock(input);
		}

		compressByteArrayBlock(utf8Bytes: ByteArray): ByteArray
		{
			if (!utf8Bytes || utf8Bytes.length == 0)
				return newByteArray(0);

			utf8Bytes = convertToByteArray(utf8Bytes);

			var bufferStartingReadOffset = this.cropAndAddNewBytesToInputBuffer(utf8Bytes);

			var inputBuffer = this.inputBuffer;
			var inputBufferLength = this.inputBuffer.length;

			this.outputBuffer = newByteArray(utf8Bytes.length);
			this.outputBufferPosition = 0;

			var latestMatchEndPosition = 0;

			for (var readPosition = bufferStartingReadOffset; readPosition < inputBufferLength; readPosition++)
			{
				var inputValue = inputBuffer[readPosition];
				var withinAMatchedRange = readPosition < latestMatchEndPosition;

				// Last 3 bytes are not matched
				if (readPosition > inputBufferLength - this.MinimumSequenceLength)
				{
					if (!withinAMatchedRange)
						this.outputRawByte(inputValue);

					continue;
				}

				// Find the target bucket index
				var targetBucketIndex = this.getBucketIndexForPrefix(readPosition);

				if (!withinAMatchedRange)
				{
					// Try to find the longest match for the sequence starting at the current position
					var matchLocator = this.findLongestMatch(readPosition, targetBucketIndex);

					// If match found
					if (matchLocator !== null)
					{
						// Output a pointer to the match
						this.outputPointerBytes(matchLocator.length, matchLocator.distance);

						// Keep the end position of the match
						latestMatchEndPosition = readPosition + matchLocator.length;
						withinAMatchedRange = true;
					}
				}

				// If not in a range of a match, output the literal byte
				if (!withinAMatchedRange)
					this.outputRawByte(inputValue);

				// Add the current 4 byte sequence to the hash table 
				// (note that input stream offset starts at 1, so it will never equal 0, thus the hash
				// table can safely use 0 as an empty bucket slot indicator - this property is critical for the  custom hash table implementation).
				var inputStreamPosition = this.inputBufferStreamOffset + readPosition;
				this.prefixHashTable.addValueToBucket(targetBucketIndex, inputStreamPosition);
			}

			//this.logStatisticsToConsole(readPosition - bufferStartingReadOffset);

			return this.outputBuffer.subarray(0, this.outputBufferPosition);
		}

		private findLongestMatch(matchedSequencePosition: number, bucketIndex: number): MatchLocator
		{
			var bucket = this.prefixHashTable.getArraySegmentForBucketIndex(bucketIndex, this.reusableArraySegmentObject);

			if (bucket == null)
				return null;

			var input = this.inputBuffer;
			var longestMatchDistance: number;
			var longestMatchLength: number;

			for (var i = 0; i < bucket.length; i++)
			{
				// Adjust to the actual buffer position. Note: position might be negative (not in the current buffer)
				var testedSequencePosition = bucket.getInReversedOrder(i) - this.inputBufferStreamOffset;
				var testedSequenceDistance = matchedSequencePosition - testedSequencePosition;

				// Find the length to surpass for this match
				if (longestMatchDistance === undefined)
					var lengthToSurpass = this.MinimumSequenceLength - 1;
				else if (longestMatchDistance < 128 && testedSequenceDistance >= 128)
					var lengthToSurpass = longestMatchLength + (longestMatchLength >>> 1); // floor(l * 1.5)
				else
					var lengthToSurpass = longestMatchLength;

				// Break if any of the conditions occur
				if (testedSequenceDistance > this.MaximumMatchDistance ||
					lengthToSurpass >= this.MaximumSequenceLength ||
					matchedSequencePosition + lengthToSurpass >= input.length)
					break;

				// Quick check to see if there's any point comparing all the bytes.
				if (input[testedSequencePosition + lengthToSurpass] !== input[matchedSequencePosition + lengthToSurpass])
					continue;

				for (var offset = 0; ; offset++)
				{
					if (matchedSequencePosition + offset === input.length ||
						input[testedSequencePosition + offset] !== input[matchedSequencePosition + offset])
					{
						if (offset > lengthToSurpass)
						{
							longestMatchDistance = testedSequenceDistance;
							longestMatchLength = offset;
						}

						break;
					}
					else if (offset === this.MaximumSequenceLength)
						return { distance: testedSequenceDistance, length: this.MaximumSequenceLength };
				}
			}

			if (longestMatchDistance !== undefined)
				return { distance: longestMatchDistance, length: longestMatchLength };
			else
				return null;
		}

		private getBucketIndexForPrefix(startPosition: number): number
		{
			return (this.inputBuffer[startPosition] * 7880599 +
				this.inputBuffer[startPosition + 1] * 39601 +
				this.inputBuffer[startPosition + 2] * 199 +
				this.inputBuffer[startPosition + 3]) % this.PrefixHashTableSize;
		}

		private outputPointerBytes(length: number, distance: number)
		{
			if (distance < 128)
			{
				this.outputRawByte(192 | length);

				this.outputRawByte(distance);
			}
			else
			{
				this.outputRawByte(224 | length);

				this.outputRawByte(distance >>> 8);
				this.outputRawByte(distance & 255);
			}
		}

		private outputRawByte(value: number)
		{
			this.outputBuffer[this.outputBufferPosition++] = value;
		}

		private cropAndAddNewBytesToInputBuffer(newInput: ByteArray): number
		{
			if (this.inputBuffer === undefined)
			{
				this.inputBuffer = newInput;
				return 0;
			}
			else
			{
				var cropLength = Math.min(this.inputBuffer.length, this.MaximumMatchDistance);
				var cropStartOffset = this.inputBuffer.length - cropLength;

				this.inputBuffer = CompressionCommon.getCroppedAndAppendedBuffer(this.inputBuffer, cropStartOffset, cropLength, newInput);

				this.inputBufferStreamOffset += cropStartOffset;
				return cropLength;
			}
		}

		private logStatisticsToConsole(bytesRead: number)
		{
			var usedBucketCount = this.prefixHashTable.getUsedBucketCount();
			var totalHashtableElementCount = this.prefixHashTable.getTotalElementCount();

			console.log("Compressed size: " + this.outputBufferPosition + "/" + bytesRead + " (" + (this.outputBufferPosition / bytesRead * 100).toFixed(2) + "%)");
			console.log("Occupied bucket count: " + usedBucketCount + "/" + this.PrefixHashTableSize);
			console.log("Total hashtable element count: " + totalHashtableElementCount + " (" + (totalHashtableElementCount / usedBucketCount).toFixed(2) + " elements per occupied bucket on average)");
			console.log("");
		}

		private reusableArraySegmentObject = new ArraySegment<number>();
	}

	interface MatchLocator
	{
		distance: number;
		length: number;
	}
}