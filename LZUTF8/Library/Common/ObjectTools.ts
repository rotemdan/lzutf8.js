module LZUTF8
{
	export class ObjectTools
	{
		static extendObject(obj: any, newProperties: any): any
		{
			if (newProperties != null)
			{
				for (var property in newProperties)
					obj[property] = newProperties[property];
			}

			return obj;
		}

		static findPropertyInObject(propertyToFind, object): string
		{
			for (var property in object)
				if (object[property] === propertyToFind)
					return property;

			return null;
		}
	}
} 