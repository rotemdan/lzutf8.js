namespace LZUTF8 {
	export class Random {
		static getRandomIntegerInRange(low: number, high: number): number {
			return low + Math.floor(Math.random() * (high - low));
		}

		static getRandomIntegerArrayOfLength(length: number, low: number, high: number): number[] {
			let randomValues: number[] = [];

			for (let i = 0; i < length; i++) {
				randomValues.push(Random.getRandomIntegerInRange(low, high));
			}

			return randomValues;
		}

		static getRandomUTF16StringOfLength(length: number): string {
			let randomString = "";

			for (let i = 0; i < length; i++) {
				let randomCodePoint: number;

				do {
					randomCodePoint = Random.getRandomIntegerInRange(0, 0x10FFFF + 1);
				} while (randomCodePoint >= 0xD800 && randomCodePoint <= 0xDFFF);

				randomString += Encoding.CodePoint.decodeToString(randomCodePoint);
			}

			return randomString;
		}
	}
}
