import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useEffect, useState } from "react"
import type { Path } from "slate"
import { Transforms } from "slate"
import { useSlate } from "slate-react"
import { isLinkElement, type LinkElement as LinkElementNode } from "./types"
import { useComponents } from "~/ComponentContext"

type LinkToolbarContentProps = {
  pinOpen: () => void
  unpinOpen: () => void
  linkPath: Path
  linkNode: LinkElementNode
}

export const LinkToolbarContent: React.FC<LinkToolbarContentProps> = ({
  linkPath,
  linkNode,
  pinOpen,
  unpinOpen,
}) => {
  const editor = useSlate()
  const Components = useComponents()
  const [isEditing, setIsEditing] = useState(false)
  const [url, setUrl] = useState(() => linkNode.url)
  // TODO: Use a ref to keep unpinOpen fresh so we don't rely on it being memoized. (remove the memoization on this and pinOpen)
  useEffect(() => {
    return () => {
      unpinOpen()
    }
  }, [unpinOpen])

  const save = () => {
    if (url !== linkNode.url) {
      Transforms.setNodes(editor, { url }, { at: linkPath })
    }
    setIsEditing(false)
    unpinOpen()
  }

  const cancel = () => {
    setUrl(linkNode.url)
    setIsEditing(false)
    unpinOpen()
  }

  const remove = () => {
    Transforms.unwrapNodes(editor, {
      at: linkPath,
      match: isLinkElement,
    })
    setIsEditing(false)
    unpinOpen()
  }

  const href = isEditing ? url : linkNode.url

  return isEditing ? (
    <>
      <Components.TextInput
        value={url}
        onChange={setUrl}
        width="200px"
        onEnterPress={save}
      />
      <Components.Button variant="borderless" onClick={cancel}>
        Cancel
      </Components.Button>
      <Components.Button variant="borderless" onClick={save}>
        Save
      </Components.Button>
    </>
  ) : (
    <>
      <Components.LinkButton to={href} variant="borderless">
        <FontAwesomeIcon icon="arrow-up-right-from-square" size="xs" />{" "}
        {getHost(href)}
      </Components.LinkButton>
      <Components.Button
        variant="borderless"
        onClick={() => {
          pinOpen()
          setUrl(linkNode.url)
          setIsEditing(true)
        }}
      >
        <FontAwesomeIcon icon="pen-to-square" size="xs" /> Edit
      </Components.Button>
      <Components.Button variant="borderless" onClick={remove}>
        <FontAwesomeIcon icon="trash-can" size="xs" /> Remove
      </Components.Button>
    </>
  )
}

function getHost(url: string) {
  const match = url.match(/^https?:\/\/([^/]+)/)
  return match ? match[1] : url.slice(0, 15)
}
