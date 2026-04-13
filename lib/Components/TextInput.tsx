import * as styles from "./TextInput.css"
import type { TextInputProps } from "~/ComponentTypes"

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  width = "100%",
  onEnterPress,
}) => {
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onEnterPress?.()
    }
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={styles.input}
      style={{ width }}
      onKeyDown={handleKeyPress}
    />
  )
}
