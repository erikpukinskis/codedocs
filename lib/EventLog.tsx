import { styled, keyframes } from "@stitches/react"
import React from "react"

export type CallbackEvent = {
  id: string
  name: string
  args: unknown[]
  time: number
}

const fadeOut = keyframes({
  "0%": {
    opacity: 1,
  },
  "100%": {
    display: "none",
  },
})

const EventLogBase = styled("ul", {
  position: "absolute",
  padding: 0,
  zIndex: 1,
  margin: 0,
})

const EventItemBase = styled("li", {
  fontSize: "0.8em",
  listStyle: "none",
  marginTop: 8,
  marginLeft: 0,
  marginRight: 0,
  marginBottom: 0,
  background: "#c1ffc5",
  padding: "4px 6px",
  borderRadius: 4,
  boxSizing: "border-box",
  animation: `${fadeOut.name} 1s linear 2s forwards`,
  boxShadow: "0px 0px 8px 0px rgba(47, 255, 0, 0.3)",
})

const EventName = styled("span", {
  fontWeight: "bold",
  background: "white",
  padding: "2px 4px",
  borderRadius: 4,
  display: "inline-block",
})

const Arg = styled("span", {
  background: "white",
  padding: "2px 4px",
  borderRadius: 4,
  display: "inline-block",
})

export const EventLog: React.FC<{ events: CallbackEvent[] }> = ({ events }) => {
  if (events.length === 0) return null

  return (
    <EventLogBase>
      {events.map((event) => {
        return <EventItem name={event.name} args={event.args} key={event.id} />
      })}
    </EventLogBase>
  )
}

/**
 * Formats a single value for display in the event log:
 *
 *  - Scalars (String, Number, Boolean, null, undefined) are displayed as
 *    their JSON string representation
 *
 *  - DOM elements are displayed as their tag name (<div>, <button>, etc)
 *
 *  - Functions are displayed as their function name "function myCallback" or
 *    "function" if unnamed
 *
 *  - React synthetic events are displayed as their native event type
 *    (MouseEvent, KeyboardEvent, etc)
 *
 *  - Other objects are displayed as their constructor name or "Object"
 */
function formatValue(value: unknown): React.ReactNode {
  // Check for null/undefined
  if (value === null) return "null"
  if (value === undefined) return "undefined"

  // Check for scalars (string, number, boolean)
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return JSON.stringify(value)
  }

  if (value instanceof Date) {
    if (value.toDateString() === new Date().toDateString()) {
      return value.toLocaleTimeString()
    } else {
      return value.toLocaleString()
    }
  }
  // Check for functions
  if (typeof value === "function") {
    const funcName = value.name
    return funcName ? (
      <>
        <b>function</b> {funcName}
      </>
    ) : (
      <b>function</b>
    )
  }

  // Check for DOM elements
  if (value instanceof Element) {
    return `<${value.tagName.toLowerCase()}>`
  }
  if (value && typeof value === "object" && "tagName" in value) {
    const tagName = (value as { tagName: string }).tagName
    return `<${
      typeof tagName === "string" ? tagName.toLowerCase() : "element"
    }>`
  }

  // Check for React synthetic events - get the native event type
  if (value && typeof value === "object" && "nativeEvent" in value) {
    const nativeEvent = (value as { nativeEvent: unknown }).nativeEvent
    if (nativeEvent && typeof nativeEvent === "object") {
      const nativeConstructor = (
        nativeEvent as { constructor?: { name?: string } }
      ).constructor
      const nativeName = nativeConstructor?.name
      if (nativeName) {
        return nativeName
      }
    }
    return "SyntheticEvent"
  }

  // For other objects, display constructor name or "Object"
  if (value && typeof value === "object") {
    const constructor = (value as { constructor?: { name?: string } })
      .constructor
    const constructorName = constructor?.name
    return constructorName && constructorName !== "Object"
      ? constructorName
      : "Object"
  }

  return "unknown"
}

/**
 * Presents an unknown array of function arguments as inline HTML elements.
 *
 * If there is a single argument which is an object, all values are
 * displayed as key-value pairs. e.g.:
 *
 *   { foo: "bar", baz: 123, fun: function myCallback }
 *
 * Otherwise, the arguments are displayed comma separated, e.g.:
 *
 *   "foo", 12.2, function myCallback
 */
function argsDescription(args: unknown[]): React.ReactNode {
  if (args.length === 0) return "no args"

  // Check if single argument that is a plain object (but not null, not array, not function, not DOM element, not event)
  if (
    args.length === 1 &&
    args[0] !== null &&
    typeof args[0] === "object" &&
    !Array.isArray(args[0]) &&
    !(args[0] instanceof Element) &&
    !("nativeEvent" in args[0])
  ) {
    const obj = args[0] as Record<string, unknown>
    return Object.entries(obj).map(([key, value], i) => (
      <React.Fragment key={i}>
        {i > 0 ? ", " : null}
        {key}: {formatValue(value)}
      </React.Fragment>
    ))
  }

  // Otherwise, comma-separated list of arguments
  return args.map((argValue, i) => (
    <React.Fragment key={i}>
      {i > 0 ? ", " : null}
      <Arg key={i}>{formatValue(argValue)}</Arg>
    </React.Fragment>
  ))
}

type EventItemProps = {
  name: string
  args: unknown[]
}

const EventItem: React.FC<EventItemProps> = ({ name, args }) => {
  return (
    <EventItemBase>
      Called <EventName>{name}</EventName> with {argsDescription(args)}
    </EventItemBase>
  )
}
