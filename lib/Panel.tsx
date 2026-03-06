import { without } from "lodash"
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { generate } from "short-uuid"
import { useComponents } from "./ComponentContext"
import { makeUninitializedContext } from "~/helpers/makeUninitializedContext"

type Panels = {
  left: PanelState
}

type PanelContextValue = {
  panels: Panels
  dispatch: React.Dispatch<PanelAction>
}

type PanelState = {
  ids: string[]
}

const PanelContext = createContext(
  makeUninitializedContext<PanelContextValue>(
    "Cannot use PanelContext outside of a PanelProvider"
  )
)

type PanelAction =
  | {
      type: "register"
      panel: keyof Panels
      id: string
    }
  | {
      type: "unregister"
      panel: keyof Panels
      id: string
    }
  | {
      type: "open"
      panel: keyof Panels
      id: string
    }
  | {
      type: "close"
      panel: keyof Panels
      id: string
    }

function panelReducer(panels: Panels, action: PanelAction): Panels {
  switch (action.type) {
    case "register":
      return {
        ...panels,
        [action.panel]: {
          ...panels[action.panel],
          ids: [...panels[action.panel].ids, action.id],
        },
      }
    case "unregister":
      return {
        ...panels,
        [action.panel]: {
          ...panels[action.panel],
          ids: without(panels[action.panel].ids, action.id),
        },
      }
    case "open":
      return {
        ...panels,
        [action.panel]: {
          ...panels[action.panel],
          ids: [...without(panels[action.panel].ids, action.id), action.id],
        },
      }
    case "close":
      return {
        ...panels,
        [action.panel]: {
          ...panels[action.panel],
          ids: [action.id, ...without(panels[action.panel].ids, action.id)],
        },
      }
  }
}

type PanelProps = {
  panel: keyof Panels
  title: string
  children: React.ReactNode
}

export const Panel: React.FC<PanelProps> = ({ panel, title, children }) => {
  const [id] = useState(generate)
  const { panels, dispatch } = useContext(PanelContext)
  const Components = useComponents()

  useEffect(() => {
    dispatch({ type: "register", panel, id })
    return () => {
      dispatch({ type: "unregister", panel, id })
    }
  }, [id, panel])

  const { ids } = panels[panel]
  const isOpen = ids[ids.length - 1] === id
  const hasNeighbors = ids.length > 1
  const element = document.getElementById(`panel-outlet-${panel}`)

  if (!element) return null

  return createPortal(
    <Components.Panel
      hasNeighbors={hasNeighbors}
      role="region"
      id={`panel-${id}`}
      data-component="Panel"
    >
      <label htmlFor={`panel-${id}`} style={{ display: "none" }}>
        {title}
      </label>
      <Components.PanelHeader
        aria-label={`open ${title} panel`}
        aria-controls={`panel-${id}`}
        aria-expanded={isOpen}
        disabled={isOpen}
        onClick={() => {
          if (isOpen) return
          dispatch({ type: "open", panel, id })
        }}
        isOpen={hasNeighbors ? isOpen : undefined}
      >
        {title}
      </Components.PanelHeader>
      {isOpen && children}
    </Components.Panel>,
    element
  )
}

type PanelProviderProps = {
  children: React.ReactNode
}

export const PanelProvider: React.FC<PanelProviderProps> = ({ children }) => {
  const [panels, dispatch] = useReducer(panelReducer, { left: { ids: [] } })

  return <PanelContext value={{ panels, dispatch }}>{children}</PanelContext>
}

type PanelOutletProps = {
  panel: keyof Panels
}

export const PanelOutlet: React.FC<PanelOutletProps> = ({ panel }) => {
  return (
    <div
      role="region"
      id={`panel-outlet-${panel}`}
      data-component="PanelOutlet"
    ></div>
  )
}
