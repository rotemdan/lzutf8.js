namespace LZUTF8 {
	export const getRandomIntegerInRange = function (low: number, high: number) {
		return low + Math.floor(Math.random() * (high - low));
	}

	export const getRandomUTF16StringOfLength = function (length: number) {
		let randomString = "";

		for (let i = 0; i < length; i++) {
			let randomCodePoint: number;
			do {
				randomCodePoint = getRandomIntegerInRange(0, 0x10FFFF + 1);
			} while (randomCodePoint >= 0xD800 && randomCodePoint <= 0xDFFF);

			randomString += Encoding.CodePoint.decodeToString(randomCodePoint);
		}

		return randomString;
	}
}
