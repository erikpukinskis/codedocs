import React from "react"
import * as styles from "./CropMarks.css"

type CropMarksProps = {
  top?: boolean
  bottom?: boolean
  left?: boolean
  right?: boolean
}

export const CropMarks: React.FC = () => (
  <>
    <HorizontalMark top left />
    <HorizontalMark bottom left />
    <HorizontalMark top right />
    <HorizontalMark bottom right />

    <VerticalMark top left />
    <VerticalMark bottom left />
    <VerticalMark top right />
    <VerticalMark bottom right />
  </>
)
const MARK_LENGTH = 6
const MARK_OFFSET = 3

const HorizontalMark: React.FC<CropMarksProps> = ({ top, left }) => {
  const style: React.CSSProperties = {
    width: MARK_LENGTH,
  }

  if (left) {
    style.left = -1 * MARK_LENGTH - MARK_OFFSET
  } else {
    style.right = -1 * MARK_LENGTH - MARK_OFFSET
  }

  if (top) {
    style.top = 0
  } else {
    style.bottom = 0
  }

  return (
    <div
      className={styles.cropMark}
      data-component="CropMark"
      style={style}
    ></div>
  )
}

const VerticalMark: React.FC<CropMarksProps> = ({ top, left }) => {
  const style: React.CSSProperties = {
    height: MARK_LENGTH,
  }

  if (left) {
    style.left = 0
  } else {
    style.right = 0
  }

  if (top) {
    style.top = -1 * MARK_LENGTH - MARK_OFFSET
  } else {
    style.bottom = -1 * MARK_LENGTH - MARK_OFFSET
  }

  return <div className={styles.cropMark} style={style}></div>
}
