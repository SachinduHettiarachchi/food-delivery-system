import { useState } from "react";

/**
 * useLocalStorage — syncs state to localStorage
 * Usage:
 *   const [value, setValue] = useLocalStorage("key", defaultValue);
 */
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (err) {
      console.error("useLocalStorage error:", err);
    }
  };

  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (err) {
      console.error("useLocalStorage removeValue error:", err);
    }
  };

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
