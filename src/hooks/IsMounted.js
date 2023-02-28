import { useRef, useEffect } from 'react';
//Hook to check for first time mount.
//Usage example: Want to skip first time render on useEffect with depencency but check dependency normally after that.
export const useIsMount = () => {
  const isMountRef = useRef(true);
  useEffect(() => {
    isMountRef.current = false;
  }, []);
  return isMountRef.current;
};