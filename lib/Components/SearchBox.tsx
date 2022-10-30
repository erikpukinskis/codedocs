import React from "react"
import type { SearchBoxProps } from "@/ComponentTypes"
import { styled } from "@stitches/react"

export const SearchBox = ({ inputProps, onClickClear }: SearchBoxProps) => {
  return (
    <StyledSearchBox>
      <StyledSearchInput {...inputProps} type="text" placeholder="Search" />
      <StyledKeys>
        <StyledKey>
          {/Mac/.test(window.navigator.platform) ? (
            <>&#8984;</>
          ) : (
            <WindowsKey />
          )}
        </StyledKey>
        +<StyledKey>K</StyledKey>
      </StyledKeys>
      {inputProps.value ? <ClearButton onClick={onClickClear} /> : null}
    </StyledSearchBox>
  )
}

type ClearButtonProps = {
  onClick: () => void
}

const ClearButton = ({ onClick }: ClearButtonProps) => {
  return (
    <StyledClearButton onClick={onClick}>
      <ClearButtonTarget>&times;</ClearButtonTarget>
    </StyledClearButton>
  )
}

const ClearButtonTarget = styled("div", {
  "background": "#AAA",
  "width": 20,
  "height": 20,
  "lineHeight": "21px",
  "overflow": "hidden",
  "textAlign": "center",
  "borderRadius": 9999,
  "color": "white",
  "fontSize": "1.2em",
  "cursor": "pointer",

  "&:hover": {
    background: "#BBB",
  },

  "&:active": {
    background: "#999",
  },
})

const StyledClearButton = styled("button", {
  position: "absolute",
  padding: 6,
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  height: "100%",
  right: 0,
  top: 0,
  border: "none",
  background: "none",
})

const StyledSearchBox = styled("div", {
  position: "relative",
  width: "14em",
})

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

const StyledKeys = styled("div", {
  position: "absolute",
  top: 0,
  right: 0,
  marginRight: "0.3em",
  height: "100%",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
  color: "#888",
  fontSize: "0.6em",
})

const StyledKey = styled("div", {
  borderRadius: 6,
  padding: "0.5em",
  minWidth: "1.5em",
  textAlign: "center",
  border: "1px solid #CCC",
  lineHeight: "1em",
})

const StyledSearchInput = styled("input", {
  fontSize: "0.8em",
  padding: 8,
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 6,
  border: "1px solid #CCC",

  [`&:focus + ${StyledKeys.toString()}`]: {
    display: "none",
  },

  [`&:not(:placeholder-shown) + ${StyledKeys.toString()}`]: {
    display: "none",
  },
})
