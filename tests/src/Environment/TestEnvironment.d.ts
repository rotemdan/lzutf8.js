declare function describe(description: string, testFunction: () => void): void;

declare function before(action: (done: (err?: Error) => void) => void | Promise<any>): void;
declare function after(action: (done: (err?: Error) => void) => void | Promise<any>): void;

declare function beforeEach(action: (done: (err?: Error) => void) => void | Promise<any>): void;
declare function afterEach(action: (done: (err?: Error) => void) => void | Promise<any>): void;

declare function it(expectationString: string, specFunction?: (done: (err?: Error) => void) => void | Promise<any>): void;

declare function expect(actual: any): ExpectMatcher;

interface ExpectMatcher {
	toBe(expected: any, customMessage?: string): boolean;
	toEqual(expected: any, customMessage?: string): boolean;
	toMatch(expected: string | RegExp, customMessage?: string): boolean;
	toBeDefined(customMessage?: string): boolean;
	toBeUndefined(customMessage?: string): boolean;
	toBeNull(customMessage?: string): boolean;
	toBeTruthy(customMessage?: string): boolean;
	toBeFalsy(customMessage?: string): boolean;
	toContain(expected: any, customMessage?: string): boolean;
	toBeLessThan(expected: number, customMessage?: string): boolean;
	toBeGreaterThan(expected: number, customMessage?: string): boolean;
	toBeCloseTo(expected: number, precision: number, customMessage?: string): boolean;
	toThrow(expected?: any, customMessage?: string): boolean;
	not: ExpectMatcher;
}
