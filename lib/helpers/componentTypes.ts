// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AllowedPropTypes = any

export type BasicPropValue = string | boolean | number | SlotId

export type SlotId = { __slotId: string }

export function slotId(id: string): SlotId {
  return { __slotId: id }
}

export function isSlotId(value: unknown): value is SlotId {
  if (!value) return false
  return typeof (value as SlotId).__slotId === "string"
}

type PropDef =
  | {
      type: "string"
      value: string
    }
  | {
      type: "slot"
      value: React.ReactNode | SlotId
    }

export type PropDefLookup<PropsType extends Record<string, AllowedPropTypes>> =
  {
    [key in keyof PropsType]: PropDef
  }

/**
 * A SlotDef represents both a component definition (like in a palette) and an
 * instance of that component (in a mockup tree). When dragging from a palette,
 * the SlotDef is cloned, and the clone's prop values can be edited independently.
 */
export type SlotDef<PropsType extends Record<string, AllowedPropTypes>> = {
  /**
   * A unique identifier for this slot instance
   */
  id: string
  /**
   * The React component to render
   */
  component: React.FC<PropsType>
  /**
   * Prop definitions with values. For slot props, the value can be a SlotId
   * reference to another slot in the tree.
   */
  props: PropDefLookup<PropsType>
}

/**
 * Constraint type for used in generics (<Props extends PropsLookup>). Not
 * intended to be used directly.
 */
export type PropsLookup = Record<string, Record<string, AllowedPropTypes>>

/**
 * Returns true if the propName refers to a slot (a prop of type
 * React.ReactNode) that is empty (undefined or null).
 *
 * Once a component has been dragged off the palette, we use this function
 * inside the Slot component to figure out which slots are available, and swap
 * in an EmptySlot so there is a drop target
 */
export function isEmptySlot(
  slotDef: SlotDef<Record<string, unknown>>,
  propName: string
): boolean {
  const propDef = slotDef.props[propName]

  if (!propDef) {
    throw new Error(`PropDef for ${propName} not found in slot ${slotDef.id}`)
  }

  if (propDef.value != null) return false

  // Check if it's a slot type
  return propDef.type === "slot"
}

/**
 * Constraint type for used in generics (<SlotDefs extends SlotDefLookup>). Not
 * intended to be used directly.
 */
export type SlotDefLookup = Record<
  string,
  SlotDef<Record<string, AllowedPropTypes>>
>
