namespace LZUTF8 {
	export interface CompressorHashTable {
		addValueToBucket(bucketIndex: number, valueToAdd: number): void;
		getArraySegmentForBucketIndex(bucketIndex: number, outputObject?: ArraySegment<number>): ArraySegment<number> | null;
		getUsedBucketCount(): number;
		getTotalElementCount(): number;
	}
}
