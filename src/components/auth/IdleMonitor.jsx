import React, { useState, useEffect } from 'react';
import InactiveMessage from './InactiveMessage';
import { useIsMount } from '../../hooks/IsMounted';
import { useHistory } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';


function IdleMonitor() {
  const history = useHistory();
  const isMount = useIsMount();
  const [idleModal, setIdleModal] = useState(false);
  let idleTimeout = 1000 * 50 * 60;  //50 minute
  let idleLogout = 1000 * 60 * 60; //60 minutes
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
    clearTimeout(idleEvent);
    clearTimeout(idleLogoutEvent);
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
  const toastWarn = (idleModal) => toast.warning(
    <InactiveMessage idleModal={idleModal} extendSession={extendSession} />, 
    {autoClose:600000,pauseOnHover: false,position: toast.POSITION.BOTTOM_LEFT }
  );
  
  const toastSuccess = (idleModal) => toast.success(
    <InactiveMessage idleModal={idleModal} />, 
    {autoClose:2000,pauseOnHover: false,position: toast.POSITION.BOTTOM_LEFT}
  );

  return (
    <div>
      <ToastContainer newestOnTop onClick={() => extendSession()} closeButton={false}/>
    </div>
  )

}

export default IdleMonitor;