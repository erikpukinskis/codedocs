// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AllowedPropTypes = any

type PropDef =
  | {
      type: "string"
      default: string
      optional?: boolean
    }
  | {
      type: "slot"
      default: React.ReactNode
      optional?: boolean
    }

export type PropDefLookup<PropsType extends Record<string, AllowedPropTypes>> =
  {
    [key in keyof PropsType]: PropDef
  }

export type ComponentDef<PropsType extends Record<string, AllowedPropTypes>> = {
  component: React.FC<PropsType>
  props: PropDefLookup<PropsType>
}

/**
 * Generic component map, for contexts where we don't know the exact component types.
 */
export type ComponentDefLookup = Record<
  string,
  ComponentDef<Record<string, unknown>>
>

/**
 * Constraint type for used in generics (<Props extends PropsLookup>). Not
 * intended to be used directly.
 */
export type PropsLookup = Record<string, Record<string, AllowedPropTypes>>

/**
 * Describes a node in the slot tree. The Editor receives a single root SlotDef.
 *
 * The tree is stored in React state and updated via Immer's `produce`, which
 * provides structural sharing: when a leaf prop changes, only the ancestor
 * chain gets new object references. Combined with React.memo on SlotRenderer,
 * this means only the changed branch re-renders — siblings are unaffected.
 */
export type SlotDef<PropsType extends Record<string, AllowedPropTypes>> = {
  /**
   * A unique identifier
   */
  id: string
  /**
   * The component's props type should be the same as the props type, but we
   * can't enforce that without a pretty gnarly generic. If we ever want this to
   * be more enforced, we can use a helper function like:
   *
   *       slot<T>(def: SlotDef<T>): SlotDef<T>
   *
   * ... that forces inference at the definition site.
   */
  component: React.FC<PropsType>
  /**
   * Primitive props below are passed through to the component directly. Slots
   * (props of type React.ReactNode) can also be assigned a SlotId. When
   * rendering a Mockup, we'll detect these slot IDs and swap them out for the
   * actual rendered slot contents that we look up in the MockupContext.
   */
  props: {
    [key in keyof PropsType]: React.ReactNode extends PropsType[key]
      ? React.ReactNode | SlotId
      : PropsType[key]
  }
}

/**
 * Constraint type for used in generics (<SlotDefs extends SlotDefLookup>). Not
 * intended to be used directly.
 */
export type SlotDefLookup = Record<
  string,
  SlotDef<Record<string, AllowedPropTypes>>
>

export type BasicPropValue = string | boolean | number | SlotId

export type SlotId = { __slotId: string }

export function slotId(id: string): SlotId {
  return { __slotId: id }
}

export function isSlotId(value: unknown): value is SlotId {
  if (!value) return false
  return typeof (value as SlotId).__slotId === "string"
}
