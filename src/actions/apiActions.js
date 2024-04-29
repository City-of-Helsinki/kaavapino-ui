export const ERROR = 'Error'
export const LOAD_API_TOKEN = 'Load api token'
export const TOKEN_LOADED = 'Token loaded'
export const INIT_API_REQUEST = 'Init api request'
export const INIT_API_REQUEST_SUCCESSFUL = 'Init api request successful'
export const DOWNLOAD_FILE = 'Download file'

export const error = e => ({ type: ERROR, payload: e })
export const loadApiToken = (access_token) => ({type: LOAD_API_TOKEN, payload: access_token})
export const tokenLoaded = token => ({ type: TOKEN_LOADED, payload: token })
export const initApiRequest = () => ({ type: INIT_API_REQUEST })
export const initApiRequestSuccessful = () => ({ type: INIT_API_REQUEST_SUCCESSFUL })
export const downloadFile = ({ src, name }) => ({
  type: DOWNLOAD_FILE,
  payload: { src, name }
})
