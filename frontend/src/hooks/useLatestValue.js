import { useEffect, useRef } from 'react';

export const useLatestValue = (value) => {
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  return valueRef;
};