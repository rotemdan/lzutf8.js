module LZUTF8
{
	export class CompressorSimpleHashTable implements CompressorHashTable
	{
		buckets: Array<number[]>;
		maximumBucketCapacity: number = 64;

		constructor(size: number)
		{
			this.buckets = new Array(size);
		}

		addValueToBucket(bucketIndex: number, valueToAdd: number)
		{
			var bucket = this.buckets[bucketIndex];

			if (bucket === undefined)
			{
				this.buckets[bucketIndex] = [valueToAdd];
			}
			else
			{
				if (bucket.length === this.maximumBucketCapacity - 1)
					ArrayTools.truncateStartingElements(bucket, this.maximumBucketCapacity / 2);

				bucket.push(valueToAdd);
			}
		}

		getArraySegmentForBucketIndex(bucketIndex: number, outputObject?: ArraySegment<number>): ArraySegment<number>
		{
			var bucket = this.buckets[bucketIndex];

			if (bucket === undefined)
				return null;

			if (outputObject === undefined)
				outputObject = new ArraySegment<number>();

			outputObject.container = bucket;
			outputObject.startPosition = 0;
			outputObject.length = bucket.length;

			return outputObject;
		}

		getUsedBucketCount(): number
		{
			return ArrayTools.countNonzeroValuesInArray(this.buckets);
		}

		getTotalElementCount(): number
		{
			var currentSum = 0;

			for (var i = 0; i < this.buckets.length; i++)
			{
				if (this.buckets[i] !== undefined)
					currentSum += this.buckets[i].length;
			}

			return currentSum;
		}
	}
}