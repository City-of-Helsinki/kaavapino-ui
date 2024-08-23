import axios from 'axios'

let token = null
let isApiTokenRenewing = false

const initAxios = () => {
  let baseURL = ''
  if (process.env.NODE_ENV === 'production') {
    baseURL = process.env.REACT_APP_BASE_URL
  }
  axios.interceptors.request.use(config => ({
    baseURL,
    responseType: 'json',
    ...config,
    headers: {
      'Content-Type': 'application/json',
      Authorization:
        process.env.REACT_APP_API_TOKEN && getToken() === process.env.REACT_APP_API_TOKEN
          ? `Token ${getToken()}`
          : `Bearer ${getToken()}`,
      ...config.headers
    }
  }))
}

const setToken = newToken => (token = newToken)

const getToken = () => token

const delay_if_token_renewing = async () => {
  if (isApiTokenRenewing){
    await new Promise(resolve => setTimeout(resolve, 1000));
    isApiTokenRenewing=false
  }
}

export const get = async (
  apiUrl,
  config = {},
  all = false,
  pages = false,
  force = true,
) => {
  await delay_if_token_renewing()
  let retVal = null
  let res = await axios.get(apiUrl, { ...config })
  if (all) retVal = res
  else if (res.data.results && !pages) {
    let results = res.data.results
    if (force) {
      while (res.data.next) {
        res = await axios.get(res.data.next, { ...config })
        results = results.concat(res.data.results)
      }
      retVal = results
    } else {
      retVal = res.data.results
    }
  } else {
    retVal = res.data
  }
  return retVal
}

export const post = async (apiUrl, body = {}, headers = {}, renewingApiToken=false) => {
  await delay_if_token_renewing()
  if (renewingApiToken) { isApiTokenRenewing = true}
  const { data } = await axios.post(apiUrl, body, { headers })
  if (renewingApiToken) { isApiTokenRenewing = false}
  return data
}

export const patch = async (apiUrl, body = {}, headers = {}) => {
  await delay_if_token_renewing()
  const { data } = await axios.patch(apiUrl, body, { headers })
  return data
}

export const put = async (apiUrl, body = {}, config = {}) => {
  await delay_if_token_renewing()
  const { data } = await axios.put(apiUrl, body, { ...config })
  return data
}

export const del = async (apiUrl, body = {}, config = {}) => {
  await delay_if_token_renewing()
  const { data } = await axios.delete(apiUrl, body, { ...config })
  return data
}

export default {
  initAxios,
  setToken,
  getToken,
  get,
  post,
  patch,
  put,
  del
}
