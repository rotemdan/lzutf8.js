namespace LZUTF8
{
	export class ObjectTools
	{
		static overrideObject<T, V>(obj: T, newProperties: V): T
		{
			if (newProperties != null)
			{
				for (let property in newProperties)
					obj[property] = newProperties[property];
			}

			return obj;
		}

		static findPropertyInObject(propertyToFind, object): string
		{
			for (let property in object)
				if (object[property] === propertyToFind)
					return property;

			return null;
		}
	}
} 