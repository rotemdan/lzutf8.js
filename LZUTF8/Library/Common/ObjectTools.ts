module LZUTF8
{
	export class ObjectTools
	{
		static setDefaultPropertiesIfNotSet(properties: any, defaultProperties: any)
		{
			var resultObject = {};

			if (properties)
			{
				for (var propertyName in properties)
					resultObject[propertyName] = properties[propertyName];
			}
			else
				properties = {};

			for (var propertyName in defaultProperties)
				if (properties[propertyName] == undefined)
					resultObject[propertyName] = defaultProperties[propertyName];

			return resultObject;
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