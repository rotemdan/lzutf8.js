namespace LZUTF8 {
	export namespace Encoding {
		export namespace StorageBinaryString {
			export const encode = function (input: Uint8Array): string {
				return BinaryString.encode(input).replace(/\0/g, '\u8002');
			}

			export const decode = function (input: string): Uint8Array {
				return BinaryString.decode(input.replace(/\u8002/g, '\0'));
			}
		}
	}
}
