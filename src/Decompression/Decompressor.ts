namespace LZUTF8 {
	export class Decompressor {
		MaximumMatchDistance = 32767;

		outputBuffer: Uint8Array;
		outputPosition: number = 0;

		inputBufferRemainder?: Uint8Array;
		outputBufferRemainder?: Uint8Array;

		decompressBlockToString(input: Uint8Array): string {
			input = BufferTools.convertToUint8ArrayIfNeeded(input);

			return decodeUTF8(this.decompressBlock(input));
		}

		decompressBlock(input: Uint8Array): Uint8Array {
			if (this.inputBufferRemainder) {
				input = ArrayTools.concatUint8Arrays([this.inputBufferRemainder, input]);
				this.inputBufferRemainder = undefined;
			}

			const outputStartPosition = this.cropOutputBufferToWindowAndInitialize(Math.max(input.length * 4, 1024));

			for (let readPosition = 0, inputLength = input.length; readPosition < inputLength; readPosition++) {
				const inputValue = input[readPosition];

				if (inputValue >>> 6 != 3) {
					// If at the continuation byte of a UTF-8 codepoint sequence, output the literal value and continue
					this.outputByte(inputValue);
					continue;
				}

				// At this point it is known that the current byte is the lead byte of either a UTF-8 codepoint or a sized pointer sequence.
				const sequenceLengthIdentifier = inputValue >>> 5; // 6 for 2 bytes, 7 for at least 3 bytes

				// If bytes in read position imply the start of a truncated input sequence (either a literal codepoint or a pointer)
				// keep the remainder to be decoded with the next buffer
				if (readPosition == inputLength - 1 ||
					(readPosition == inputLength - 2 && sequenceLengthIdentifier == 7)) {
					this.inputBufferRemainder = input.subarray(readPosition);
					break;
				}

				// If at the leading byte of a UTF-8 codepoint byte sequence
				if (input[readPosition + 1] >>> 7 === 1) {
					// Output the literal value
					this.outputByte(inputValue);
				}
				else {
					// Beginning of a pointer sequence
					const matchLength = inputValue & 31;
					let matchDistance;

					if (sequenceLengthIdentifier == 6) { // 2 byte pointer type, distance was smaller than 128
						matchDistance = input[readPosition + 1];
						readPosition += 1;
					}
					else { // 3 byte pointer type, distance was greater or equal to 128
						matchDistance = (input[readPosition + 1] << 8) | (input[readPosition + 2]); // Big endian
						readPosition += 2;
					}

					const matchPosition = this.outputPosition - matchDistance;

					// Copy the match bytes to output
					for (let offset = 0; offset < matchLength; offset++)
						this.outputByte(this.outputBuffer[matchPosition + offset]);
				}
			}

			this.rollBackIfOutputBufferEndsWithATruncatedMultibyteSequence();
			return CompressionCommon.getCroppedBuffer(this.outputBuffer, outputStartPosition, this.outputPosition - outputStartPosition);
		}

		private outputByte(value: number) {
			if (this.outputPosition === this.outputBuffer.length)
				this.outputBuffer = ArrayTools.doubleByteArrayCapacity(this.outputBuffer);

			this.outputBuffer[this.outputPosition++] = value;
		}

		private cropOutputBufferToWindowAndInitialize(initialCapacity: number): number {
			if (!this.outputBuffer) {
				this.outputBuffer = new Uint8Array(initialCapacity);
				return 0;
			}

			const cropLength = Math.min(this.outputPosition, this.MaximumMatchDistance);
			this.outputBuffer = CompressionCommon.getCroppedBuffer(this.outputBuffer, this.outputPosition - cropLength, cropLength, initialCapacity);

			this.outputPosition = cropLength;

			if (this.outputBufferRemainder) {
				for (let i = 0; i < this.outputBufferRemainder.length; i++)
					this.outputByte(this.outputBufferRemainder[i]);

				this.outputBufferRemainder = undefined;
			}

			return cropLength;
		}

		private rollBackIfOutputBufferEndsWithATruncatedMultibyteSequence() {
			for (let offset = 1; offset <= 4 && this.outputPosition - offset >= 0; offset++) {
				const value = this.outputBuffer[this.outputPosition - offset];

				if ((offset < 4 && (value >>> 3) === 30) ||  // Leading byte of a 4 byte UTF8 sequence
					(offset < 3 && (value >>> 4) === 14) ||  // Leading byte of a 3 byte UTF8 sequence
					(offset < 2 && (value >>> 5) === 6)) {    // Leading byte of a 2 byte UTF8 sequence

					this.outputBufferRemainder = this.outputBuffer.subarray(this.outputPosition - offset, this.outputPosition);
					this.outputPosition -= offset;

					return;
				}
			}
		}
	}
}
