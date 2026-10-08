import { useCallback, useState } from "react";

export function useToggle(initialValue = false) {
  const [isOn, setIsOn] = useState(initialValue);
  const toggle = useCallback(() => setIsOn((value) => !value), []);
  return { isOn, toggle };
}
