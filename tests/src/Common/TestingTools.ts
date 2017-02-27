namespace LZUTF8 {
	export function repeatString(str: string, count: number): string {
		let result = "";
		for (let i = 0; i < count; i++)
			result += str;
		return result;
	}

	export function truncateUTF16String(str: string, truncatedLength: number): string {
		let lastCharCode = str.charCodeAt(truncatedLength - 1);

		if (lastCharCode >= 0xD800 && lastCharCode <= 0xDBFF)
			return str.substr(0, truncatedLength - 1);
		else
			return str.substr(0, truncatedLength);;
	}

	export function verifyEncoding(input: any, expectedEncoding: CompressedEncoding) {
		switch (expectedEncoding) {
			case "ByteArray":
				return input instanceof Uint8Array;
			case "Buffer":
				return runningInNodeJS() && Buffer.isBuffer(input);
			case "Base64":
				return typeof input === "string" && /^[A-Za-z0-9\+\/]*\=?\=?$/.test(input)
			case "BinaryString":
				if (typeof input != "string")
					return false;

				for (let p = 0; p < input.length - 1; p++) {
					if (input.charCodeAt(p) >= 32768)
						return false;
				}

				if (input.charCodeAt(input.length - 1) < 32768)
					return false;

				return true;
			default:
				throw new Error(`Unsupported expected encoding '${expectedEncoding}'`);
		}
	}
}
