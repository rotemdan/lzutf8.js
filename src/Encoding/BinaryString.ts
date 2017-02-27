namespace LZUTF8 {
	export namespace Encoding {
		export namespace BinaryString {
			export const encode = function (input: Uint8Array): string {
				if (input == null)
					throw new TypeError("BinaryString.encode: undefined or null input received");

				if (input.length === 0)
					return "";

				const inputLength = input.length;

				const outputStringBuilder = new StringBuilder();

				let remainder = 0;
				let state = 1;

				for (let i = 0; i < inputLength; i += 2) {
					let value: number;

					if (i == inputLength - 1)
						value = (input[i] << 8);
					else
						value = (input[i] << 8) | input[i + 1];

					outputStringBuilder.appendCharCode((remainder << (16 - state)) | value >>> state);
					remainder = value & ((1 << state) - 1);

					if (state === 15) {
						outputStringBuilder.appendCharCode(remainder);
						remainder = 0;
						state = 1;
					}
					else {
						state += 1;
					}

					if (i >= inputLength - 2)
						outputStringBuilder.appendCharCode(remainder << (16 - state));
				}

				outputStringBuilder.appendCharCode(32768 | (inputLength % 2));

				return outputStringBuilder.getOutputString();
			}

			export const decode = function (input: string): Uint8Array {
				if (typeof input !== "string")
					throw new TypeError("BinaryString.decode: invalid input type");

				if (input == "")
					return new Uint8Array(0);

				const output = new Uint8Array(input.length * 3);
				let outputPosition = 0;

				const appendToOutput = (value: number) => {
					output[outputPosition++] = value >>> 8;
					output[outputPosition++] = value & 255;
				};

				let remainder = 0;
				let state = 0;

				for (let i = 0; i < input.length; i++) {
					let value = input.charCodeAt(i);

					if (value >= 32768) {
						if (value == (32768 | 1))
							outputPosition--;

						state = 0;
						continue;
					}

					//
					if (state == 0) {
						remainder = value;
					}
					else {
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
