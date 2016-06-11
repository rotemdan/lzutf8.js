(function (root, factory)
{
	'use strict';
	var AssertionError = function (options)
	{
		this.message = options.message;
	};
	AssertionError.prototype = Object.create(Error.prototype);
	AssertionError.prototype.toString = function ()
	{
		return this.message;
	};
	// Set up appropriately for the environment.
	if (typeof exports !== 'undefined')
	{
		// Node/CommonJS, no need for jQuery in that case.
		module.exports = factory(global, require('assert').AssertionError);
	} else if (typeof window === 'object' && typeof window.define === 'function' && window.define.amd)
	{
		// AMD
		window.define('expect', [], function ()
		{
			return factory(root, AssertionError);
		});
	} else
	{
		// Browser globals
		root.expect = factory(root, AssertionError);
	}
})(this, function (root, AssertionError)
{
	'use strict';
	var toString = Object.prototype.toString,
		hasOwnProperty = Object.prototype.hasOwnProperty;

	// If a function has no name property (IE), get the name from its string representation.
	function getFunctionName(fn)
	{
		var name = fn.name;
		if (name === undefined)
		{
			var matches = /^\s*function\s+([\w$]+)/.exec(fn);
			name = matches ? matches[1] : '';
		}
		return name;
	}

	function formatValue(value, ignoreUndefined, stack)
	{
		stack = stack || [];

		function isOnStack(value)
		{
			return stack.indexOf(value) > -1 && stack.indexOf(value) !== stack.length - 1;
		}

		if (typeof value === 'undefined')
		{
			return ignoreUndefined ? '' : 'undefined';
		}
		if (typeof value === 'function')
		{
			return 'function ' + getFunctionName(value) + '(){}';
		}
		if (typeof value === 'string')
		{
			return '"' + value + '"';
		}
		if (value === null)
		{
			return 'null';
		}
		if (value instanceof Date)
		{
			return '[Date ' + value.toUTCString() + ']';
		}
		if (value instanceof RegExp)
		{
			return value.toString();
		}
		if (value instanceof Array)
		{
			var mapped = [];
			if (!isOnStack(value, stack) && stack.length < 10)
			{
				for (var i = 0; i < value.length; i++)
				{
					mapped.push(formatValue(value[i], false, stack));
					stack.push(value[i]);
				}
			} else
			{
				mapped.push(value.toString());
			}
			return '[' + mapped.join(', ') + ']';
		}
		if (value.nodeType == 1)
		{
			return '<' + value.nodeName.toLowerCase() + ' />';
		}

		if (typeof value === 'object' && stack.length < 10)
		{
			if (value.toString() !== '[object Object]')
			{
				return '[' + value.toString() + ']';
			}
			if (isOnStack(value, stack))
			{
				return '[Circular]';
			}

			return '{' + Object.keys(value).map(function (key)
			{
				return ['"', key, '": ', formatValue(value[key], false, stack.concat(value))].join('');
			}).join(', ') + '}';
		}
		return value.toString();
	}

	// This function borrowed from underscore
	function eq(a, b, stack)
	{
		/*jshint eqnull:true*/
		// Identical objects are equal. `0 === -0`, but they aren't identical.
		// See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
		if (a === b) return a !== 0 || 1 / a == 1 / b;
		if (a == null || b == null) return a == b;
		// Invoke a custom `isEqual` method if one is provided.
		if (a.isEqual && typeof a.isEqual === 'function') return a.isEqual(b);
		if (b.isEqual && typeof b.isEqual === 'function') return b.isEqual(a);
		// Compare `[[Class]]` names.
		var className = toString.call(a);
		if (className != toString.call(b)) return false;
		switch (className)
		{
			// Strings, numbers, dates, and booleans are compared by value.
			case '[object String]':
				// Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
				// equivalent to `new String("5")`.
				return a == String(b);
			case '[object Number]':
				// `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
				// other numeric values.
				return a != +a ? b != +b : (a ? 1 / a == 1 / b : a == +b);
			case '[object Date]':
			case '[object Boolean]':
				// Coerce dates and booleans to numeric primitive values. Dates are compared by their
				// millisecond representations. Note that invalid dates with millisecond representations
				// of `NaN` are not equivalent.
				return +a == +b;
				// RegExps are compared by their source patterns and flags.
			case '[object RegExp]':
				return a.source == b.source && a.global == b.global && a.multiline == b.multiline && a.ignoreCase == b.ignoreCase;
		}
		if (typeof a != 'object' || typeof b != 'object') return false;
		// Assume equality for cyclic structures. The algorithm for detecting cyclic
		// structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
		var length = stack.length;
		while (length--)
		{
			// Linear search. Performance is inversely proportional to the number of
			// unique nested structures.
			if (stack[length] == a) return true;
		}
		// Add the first object to the stack of traversed objects.
		stack.push(a);
		var size = 0,
			result = true;
		// Recursively compare objects and arrays.
		if (className == '[object Array]')
		{
			// Compare array lengths to determine if a deep comparison is necessary.
			size = a.length;
			result = size == b.length;
			if (result)
			{
				// Deep compare the contents, ignoring non-numeric properties.
				while (size--)
				{
					// Ensure commutative equality for sparse arrays.
					if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
				}
			}
		} else
		{
			// Objects with different constructors are not equivalent.
			if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
			// Deep compare objects.
			for (var key in a)
			{
				if (hasOwnProperty.call(a, key) && a[key] !== undefined)
				{
					// Count the expected number of properties.
					size++;
					// Deep compare each member.
					if (!(result = hasOwnProperty.call(b, key) && eq(a[key], b[key], stack))) break;
				}
			}
			// Ensure that both objects contain the same number of properties.
			if (result)
			{
				for (key in b)
				{
					if (hasOwnProperty.call(b, key) && b[key] !== undefined && !(size--)) break;
				}
				result = !size;
			}
		}
		// Remove the first object from the stack of traversed objects.
		stack.pop();
		return result;
	}

	function Expect(value, assertions, expr, parent)
	{
		var self = this;
		expr = expr || '';

		this.value = value;
		this.assertions = assertions || {
			pass: function ()
			{
			},
			fail: function (why)
			{
				if (typeof why === 'function')
				{
					why = why();
				}

				throw new AssertionError({ message: why });
			}
		};
		this.expr = expr;
		this.parent = parent;

		this.not = parent || new Expect(value, {
			fail: this.assertions.pass,
			pass: this.assertions.fail
		}, 'not ', this);
	}

	/*
	 * Formats an expectation string - "expected [value] [expr] [toDo] [otherVal]"
	 *
	 * value: The value that was passed into Expect
	 * expr: An optional expression to pivot on, eg "not"
	 * toDo: What the value was expected to do - eg "to equal", "to be defined" etc
	 * otherVal: Optionally give the value you're comparing against at the end of the message
	 * customMsg: An optional custom message to include
	**/
	Expect.prototype.generateMessage = function (value, expr, toDo, otherVal, customMsg)
	{
		return function ()
		{
			var message = ('expected ' + formatValue(value) + ' ' + expr + toDo + ' ' + formatValue(otherVal, true)).replace(/\s\s/g, ' ').replace(/(^\s|\s$)/g, '');

			if (customMsg)
			{
				return customMsg + ': ' + message;
			}
			return message;
		};
	};

	Expect.prototype.toEqual = function (val, customMsg)
	{
		var generateMessage = this.generateMessage(this.value, this.expr, 'to equal', val, customMsg);

		if (!eq(this.value, val, []))
		{
			return this.fail(generateMessage);
		}
		this.pass(generateMessage);
	};
	Expect.prototype.toNotEqual = function (value, customMsg)
	{
		return this.not.toEqual(value, customMsg);
	};
	Expect.prototype.toBe = function (val, customMsg)
	{
		var generateMessage = this.generateMessage(this.value, this.expr, 'to equal', val, customMsg);

		if (this.value !== val)
		{
			return this.fail(generateMessage);
		}
		this.pass(generateMessage);
	};
	Expect.prototype.toBeTruthy = function (customMsg)
	{
		var generateMessage = this.generateMessage(this.value, this.expr, 'to be truthy', undefined, customMsg);

		if (!!this.value)
		{
			return this.pass(generateMessage);
		}
		this.fail(generateMessage);
	};
	Expect.prototype.toBeFalsey = Expect.prototype.toBeFalsy = function (customMsg)
	{
		var generateMessage = this.generateMessage(this.value, this.expr, 'to be falsey', undefined, customMsg);

		if (!this.value)
		{
			return this.pass(generateMessage);
		}
		this.fail(generateMessage);
	};
	Expect.prototype.toBeGreaterThan = function (val, customMsg)
	{
		var generateMessage = this.generateMessage(this.value, this.expr, 'to be greater than', val, customMsg);

		if (this.value > val)
		{
			return this.pass(generateMessage);
		}
		this.fail(generateMessage);
	};
	Expect.prototype.toBeLessThan = function (val, customMsg)
	{
		var generateMessage = this.generateMessage(this.value, this.expr, 'to be less than', val, customMsg);

		if (this.value < val)
		{
			return this.pass(generateMessage);
		}
		this.fail(generateMessage);
	};
	Expect.prototype.toContain = function (val, customMsg)
	{
		var i,
			generateMessage = this.generateMessage(this.value, this.expr, 'to contain', val, customMsg);

		if (this.value.indexOf(val) > -1)
		{
			return this.pass(generateMessage);
		}
		for (i = 0; i < this.value.length; i++)
		{
			if (eq(this.value[i], val, []))
			{
				return this.pass(generateMessage);
			}
		}
		this.fail(generateMessage);
	};
	Expect.prototype.toMatch = function (regex, customMsg)
	{
		var generateMessage = this.generateMessage(this.value, this.expr, 'to match', regex, customMsg);

		if (typeof regex === 'string')
		{
			regex = new RegExp(regex);
		}

		if (!regex.test)
		{
			throw new Error('unexpected object provided to Expect.toMatch: ' + JSON.stringify(regex));
		}

		if (regex.test(this.value))
		{
			return this.pass(generateMessage);
		}
		return this.fail(generateMessage);
	};
	Expect.prototype.toBeDefined = function (customMsg)
	{
		var generateMessage = this.generateMessage(this.value, this.expr, 'to be defined', undefined, customMsg);

		if (typeof this.value !== 'undefined')
		{
			return this.pass(generateMessage);
		}
		this.fail(generateMessage);
	};
	Expect.prototype.toBeUndefined = function (customMsg)
	{
		var generateMessage = this.generateMessage(this.value, this.expr, 'to be undefined', undefined, customMsg);

		if (typeof this.value === 'undefined')
		{
			return this.pass(generateMessage);
		}
		this.fail(generateMessage);
	};
	Expect.prototype.toBeNull = function (customMsg)
	{
		var generateMessage = this.generateMessage(this.value, this.expr, 'to be null', undefined, customMsg);

		if (this.value === null)
		{
			return this.pass(generateMessage);
		}
		this.fail(generateMessage);
	};
	Expect.prototype.toThrow = function (error, customMsg)
	{
		var errorMessage,
			thrownError;

		if (typeof this.value !== 'function')
		{
			return this.fail('to be a function');
		}
		if (typeof error === 'string')
		{
			errorMessage = error;
		}
		else if (error instanceof Error)
		{
			errorMessage = error.message;
		}

		try
		{
			this.value();
		} catch (e)
		{
			thrownError = e;
		}
		if (!thrownError)
		{
			return this.fail('to throw an exception', undefined, customMsg);
		}
		if (errorMessage && thrownError.message !== errorMessage)
		{
			return this.fail('to throw', errorMessage, customMsg);
		}
		this.pass();
	};
	Expect.prototype.toBeCloseTo = function (val, precision, customMsg)
	{
		var generateMessage = this.generateMessage(this.value, this.expr, 'to be close to', val, customMsg);

		if (precision !== 0)
		{
			precision = precision || 2;
		}
		if (Math.abs(val - this.value) < Math.pow(10, -precision) / 2)
		{
			return this.pass(generateMessage);
		}
		this.fail(generateMessage);
	};

	Expect.prototype.pass = function (why)
	{
		this.assertions.pass(why);
	};

	Expect.prototype.fail = function (why, what, customMsg)
	{
		var message;

		if (typeof why !== 'function')
		{
			message = this.generateMessage(this.value, this.expr, why || '', what, customMsg);
		} else
		{
			message = why();
		}

		this.assertions.fail(message);
	};

	root.expect = function (value)
	{
		return new Expect(value);
	};
	root.expect.addAssertion = function (name, matcher)
	{
		Expect.prototype[name] = matcher;
	};
	return root.expect;
});