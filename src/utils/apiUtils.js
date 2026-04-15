import axios from 'axios'

let token = null
let apiTokenRenewalPromise = null

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

export const waitForApiTokenRenewal = async () => {
  if (apiTokenRenewalPromise) {
    await apiTokenRenewalPromise
  }
}

const trackApiTokenRenewal = promise => {
  const renewalPromise = promise.finally(() => {
    if (apiTokenRenewalPromise === renewalPromise) {
      apiTokenRenewalPromise = null
    }
  })

  apiTokenRenewalPromise = renewalPromise

  return renewalPromise
}

export const get = async (
  apiUrl,
  config = {},
  all = false,
  pages = false,
  force = true,
) => {
  await waitForApiTokenRenewal()
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
  if (renewingApiToken && apiTokenRenewalPromise) {
    return await apiTokenRenewalPromise
  }

  if (renewingApiToken) {
    const requestPromise = axios.post(apiUrl, body, { headers }).then(({ data }) => data)

    return await trackApiTokenRenewal(requestPromise)
  }

  await waitForApiTokenRenewal()

  const requestPromise = axios.post(apiUrl, body, { headers }).then(({ data }) => data)

  return await requestPromise
}

export const patch = async (apiUrl, body = {}, headers = {}) => {
  await waitForApiTokenRenewal()
  const { data } = await axios.patch(apiUrl, body, { headers })
  return data
}

export const put = async (apiUrl, body = {}, config = {}) => {
  await waitForApiTokenRenewal()
  const { data } = await axios.put(apiUrl, body, { ...config })
  return data
}

export const del = async (apiUrl, body = {}, config = {}) => {
  await waitForApiTokenRenewal()
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
