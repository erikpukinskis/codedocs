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

type PropDefLookup<PropsType extends Record<string, AllowedPropTypes>> = {
  [key in keyof PropsType]: PropDef
}

export type ComponentDef<PropsType extends Record<string, AllowedPropTypes>> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.FC<AllowedPropTypes>
  props: PropDefLookup<PropsType>
}

export type ComponentDefLookup = Record<
  string,
  Record<string, AllowedPropTypes>
>

/**
 * Describes a node in the slot tree. The Editor receives a single root SlotDef.
 *
 * The tree is stored in React state and updated via Immer's `produce`, which
 * provides structural sharing: when a leaf prop changes, only the ancestor
 * chain gets new object references. Combined with React.memo on SlotRenderer,
 * this means only the changed branch re-renders — siblings are unaffected.
 */
export type SlotDef<PropsType extends Record<string, AllowedPropTypes>> = {
  /** A unique identifier */
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.FC<PropsType>
  /**
   * Primitive props are passed through directly. Object-valued props are
   * assumed to be nested SlotDefs and rendered recursively via SlotRenderer.
   * If we ever need literal object props, we'll need a wrapper (e.g. a Slot
   * class) to disambiguate.
   */
  props: PropsType
}

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
