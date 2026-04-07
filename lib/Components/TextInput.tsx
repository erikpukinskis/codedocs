import * as styles from "./TextInput.css"
import type { TextInputProps } from "~/ComponentTypes"

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  width = "100%",
}) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={styles.input}
    style={{ width }}
  />
)
