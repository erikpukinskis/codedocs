import React from "react"
import * as styles from "./SearchBox.css"
import type { SearchBoxProps } from "~/ComponentTypes"

export const SearchBox = ({ inputProps, onClickClear }: SearchBoxProps) => {
  return (
    <div className={styles.styledSearchBox}>
      <input
        className={styles.styledSearchInput}
        {...inputProps}
        type="text"
        placeholder="Search"
      />
      <div className={styles.styledKeys}>
        <div className={styles.styledKey}>
          {/Mac/.test(window.navigator.platform) ? (
            <>&#8984;</>
          ) : (
            <WindowsKey />
          )}
        </div>
        +<div className={styles.styledKey}>K</div>
      </div>
      {inputProps.value ? <ClearButton onClick={onClickClear} /> : null}
    </div>
  )
}

type ClearButtonProps = {
  onClick: () => void
}

const ClearButton = ({ onClick }: ClearButtonProps) => {
  return (
    <button onClick={onClick} className={styles.styledClearButton}>
      <div className={styles.clearButtonTarget}>&times;</div>
    </button>
  )
}

const WindowsKey = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="17 17 60 60"
    width="8"
    height="8"
    fill="currentColor"
    overflow="visible"
  >
    <polyline points="0 12.5 35.7 7.6 35.7 42.1 0 42.1" />
    <polyline points="40 6.9 87.3 0 87.3 41.8 40 41.8" />
    <polyline points="0 45.74 35.7 45.74 35.7 80.34 0 75.34" />
    <polyline points="40 46.2 87.3 46.2 87.3 87.6 40 80.9" />
  </svg>
)
