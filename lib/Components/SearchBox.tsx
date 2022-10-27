import React, { forwardRef } from "react"
import type { SearchBoxProps } from "@/ComponentContext"
import { styled } from "@stitches/react"

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(
  function SearchBox({ value, onChange }, inputRef) {
    return (
      <div style={{ position: "relative", width: "14em" }}>
        <StyledKeys>
          <StyledKey>command</StyledKey>
          <StyledKey>shift</StyledKey>
          <StyledKey>F</StyledKey>
        </StyledKeys>
        <StyledSearchInput
          ref={inputRef}
          type="text"
          placeholder="Search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    )
  }
)

const StyledSearchInput = styled("input", {
  fontSize: "0.8em",
  padding: 8,
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 6,
  border: "1px solid #CCC",
})

const StyledKeys = styled("div", {
  position: "absolute",
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
})
