module LZUTF8
{
	export class Random
	{
		static getRandomIntegerInRange(low: number, high: number): number
		{
			return low + Math.floor(Math.random() * (high - low));
		}

		static getRandomIntegerArrayOfLength(length: number, low: number, high: number): number[]
		{
			var randomValues: number[] = [];

			for (var i = 0; i < length; i++)
			{
				randomValues.push(Random.getRandomIntegerInRange(low, high));
			}

			return randomValues;
		}

		static getRandomUTF16StringOfLength(length: number): string
		{
			var randomString = "";

			for (var i = 0; i < length; i++)
			{
				do
				{
					var randomCodePoint = Random.getRandomIntegerInRange(0, 0x10FFFF + 1);
				} while (randomCodePoint >= 0xD800 && randomCodePoint <= 0xDFFF);

				randomString += Encoding.UTF8.getStringFromUnicodeCodePoint(randomCodePoint);
			}

			return randomString;
		}
	}
}