import React from "react"

export const Button = ({ children }: { children: React.ReactNode }) => (
  <button
    style={{
      background: "#4c6",
      color: "white",
      padding: "8px 12px",
      border: "none",
      borderRadius: 5,
    }}
  >
    {children}
  </button>
)
