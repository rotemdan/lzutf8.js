namespace LZUTF8
{
	export class CompressorCustomHashTable implements CompressorHashTable
	{
		bucketLocators: Uint32Array;
		storage: Uint32Array;

		storageIndex: number;
		minimumBucketCapacity = 4;
		maximumBucketCapacity = 64;

		constructor(bucketCount: number)
		{
			this.bucketLocators = new Uint32Array(bucketCount * 2);
			this.storage = new Uint32Array(bucketCount * 2);
			this.storageIndex = 1;
		}

		addValueToBucket(bucketIndex: number, valueToAdd: number)
		{
			bucketIndex <<= 1;

			if (this.storageIndex >= (this.storage.length >>> 1))
				this.compact();

			let startPosition = this.bucketLocators[bucketIndex];
			let length: number;

			if (startPosition === 0)
			{
				startPosition = this.storageIndex;
				length = 1;
				this.storage[this.storageIndex] = valueToAdd;
				this.storageIndex += this.minimumBucketCapacity; // Set an initial capacity for the bucket
			}
			else
			{
				length = this.bucketLocators[bucketIndex + 1];

				if (length === this.maximumBucketCapacity - 1)
					length = this.truncateBucketToNewerElements(startPosition, length, this.maximumBucketCapacity / 2);

				let endPosition = startPosition + length;

				if (this.storage[endPosition] === 0)
				{
					this.storage[endPosition] = valueToAdd;

					if (endPosition === this.storageIndex)
						this.storageIndex += length; // Double the bucket's capcaity
				}
				else
				{
					ArrayTools.copyElements(this.storage, startPosition, this.storage, this.storageIndex, length);
					startPosition = this.storageIndex;
					this.storageIndex += length;

					this.storage[this.storageIndex++] = valueToAdd;
					this.storageIndex += length; // Double the bucket's capcity
				}

				length++;
			}

			this.bucketLocators[bucketIndex] = startPosition;
			this.bucketLocators[bucketIndex + 1] = length;
		}

		private truncateBucketToNewerElements(startPosition: number, bucketLength: number, truncatedBucketLength: number)
		{
			let sourcePosition = startPosition + bucketLength - truncatedBucketLength;

			ArrayTools.copyElements(this.storage, sourcePosition, this.storage, startPosition, truncatedBucketLength);
			ArrayTools.zeroElements(this.storage, startPosition + truncatedBucketLength, bucketLength - truncatedBucketLength);

			return truncatedBucketLength;
		}

		private compact()
		{
			let oldBucketLocators = this.bucketLocators;
			let oldStorage = this.storage;

			this.bucketLocators = new Uint32Array(this.bucketLocators.length);
			this.storageIndex = 1;

			// First pass: Scan and create the new bucket locators
			for (let bucketIndex = 0; bucketIndex < oldBucketLocators.length; bucketIndex += 2)
			{
				let length = oldBucketLocators[bucketIndex + 1];

				if (length === 0)
					continue;

				this.bucketLocators[bucketIndex] = this.storageIndex;
				this.bucketLocators[bucketIndex + 1] = length;

				this.storageIndex += Math.max(Math.min(length * 2, this.maximumBucketCapacity), this.minimumBucketCapacity);
			}
			
			//
			this.storage = new Uint32Array(this.storageIndex * 8);
			//
			
			// Second pass: After storage was allocated, copy the old data to the new buckets
			for (let bucketIndex = 0; bucketIndex < oldBucketLocators.length; bucketIndex += 2)
			{
				let sourcePosition = oldBucketLocators[bucketIndex];

				if (sourcePosition === 0)
					continue;

				let destPosition = this.bucketLocators[bucketIndex];
				let length = this.bucketLocators[bucketIndex + 1];

				ArrayTools.copyElements(oldStorage, sourcePosition, this.storage, destPosition, length);
			}

			//log("Total allocated storage in hash table: " + this.storageIndex + ", new capacity: " + this.storage.length);
		}

		getArraySegmentForBucketIndex(bucketIndex: number, outputObject?: ArraySegment<number>): ArraySegment<number>
		{
			bucketIndex <<= 1;

			let startPosition = this.bucketLocators[bucketIndex];

			if (startPosition === 0)
				return null;

			if (outputObject === undefined)
				outputObject = new ArraySegment<number>();

			outputObject.container = this.storage;
			outputObject.startPosition = startPosition;
			outputObject.length = this.bucketLocators[bucketIndex + 1];

			return outputObject;
		}

		getUsedBucketCount(): number
		{
			return Math.floor(ArrayTools.countNonzeroValuesInArray(this.bucketLocators) / 2);
		}

		getTotalElementCount(): number
		{
			let result = 0;

			for (let i = 0; i < this.bucketLocators.length; i += 2)
				result += this.bucketLocators[i + 1];

			return result;
		}
	}
}