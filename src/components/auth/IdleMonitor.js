import React, { useState, useEffect } from 'react';
import InactiveMessage from './InactiveMessage';
import { useIsMount } from '../../hooks/IsMounted';
import { useHistory } from "react-router-dom";
import { processSilentRenew } from 'redux-oidc'
import toast, { Toaster } from 'react-hot-toast';


function IdleMonitor() {
  const history = useHistory();
  const isMount = useIsMount();
  const [idleModal, setIdleModal] = useState(false);
  let idleTimeout = 1000 * 1 * 30;  //1 minute
  let idleLogout = 1000 * 10 * 60; //10 minutes
  let idleEvent;
  let idleLogoutEvent;

  //Events that track activity
  const events = [
    'mousemove',
    'click',
    'keypress'
  ];

  //Clear timeout if active events are called, show warning and logout after timeouts if not
  const sessionTimeout = () => {
     if(idleEvent){
      clearTimeout(idleEvent);
    }
    if(idleLogoutEvent) {
      clearTimeout(idleLogoutEvent);
    } 
    idleEvent = setTimeout(() => setIdleModal(true), idleTimeout); //show session warning.
    idleLogoutEvent = setTimeout(() => logOut(), idleLogout); //Call logout if user did not react to warning.
  };

  const extendSession = () => {
    setIdleModal(false);
    toast.dismiss();
    clearTimeout(idleEvent);
    clearTimeout(idleLogoutEvent);
    processSilentRenew()
  }

  const logOut = () => {
    let path = `/logout`;
    history.push(path);
  }

  //Check if idleModal state has changed except on first load
  useEffect(() => {
    if(!isMount){
      if(idleModal){
        toastWarn(idleModal)
      }
      else{
        toastSuccess(idleModal)
      }
    } 
  }, [idleModal]);

  //Add and remove event listeners for session timeout
  useEffect(() => {
    for (let e in events) {
      window.addEventListener(events[e], sessionTimeout);
    }

    return () => {
      for (let e in events) {
        window.removeEventListener(events[e], sessionTimeout);
      }
    }
  }, []);

  //Toast message components
  const toastWarn = (idleModal) => toast.error(
    <InactiveMessage idleModal={idleModal} extendSession={extendSession} />, 
    {duration:600000,position: 'bottom-left' }
  );
  
  const toastSuccess = (idleModal) => toast.success(
    <InactiveMessage idleModal={idleModal} />, 
    {duration:1000,position: 'bottom-left'}
  );

  return (
    <div>
      <Toaster />
    </div>
  )

}

export default IdleMonitor;