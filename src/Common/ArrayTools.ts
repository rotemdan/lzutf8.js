namespace LZUTF8 {
	export namespace ArrayTools {
		export const copyElements = function (source: IndexableCollection<any>, sourceIndex: number, destination: IndexableCollection<any>, destinationIndex: number, count: number) {
			while (count--)
				destination[destinationIndex++] = source[sourceIndex++];
		}

		export const zeroElements = function (collection: IndexableCollection<any>, index: number, count: number) {
			while (count--)
				collection[index++] = 0;
		}

		export const countNonzeroValuesInArray = function (array: IndexableCollection<any>): number {
			let result = 0;

			for (let i = 0; i < array.length; i++)
				if (array[i])
					result++;

			return result;
		}

		export const truncateStartingElements = function (array: Array<any>, truncatedLength: number) {
			if (array.length <= truncatedLength)
				throw new RangeError("truncateStartingElements: Requested length should be smaller than array length");

			const sourcePosition = array.length - truncatedLength;

			for (let i = 0; i < truncatedLength; i++)
				array[i] = array[sourcePosition + i];

			array.length = truncatedLength;
		}

		export const doubleByteArrayCapacity = function (array: Uint8Array): Uint8Array {
			const newArray = new Uint8Array(array.length * 2);
			newArray.set(array);

			return newArray;
		}

		export const concatUint8Arrays = function (arrays: Uint8Array[]): Uint8Array {
			let totalLength = 0;

			for (const array of arrays)
				totalLength += array.length;

			const result = new Uint8Array(totalLength);
			let offset = 0;

			for (const array of arrays) {
				result.set(array, offset);
				offset += array.length;
			}

			return result;
		}

		export const splitByteArray = function (byteArray: Uint8Array, maxPartLength: number): Uint8Array[] {
			const result: Uint8Array[] = [];

			for (let offset = 0; offset < byteArray.length;) {
				let blockLength = Math.min(maxPartLength, byteArray.length - offset);
				result.push(byteArray.subarray(offset, offset + blockLength));

				offset += blockLength;
			}

			return result;
		}
	}
}
