module LZUTF8
{
	export class ArraySegment<T>
	{
		container: IndexableCollection<T>;
		startPosition: number;
		length: number;

		get(index: number): T
		{
			return this.container[this.startPosition + index];
		}

		getInReversedOrder(reverseIndex: number)
		{
			return this.container[this.startPosition + this.length - 1 - reverseIndex];
		}

		set(index: number, value: T)
		{
			this.container[this.startPosition + index] = value;
		}
	}

	export interface ArraySegmentLocator
	{
		startPosition: number;
		length: number;
	}

	export interface IndexableCollection<T>
	{
		[index: number]: T;
		length: number;
	}
}