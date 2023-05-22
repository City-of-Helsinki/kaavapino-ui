import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import InactiveMessage from './InactiveMessage';
import { useIsMount } from '../../hooks/IsMounted';
import { useHistory } from "react-router-dom";
import 'react-toastify/dist/ReactToastify.min.css';
import userManager from '../../utils/userManager'
//import { processSilentRenew } from 'redux-oidc'


function IdleMonitor() {
  const history = useHistory();
  const isMount = useIsMount();
  const [idleModal, setIdleModal] = useState(false);
  let idleTimeout = 1000 * 1 * 60;  //1 minute
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

/*   async function getUser() {
    const user = await userManager.getUser();
    if (!user) {
      console.log("not user")
      return await userManager.signinSilentCallback();
    }
    console.log(user)
   // userManager.storeUser(user)
    //userManager.signinSilent()
    return user;
  } */

  const extendSession = () => {
    setIdleModal(false);
    clearTimeout(idleEvent);
    clearTimeout(idleLogoutEvent);
    console.log("extend session")
    //userManager.signinSilentCallback();
    userManager.signinSilent()
/*     getUser().then(() => {
      processSilentRenew()
    })
    .catch((error) => {
        console.error('Error extending session',error)
    }) */
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
    {autoClose:3000,pauseOnHover: false,position: toast.POSITION.BOTTOM_LEFT}
  );

  return (
    <>
      <ToastContainer />
    </>
  )

}

export default IdleMonitor;