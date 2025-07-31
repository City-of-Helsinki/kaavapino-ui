import { reducer as project, initialState } from '../../reducers/projectReducer'
import {
  FETCH_PROJECTS_SUCCESSFUL,
  FETCH_OWN_PROJECTS_SUCCESSFUL,
  FETCH_PROJECTS,
  FETCH_PROJECT_SUCCESSFUL,
  UPDATE_PROJECT,
  CREATE_PROJECT_SUCCESSFUL,
  CREATE_OWN_PROJECT_SUCCESSFUL,
  INITIALIZE_PROJECT,
  INITIALIZE_PROJECT_SUCCESSFUL,
  SAVE_PROJECT,
  SAVE_PROJECT_SUCCESSFUL,
  VALIDATE_PROJECT_FIELDS,
  VALIDATE_PROJECT_FIELDS_SUCCESSFUL,
  CHANGE_PROJECT_PHASE,
  CHANGE_PROJECT_PHASE_SUCCESSFUL,
  CHANGE_PROJECT_PHASE_FAILURE,
  PROJECT_FILE_UPLOAD_SUCCESSFUL,
  PROJECT_FILE_REMOVE_SUCCESSFUL,
  PROJECT_SET_CHECKING
} from '../../actions/projectActions'

describe('project reducer', () => {
  it('should return the initial state', () => {
    expect(project(undefined, {})).toEqual({
      ...initialState
    })
  })

  it('should handle FETCH_PROJECTS_SUCCESSFUL', () => {
    const state = {
      ...initialState,
      loadingProjects: true,
      projects: [1]
    }
    expect(project(state, { type: FETCH_PROJECTS_SUCCESSFUL, payload: 2 })).toEqual({
      ...initialState,
      projects: [1, 2],
      loadingProjects: false
    });
  })

  it('should handle FETCH_OWN_PROJECTS_SUCCESSFUL', () => {
    const state = {
      ...initialState,
      ownProjects: [1]
    }
    expect(project(state, { type: FETCH_OWN_PROJECTS_SUCCESSFUL, payload: 2 })).toEqual({
      ...initialState,
      ownProjects: [1, 2]
    })
  })

  it('should handle FETCH_PROJECTS', () => {
    const state = {
      ...initialState,
      currentProject: 1,
      currentProjectLoaded: true,
      loadingProjects: false
    }
    expect(project(state, { type: FETCH_PROJECTS })).toEqual({
      ...initialState,
      loadingProjects: true
    })
  })

  it('should handle FETCH_PROJECT_SUCCESSFUL', () => {
    const state = {
      ...initialState,
      saving: true
    }
    expect(project(state, { type: FETCH_PROJECT_SUCCESSFUL, payload: {'attribute_data': {}} })).toEqual({
      ...initialState,
      currentProject: {'attribute_data': {}}
    })
  })

  it('should handle UPDATE_PROJECT', () => {
    const state = {
      ...initialState,
      saving: true
    }
    expect(project(state, { type: UPDATE_PROJECT, payload: {'attribute_data': {}} })).toEqual({
      ...initialState,
      currentProject: {'attribute_data': {}}
    })
  })

  it('should handle CREATE_PROJECT_SUCCESSFUL', () => {
    const state = {
      ...initialState,
      projects: [1, 2, 3]
    }
    expect(project(state, { type: CREATE_PROJECT_SUCCESSFUL, payload: 4 })).toEqual({
      ...initialState,
      projects: [1, 2, 3, 4]
    })
  })

  it('should handle CREATE_OWN_PROJECT_SUCCESSFUL', () => {
    const state = {
      ...initialState,
      ownProjects: [1, 2, 3]
    }
    expect(project(state, { type: CREATE_OWN_PROJECT_SUCCESSFUL, payload: 4 })).toEqual({
      ...initialState,
      ownProjects: [1, 2, 3, 4]
    })
  })

  it('should handle INITIALIZE_PROJECT', () => {
    const state = {
      ...initialState,
      currentProject: 1,
      currentProjectLoaded: true
    }
    expect(project(state, { type: INITIALIZE_PROJECT })).toEqual({
      ...initialState
    })
  })

  it('should handle INITIALIZE_PROJECT_SUCCESSFUL', () => {
    const state = {
      ...initialState,
      currentProjectLoaded: false,
      checking: true
    }
    expect(project(state, { type: INITIALIZE_PROJECT_SUCCESSFUL })).toEqual({
      ...initialState,
      currentProjectLoaded: true,
      checking: false
    })
  })

  it('should handle SAVE_PROJECT', () => {
    const state = {
      ...initialState,
      saving: false
    }
    expect(project(state, { type: SAVE_PROJECT })).toEqual({
      ...initialState,
      saving: true
    })
  })

  it('should handle SAVE_PROJECT_SUCCESSFUL', () => {
    const state = {
      ...initialState,
      saving: true
    }
    expect(project(state, { type: SAVE_PROJECT_SUCCESSFUL })).toEqual({
      ...initialState,
      saving: false
    })
  })

  it('should handle VALIDATE_PROJECT_FIELDS', () => {
    const state = {
      ...initialState,
      validating: false
    }
    expect(project(state, { type: VALIDATE_PROJECT_FIELDS })).toEqual({
      ...initialState,
      validating: true
    })
  })

  it('should handle VALIDATE_PROJECT_FIELDS_SUCCESSFUL', () => {
    const state = {
      ...initialState,
      validating: true,
      hasErrors: false
    }
    expect(
      project(state, { type: VALIDATE_PROJECT_FIELDS_SUCCESSFUL, payload: true })
    ).toEqual({
      ...initialState,
      validating: false,
      hasErrors: true
    })
  })

  it('should handle CHANGE_PROJECT_PHASE', () => {
    const state = {
      ...initialState,
      changingPhase: false
    }
    expect(project(state, { type: CHANGE_PROJECT_PHASE })).toEqual({
      ...initialState,
      changingPhase: true
    })
  })

  it('should handle CHANGE_PROJECT_PHASE_SUCCESSFUL', () => {
    const state = {
      ...initialState,
      changingPhase: true,
      currentProject: 2
    }
    expect(project(state, { type: CHANGE_PROJECT_PHASE_SUCCESSFUL, payload: 1 })).toEqual(
      {
        ...initialState,
        changingPhase: false,
        currentProject: 1
      }
    )
  })

  it('should handle CHANGE_PROJECT_PHASE_FAILURE', () => {
    const state = {
      ...initialState,
      changingPhase: true
    }
    expect(project(state, { type: CHANGE_PROJECT_PHASE_FAILURE })).toEqual({
      ...initialState,
      changingPhase: false
    })
  })

  it('should handle PROJECT_FILE_UPLOAD_SUCCESSFUL', () => {
    const state = {
      ...initialState,
      currentProject: { test: 10, attribute_data: { a: 1, b: 2, c: 3 } }
    }
    expect(
      project(state, {
        type: PROJECT_FILE_UPLOAD_SUCCESSFUL,
        payload: { attribute: 'b', file: 1, description: 2 }
      })
    ).toEqual({
      ...initialState,
      currentProject: {
        ...state.currentProject,
        attribute_data: { a: 1, b: { link: 1, description: 2 }, c: 3 }
      }
    })
  })

  it('should handle PROJECT_FILE_REMOVE_SUCCESSFUL', () => {
    const state = {
      ...initialState,
      currentProject: { test: 10, attribute_data: { a: 1, b: 2, c: 3 } }
    }
    expect(
      project(state, { type: PROJECT_FILE_REMOVE_SUCCESSFUL, payload: 'b' })
    ).toEqual({
      ...initialState,
      currentProject: {
        ...state.currentProject,
        attribute_data: { a: 1, c: 3 }
      }
    })
  })

  it('should handle PROJECT_SET_CHECKING', () => {
    expect(project(initialState, { type: PROJECT_SET_CHECKING, payload: 1 })).toEqual({
      ...initialState,
      checking: 1
    })
  })
})
