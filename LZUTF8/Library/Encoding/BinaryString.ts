module LZUTF8
{
	export module Encoding
	{
		export class BinaryString
		{
			static encode(input: ByteArray): string
			{
				if (input == null)
					throw new TypeError("BinaryString.encode: undefined or null input received");

				if (input.length === 0)
					return "";

				var inputLength = input.length;

				var outputStringBuilder = new StringBuilder();

				var remainder = 0;
				var state = 1;

				for (var i = 0; i < inputLength; i += 2)
				{
					if (i == inputLength - 1)
						var value = (input[i] << 8);
					else
						var value = (input[i] << 8) | input[i + 1];

					outputStringBuilder.append((remainder << (16 - state)) | value >>> state);
					remainder = value & ((1 << state) - 1);

					if (state === 15)
					{
						outputStringBuilder.append(remainder);
						remainder = 0;
						state = 1;
					}
					else
					{
						state += 1;
					}

					if (i >= inputLength - 2)
						outputStringBuilder.append(remainder << (16 - state));
				}

				outputStringBuilder.append(32768 | (inputLength % 2));

				return outputStringBuilder.toString();
			}

			static decode(input: string): ByteArray
			{
				if (typeof input !== "string")
					throw new TypeError("BinaryString.decode: invalid input type");

				if (input == "")
					return newByteArray(0);

				var output = newByteArray(input.length * 3);
				var outputPosition = 0;

				var appendToOutput = (value: number) =>
				{
					output[outputPosition++] = value >>> 8;
					output[outputPosition++] = value & 255;
				};

				var remainder;
				var state = 0;

				for (var i = 0; i < input.length; i++)
				{
					var value = input.charCodeAt(i);

					if (value >= 32768)
					{
						if (value == (32768 | 1))
							outputPosition--;

						state = 0;
						continue;
					}

					//
					if (state == 0)
					{
						remainder = value;
					}
					else
					{
						appendToOutput((remainder << state) | (value >>> (15 - state)));
						remainder = value & ((1 << (15 - state)) - 1);
					}

					if (state == 15)
						state = 0;
					else
						state += 1;
				}

				return output.subarray(0, outputPosition);
			}
		}
	}
}