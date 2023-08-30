import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux'
import { lastSavedSelector } from '../selectors/projectSelector'

export const useInterval = (callback, delay) => {
  //Used as polling for backend, could add lastSaved as general parameter later 
  //if needed with something else
  const lastSaved = useSelector(state => lastSavedSelector(state))
  const savedCallback = useRef();

  useEffect(() => {
    if(lastSaved?.status === "error"){
      savedCallback.current = callback;
    }
  }, [callback]);


  useEffect(() => {
    if(lastSaved?.status === "error"){
      if (delay !== null) {
        const id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }
  }, [delay]);

  const tick = () =>{
    savedCallback.current();
  }
}