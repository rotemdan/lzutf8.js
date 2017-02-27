namespace LZUTF8 {
	export class CompressorSimpleHashTable implements CompressorHashTable {
		buckets: Array<number[]>;
		maximumBucketCapacity: number = 64;

		constructor(size: number) {
			this.buckets = new Array(size);
		}

		addValueToBucket(bucketIndex: number, valueToAdd: number) {
			let bucket = this.buckets[bucketIndex];

			if (bucket === undefined) {
				this.buckets[bucketIndex] = [valueToAdd];
			}
			else {
				if (bucket.length === this.maximumBucketCapacity - 1)
					ArrayTools.truncateStartingElements(bucket, this.maximumBucketCapacity / 2);

				bucket.push(valueToAdd);
			}
		}

		getArraySegmentForBucketIndex(bucketIndex: number, outputObject?: ArraySegment<number>): ArraySegment<number> | null {
			let bucket = this.buckets[bucketIndex];

			if (bucket === undefined)
				return null;

			if (outputObject === undefined)
				outputObject = new ArraySegment<number>(bucket, 0, bucket.length);

			return outputObject;
		}

		getUsedBucketCount(): number {
			return ArrayTools.countNonzeroValuesInArray(this.buckets);
		}

		getTotalElementCount(): number {
			let currentSum = 0;

			for (let i = 0; i < this.buckets.length; i++) {
				if (this.buckets[i] !== undefined)
					currentSum += this.buckets[i].length;
			}

			return currentSum;
		}
	}
}
