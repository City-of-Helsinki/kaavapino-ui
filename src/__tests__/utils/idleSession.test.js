import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SHARED_IDLE_STATE_KEY,
  broadcastSharedIdleState,
  getSharedIdleState,
  setSharedIdleState,
  subscribeToSharedIdleState
} from '../../utils/idleSession';

describe('idleSession utilities', () => {
  beforeEach(() => {
    globalThis.window.localStorage.clear();
  });

  it('stores and reads shared idle states', () => {
    setSharedIdleState({ phase: 'warning', logoutAt: 12345, updatedAt: 999 });

    expect(JSON.parse(globalThis.window.localStorage.getItem(SHARED_IDLE_STATE_KEY))).toEqual({
      phase: 'warning',
      logoutAt: 12345,
      updatedAt: 999
    });
    expect(getSharedIdleState()).toEqual({ phase: 'warning', logoutAt: 12345, updatedAt: 999 });
  });

  it('stores shared idle states through the broadcast helper', () => {
    broadcastSharedIdleState({ phase: 'active', action: 'extended', updatedAt: 67890 });

    expect(getSharedIdleState()).toEqual({ phase: 'active', action: 'extended', updatedAt: 67890 });
  });

  it('notifies subscribers about storage idle state updates from other tabs', () => {
    const onState = vi.fn();
    const unsubscribe = subscribeToSharedIdleState(onState);

    globalThis.window.dispatchEvent(
      new StorageEvent('storage', {
        key: SHARED_IDLE_STATE_KEY,
        newValue: JSON.stringify({ phase: 'warning', logoutAt: 24680, updatedAt: 1 })
      })
    );

    expect(onState).toHaveBeenCalledWith({ phase: 'warning', logoutAt: 24680, updatedAt: 1 });

    unsubscribe();
  });
});
