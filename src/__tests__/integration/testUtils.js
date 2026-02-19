/**
 * Integration test utilities
 * Provides test store factory and wrapper components for testing Redux-connected components
 */
import { createStore, combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import projectReducer from '../../reducers/projectReducer';

/**
 * Creates a Redux store for integration testing
 * @param {Object} preloadedState - Initial state to load into the store
 * @returns {Object} Redux store with dispatch spy capabilities
 */
export function createTestStore(preloadedState = {}) {
  const rootReducer = combineReducers({
    form: formReducer,
    project: projectReducer,
  });

  const store = createStore(rootReducer, preloadedState);
  
  // Track all dispatched actions for assertions
  const dispatchedActions = [];
  const originalDispatch = store.dispatch;
  
  store.dispatch = (action) => {
    dispatchedActions.push(action);
    return originalDispatch(action);
  };
  
  store.getDispatchedActions = () => dispatchedActions;
  store.clearDispatchedActions = () => { dispatchedActions.length = 0; };
  store.findAction = (type) => dispatchedActions.find(a => a.type === type);
  store.findAllActions = (type) => dispatchedActions.filter(a => a.type === type);
  
  return store;
}

/**
 * Creates initial state simulating a project after save with a deleted group
 * This is the scenario where re-adding a group should trigger distance rule enforcement
 */
export function createPostSaveStateWithDeletedGroup() {
  return {
    project: {
      currentProject: {
        id: 1,
        attribute_data: {
          // Periaatteet phase dates (group was deleted, but old dates remain in backend)
          milloin_periaatteet_esillaolo_alkaa: '2026-02-01',
          milloin_periaatteet_esillaolo_paattyy: '2026-02-15',
          // The visibility bool is FALSE (group was deleted)
          jarjestetaan_periaatteet_esillaolo_1: false,
          // Lautakunta dates that should move when esillaolo is re-added
          milloin_periaatteet_lautakunnassa: '2026-02-20',
          periaatteet_lautakuntaan_1: true,
        },
      },
      validatingTimetable: { started: false },
    },
    form: {
      editProjectTimetableForm: {
        values: {
          milloin_periaatteet_esillaolo_alkaa: '2026-02-01',
          milloin_periaatteet_esillaolo_paattyy: '2026-02-15',
          jarjestetaan_periaatteet_esillaolo_1: false,
          milloin_periaatteet_lautakunnassa: '2026-02-20',
          periaatteet_lautakuntaan_1: true,
        },
        initial: {
          jarjestetaan_periaatteet_esillaolo_1: false,
        },
      },
    },
  };
}

/**
 * Simulates the sequence of form value changes when re-adding a group
 */
export function simulateGroupReAdd(store, groupVisBool) {
  const { change } = require('redux-form');
  const EDIT_PROJECT_TIMETABLE_FORM = 'editProjectTimetableForm';
  
  // Dispatch the change that sets the visibility bool to true (re-adding the group)
  store.dispatch(change(EDIT_PROJECT_TIMETABLE_FORM, groupVisBool, true));
  
  return store.getDispatchedActions();
}
