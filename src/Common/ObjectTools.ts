namespace LZUTF8 {
	export namespace ObjectTools {
		export const override = function <T extends V, V>(obj: T, newPropertyValues: V): T {
			return extend(obj, newPropertyValues);
		}

		export const extend = function <T, V>(obj: T, newProperties: V): T & V {
			if (obj == null)
				throw new TypeError("obj is null or undefined");

			if (typeof obj !== "object")
				throw new TypeError("obj is not an object");

			if (newProperties == null)
				newProperties = <any>{};

			if (typeof newProperties !== "object")
				throw new TypeError("newProperties is not an object");

			if (newProperties != null) {
				for (const property in newProperties)
					obj[<string>property] = newProperties[property];
			}

			return <T & V>obj;
		}
	}
}
