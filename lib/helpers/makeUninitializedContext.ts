/**
 * makeUninitializedContext
 * https://gist.github.com/erikpukinskis/ffc080bbd087df7ee4567421c186ae13
 *
 * Copyright 2023 Erik Pukinskis
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the “Software”), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Creates a proxy object that matches the type of your React Context, but errors when you try to access anything on it.
 *
 * Useful as the argument to React.createContext, when you often don't have the state necessary to build a functioning context yet:
 *
 *        const MyContext = React.createContext(
 *          makeUninitializedContext<MyContextValue>(
 *            "MyContext cannot be used outside of <MyContext.Provider>"
 *          )
 *        )
 *
 * @param message Error message to throw when the context is used before being initialized
 * @returns a proxy object with whatever type you specify
 */
export function makeUninitializedContext<ContextType>(message: string) {
  return new Proxy(
    {},
    {
      get(target, prop) {
        if (prop === "__isUninitializedContext") return true

        throw new Error(`${message}: tried getting context.${prop.toString()}`)
      },
    },
  ) as ContextType
}

type UnititializedContext = Record<string, unknown> & {
  __isUninitializedContext: true
}

/**
 * Tells you whether a React Context that was created with
 * `makeUninitializedContext` has been initialized or not. Useful when you want
 * to provide a fallback state for a hook that is allowed to be used outside of
 * the context provider:
 *
 *         export function useName() {
 *           const value = useContext(MyContext)
 *           return isInitialized(value) ? value.name : null
 *         }
 *
 * @param value a React Context value which may be an initialized
 * context, or a Proxy object returned by `makeUninitializedContext`
 * @returns false if `value` is the uninitialized Proxy object
 */
export function isInitialized(value: unknown) {
  if (typeof value !== "object") return true
  return !(value as UnititializedContext).__isUninitializedContext
}
