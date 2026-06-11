import React, { useEffect, useRef, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useHistory } from 'react-router-dom';

import InactiveMessage from './InactiveMessage';
import {
  broadcastSharedIdleState,
  getSharedIdleState,
  subscribeToSharedIdleState
} from '../../utils/idleSession';

import 'react-toastify/dist/ReactToastify.min.css';

const IDLE_WARNING_TIMEOUT = 1000 * 50 * 60;
const IDLE_LOGOUT_TIMEOUT = 1000 * 60 * 60;
const ACTIVITY_SYNC_INTERVAL = 5000;
const STALE_TIMER_THRESHOLD = 1000 * 60;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'focus'];

const createActiveState = (lastActivityAt = Date.now(), action = 'activity') => ({
  phase: 'active',
  action,
  lastActivityAt,
  updatedAt: Date.now()
});

const createWarningState = lastActivityAt => ({
  phase: 'warning',
  lastActivityAt,
  logoutAt: lastActivityAt + IDLE_LOGOUT_TIMEOUT,
  updatedAt: Date.now()
});

function IdleMonitor() {
  const history = useHistory();
  const [toastState, setToastState] = useState(null);
  const warningTimeoutRef = useRef(null);
  const logoutTimeoutRef = useRef(null);
  const sharedStateRef = useRef(getSharedIdleState() ?? createActiveState());
  const lastSyncedActivityRef = useRef(0);
  const warningToastIdRef = useRef(null);
  const successToastIdRef = useRef(null);

  const clearTimers = () => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
  };

  const dismissToast = toastIdRef => {
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  };

  const logOut = () => {
    history.push('/logout');
  };

  const refreshActivityFromStaleState = () => {
    const refreshedState = createActiveState();
    sharedStateRef.current = refreshedState;
    lastSyncedActivityRef.current = refreshedState.lastActivityAt;
    broadcastSharedIdleState(refreshedState);
    enterState(refreshedState);
  };

  const scheduleWarning = (state) => {
    const scheduledAt = Date.now();
    const delay = Math.max(IDLE_WARNING_TIMEOUT - (scheduledAt - state.lastActivityAt), 0);
    const expectedFireAt = scheduledAt + delay;

    const onWarningTimeout = () => {
      const latestState = getSharedIdleState() ?? sharedStateRef.current;
    
      // Refresh state if the logout timer expired while the window was closed
      const firedLateBy = Date.now() - expectedFireAt;
      if (firedLateBy > STALE_TIMER_THRESHOLD) {
        refreshActivityFromStaleState();
        return;
      }

      if (latestState.phase === 'warning') {
        enterState(latestState);
        return;
      }

      if (Date.now() - latestState.lastActivityAt >= IDLE_WARNING_TIMEOUT) {
        const warningState = createWarningState(latestState.lastActivityAt);
        broadcastSharedIdleState(warningState);
        enterState(warningState);
        return;
      }

      enterState(latestState);
    };
    warningTimeoutRef.current = setTimeout(onWarningTimeout, delay);
  };

  const scheduleLogout = (state) => {
    const scheduledAt = Date.now();
    const delay = Math.max(state.logoutAt - scheduledAt, 0);
    const expectedFireAt = scheduledAt + delay;

    const onLogoutTimeout = (scheduledState) => {
      const latestState = getSharedIdleState() ?? scheduledState;

      // Refresh state if the logout timer expired while the window was closed
      const firedLateBy = Date.now() - expectedFireAt;
      if (firedLateBy > STALE_TIMER_THRESHOLD) {
        refreshActivityFromStaleState();
        return;
      }

      if (latestState.phase === 'active') {
        enterState(latestState);
        return;
      }

      if (latestState.logoutAt <= Date.now()) {
        logOut();
        return;
      }
      enterState(latestState);
    };
    logoutTimeoutRef.current = setTimeout(
      () => onLogoutTimeout(state), delay
    );
  };

  const enterState = (state) => {
    const enterWarningState = () => {
      setToastState('warning');
      clearTimers();
      scheduleLogout(state);
    };
    const enterActiveState = () => {
      setToastState(state.action === 'extended' ? 'success' : null);
      clearTimers();
      scheduleWarning(state);
    };

    sharedStateRef.current = state;
    if (state.phase === 'warning') {
      enterWarningState();
    } else {
      enterActiveState();
    }
  };

  const recordActivity = (forceSync) => {
    if (sharedStateRef.current.phase === 'warning') {
      return;
    }

    const nextState = createActiveState();
    sharedStateRef.current = nextState;
    enterState(nextState);

    if (forceSync || nextState.lastActivityAt - lastSyncedActivityRef.current >= ACTIVITY_SYNC_INTERVAL) {
      lastSyncedActivityRef.current = nextState.lastActivityAt;
      broadcastSharedIdleState(nextState);
    }
  };

  const extendSession = () => {
    const nextState = createActiveState(Date.now(), 'extended');
    lastSyncedActivityRef.current = nextState.lastActivityAt;
    broadcastSharedIdleState(nextState);
    enterState(nextState);
  };

  useEffect(() => {
    if (toastState === 'warning') {
      dismissToast(successToastIdRef);
      warningToastIdRef.current = toast.warning(
        <InactiveMessage idleModal={true} extendSession={extendSession} durationMs={sharedStateRef?.current.logoutAt - Date.now()} />,
        { autoClose: 600000, pauseOnHover: false, position: toast.POSITION.BOTTOM_LEFT }
      );
    } else if (toastState === 'success') {
      dismissToast(warningToastIdRef);
      successToastIdRef.current = toast.success(
        <InactiveMessage idleModal={false} />,
        { autoClose: 2000, pauseOnHover: false, position: toast.POSITION.BOTTOM_LEFT }
      );
    }
  }, [toastState]);

  useEffect(() => {
    const onActivity = () => {
      recordActivity(false);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        recordActivity(true);
      }
    };

    const unsubscribeSharedIdleState = subscribeToSharedIdleState(state => {
      if (state.updatedAt < sharedStateRef.current.updatedAt) {
        return;
      }
      enterState(state);
    });

    ACTIVITY_EVENTS.forEach(eventName => {
      globalThis.addEventListener(eventName, onActivity);
    });
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (sharedStateRef.current.phase === 'warning' && sharedStateRef.current.logoutAt > Date.now()) {
      enterState(sharedStateRef.current);
    } else {
      refreshActivityFromStaleState();
    }

    return () => {
      unsubscribeSharedIdleState();
      ACTIVITY_EVENTS.forEach(eventName => {
        globalThis.removeEventListener(eventName, onActivity);
      });
      document.removeEventListener('visibilitychange', onVisibilityChange);
      dismissToast(warningToastIdRef);
      dismissToast(successToastIdRef);
      clearTimers();
    };
  }, []);

  return (
    <div>
      <ToastContainer newestOnTop closeButton={false} />
    </div>
  );
}

export default IdleMonitor;