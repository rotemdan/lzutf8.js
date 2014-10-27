module LZUTF8
{
	export class StringBuilder
	{
		private outputBuffer: number[] = new Array(1024);
		private outputPosition = 0;
		private outputString = "";

		//private static charCodeArrayToString: (charCodes) => string = Function.prototype.apply.bind(String.fromCharCode, null);

		append(charCode: number)
		{
			this.outputBuffer[this.outputPosition++] = charCode;

			if (this.outputPosition === 1024)
				this.flushBufferToOutputString();
		}

		appendCodePoint(codePoint: number)
		{
			if (codePoint <= 0xFFFF)
			{
				this.append(codePoint);
			}
			else if (codePoint <= 0x10FFFF)
			{
				this.append(0xD800 + ((codePoint - 0x10000) >>> 10));
				this.append(0xDC00 + ((codePoint - 0x10000) & 1023));
			}
			else
				throw "appendCodePoint: A code point of " + codePoint + " cannot be encoded in UTF-16";
		}

		toString(): string
		{
			this.outputString += StringBuilder.charCodeArrayToString(this.outputBuffer.slice(0, this.outputPosition));
			this.outputPosition = 0;

			return this.outputString;
		}

		private flushBufferToOutputString()
		{
			this.outputString += StringBuilder.charCodeArrayToString(this.outputBuffer);
			this.outputPosition = 0;
		}

		private static charCodeArrayToString(charCodes: number[])
		{
			return String.fromCharCode.apply(null, charCodes);
		}
	}

	export class StringBuilder1
	{
		private outputString = "";

		append(charCode: number)
		{
			this.outputString += String.fromCharCode(charCode);
		}

		appendCodePoint(codePoint: number)
		{
			if (codePoint <= 0xFFFF)
			{
				this.append(codePoint);
			}
			else if (codePoint <= 0x10FFFF)
			{
				this.append(0xD800 + ((codePoint - 0x10000) >>> 10));
				this.append(0xDC00 + ((codePoint - 0x10000) & 1023));
			}
			else
				throw "appendCodePoint: A code point of " + codePoint + " cannot be encoded in UTF-16";
		}

		toString(): string
		{
			return this.outputString;
		}
	}
} 