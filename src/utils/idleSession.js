// Utility functions for managing idle session state across multiple tabs/windows using localStorage.
// Used for synchronizing idle session warnings and logouts across tabs.

export const SHARED_IDLE_STATE_KEY = 'kaavapino:idle-state';

const browserWindow = globalThis.window;

const parseIdleState = value => {
  if (!value) {
    return null;
  }

  try {
    const state = JSON.parse(value);
    return state?.phase ? state : null;
  } catch (error) {
    console.error('Unable to parse shared idle state.', error);
    return null;
  }
};

export const getSharedIdleState = () => {
  if (!browserWindow) {
    return null;
  }
  return parseIdleState(browserWindow.localStorage.getItem(SHARED_IDLE_STATE_KEY));
};

export const setSharedIdleState = state => {
  if (!state?.phase || !browserWindow) {
    return state ?? null;
  }
  browserWindow.localStorage.setItem(SHARED_IDLE_STATE_KEY, JSON.stringify(state));
  return state;
};

export const broadcastSharedIdleState = state => setSharedIdleState(state);

export const subscribeToSharedIdleState = onState => {
  if (!browserWindow) {
    return () => null;
  }

  const onStorage = event => {
    if (event.key !== SHARED_IDLE_STATE_KEY) {
      return;
    }
    const state = parseIdleState(event.newValue);
    if (state) {
      onState(state);
    }
  };

  browserWindow.addEventListener('storage', onStorage);

  return () => {
    browserWindow.removeEventListener('storage', onStorage);
  };
};

export default {
  getSharedIdleState,
  setSharedIdleState,
  broadcastSharedIdleState,
  subscribeToSharedIdleState
};
