import React, { forwardRef } from "react"
import type { SearchBoxProps } from "@/ComponentTypes"
import { styled } from "@stitches/react"

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(
  function SearchBox(
    { value, onChange, onFocus, onBlur, onKeyPress },
    inputRef
  ) {
    return (
      <StyledSearchBox>
        <StyledSearchInput
          ref={inputRef}
          type="text"
          placeholder="Search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyPress}
        />
        <StyledKeys>
          <StyledKey>command</StyledKey>
          <StyledKey>shift</StyledKey>
          <StyledKey>F</StyledKey>
        </StyledKeys>
        {value ? <ClearButton setValue={onChange} /> : null}
      </StyledSearchBox>
    )
  }
)

type ClearButtonProps = {
  setValue: (newValue: string) => void
}

const ClearButton = ({ setValue }: ClearButtonProps) => (
  <StyledClearButton onClick={() => setValue("")}>
    <ClearButtonTarget>&times;</ClearButtonTarget>
  </StyledClearButton>
)

const ClearButtonTarget = styled("div", {
  "background": "#AAA",
  "width": 20,
  "height": 20,
  "lineHeight": "21px",
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
  padding: "none",
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
})

const StyledKey = styled("div", {
  color: "#888",
  borderRadius: 6,
  fontSize: "0.6em",
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
