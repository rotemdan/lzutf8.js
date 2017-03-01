namespace LZUTF8 {
	export namespace Encoding {
		export namespace CodePoint {
			export const encodeFromString = function (str: string, position: number): number {
				const charCode = str.charCodeAt(position);

				if (charCode < 0xD800 || charCode > 0xDBFF)
					return charCode;
				else {
					const nextCharCode = str.charCodeAt(position + 1);

					if (nextCharCode >= 0xDC00 && nextCharCode <= 0xDFFF)
						return 0x10000 + (((charCode - 0xD800) << 10) + (nextCharCode - 0xDC00));
					else
						throw new Error(`getUnicodeCodePoint: Received a lead surrogate character, char code ${charCode}, followed by ${nextCharCode}, which is not a trailing surrogate character code.`);
				}
			}

			export const decodeToString = function (codePoint: number): string {
				if (codePoint <= 0xFFFF)
					return String.fromCharCode(codePoint);
				else if (codePoint <= 0x10FFFF)
					return String.fromCharCode(
						0xD800 + ((codePoint - 0x10000) >>> 10),
						0xDC00 + ((codePoint - 0x10000) & 1023));
				else
					throw new Error(`getStringFromUnicodeCodePoint: A code point of ${codePoint} cannot be encoded in UCS-2`);
			}
		}
	}
}
