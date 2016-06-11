namespace LZUTF8
{
	export class ArrayTools
	{
		static copyElements(source: IndexableCollection<any>, sourceIndex: number, destination: IndexableCollection<any>, destinationIndex: number, count: number)
		{
			while (count--)
				destination[destinationIndex++] = source[sourceIndex++];
		}

		static zeroElements(collection: IndexableCollection<any>, index: number, count: number)
		{
			while (count--)
				collection[index++] = 0;
		}

		static find(collection: IndexableCollection<any>, itemToFind: any): number
		{
			for (let i = 0; i < collection.length; i++)
				if (collection[i] === itemToFind)
					return i;

			return -1;
		}

		static compareSequences(sequence1: IndexableCollection<any>, sequence2: IndexableCollection<any>): boolean
		{
			let lengthMatched = true;
			let elementsMatched = true;

			if (sequence1.length !== sequence2.length)
			{
				log("Sequence length did not match: sequence 1 length is " + sequence1.length + ", sequence 2 length is " + sequence2.length);
				lengthMatched = false;
			}

			for (let i = 0; i < Math.min(sequence1.length, sequence2.length); i++)
				if (sequence1[i] !== sequence2[i])
				{
					log("Sequence elements did not match: sequence1[" + i + "] === " + sequence1[i] + ", sequence2[" + i + "] === " + sequence2[i]);
					elementsMatched = false;
					break;
				}

			return lengthMatched && elementsMatched;
		}

		static countNonzeroValuesInArray(array: IndexableCollection<any>): number
		{
			let result = 0;

			for (let i = 0; i < array.length; i++)
				if (array[i])
					result++;

			return result;
		}

		static truncateStartingElements(array: Array<any>, truncatedLength: number)
		{
			if (array.length <= truncatedLength)
				throw new RangeError("truncateStartingElements: Requested length should be smaller than array length");

			let sourcePosition = array.length - truncatedLength;

			for (let i = 0; i < truncatedLength; i++)
				array[i] = array[sourcePosition + i];

			array.length = truncatedLength;
		}

		static doubleByteArrayCapacity(array: Uint8Array): Uint8Array
		{
			let newArray = new Uint8Array(array.length * 2);
			newArray.set(array);

			return newArray;
		}

		static joinByteArrays(byteArrays: Uint8Array[])
		{
			let totalLength = 0;

			for (let i = 0; i < byteArrays.length; i++)
			{
				totalLength += byteArrays[i].length;
			}

			let result = new Uint8Array(totalLength);
			let currentOffset = 0;

			for (let i = 0; i < byteArrays.length; i++)
			{
				result.set(byteArrays[i], currentOffset);
				currentOffset += byteArrays[i].length;
			}

			return result;
		}

		static splitByteArray(byteArray: Uint8Array, maxPartLength: number): Uint8Array[]
		{
			let result: Uint8Array[] = [];

			for (let offset = 0; offset < byteArray.length; )
			{
				let blockLength = Math.min(maxPartLength, byteArray.length - offset);
				result.push(byteArray.subarray(offset, offset + blockLength));

				offset += blockLength;
			}

			return result;
		}

		static convertToUint8ArrayIfNeeded(input: any): any
		{
			if (typeof Buffer === "function" && input instanceof Buffer)
				return this.bufferToUint8Array(input);
			else
				return input;
		}

		static uint8ArrayToBuffer(arr: Uint8Array): Buffer
		{
			if (Buffer.prototype instanceof Uint8Array)
			{
				// A simple technique based on how buffer objects are created in node 3/4+
				// See: https://github.com/nodejs/node/blob/627524973a22c584fdd06c951fbe82364927a1ed/lib/buffer.js#L67
				let arrClone = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength)
				Object["setPrototypeOf"](arrClone, Buffer.prototype);
				return <any>arrClone;
			}
			else
			{
				let len = arr.length;
				let buf = new Buffer(len);

				for (let i = 0; i < len; i++)
					buf[i] = arr[i];

				return buf;
			}
		}

		static bufferToUint8Array(buf: Buffer): Uint8Array
		{
			if (Buffer.prototype instanceof Uint8Array)
			{
				return new Uint8Array(buf["buffer"], buf["byteOffset"], buf["byteLength"]);
			}
			else
			{
				let len = buf.length;
				let arr = new Uint8Array(len);

				for (let i = 0; i < len; i++)
					arr[i] = buf[i];

				return arr;
			}
		}
	}
} 