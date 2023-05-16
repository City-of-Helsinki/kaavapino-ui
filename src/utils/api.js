import apiUtils from './apiUtils'

const { get, post, patch, put, del } = apiUtils

class Api {
  constructor(apiUrl) {
    this.apiUrl = apiUrl
  }

  formatUrl = (pathVariables = {}, queryParameters = {}, opt = '') =>
    Object.keys(pathVariables).reduce(
      (url, key) => url.replace(`:${key}`, pathVariables[key]),
      Object.keys(queryParameters).reduce(
        (url, key, i) =>
          `${url}${
            i !== 0
              ? `&${key}=${queryParameters[key]}`
              : `?${key}=${queryParameters[key]}`
          }`,
        `${this.apiUrl}${opt}`
      )
    )

  get = async (
    { path = {}, query = {} } = {},
    opt = '',
    config = {},
    all = false,
    pages = false,
    force = true
  ) => await get(this.formatUrl(path, query, opt), config, all, pages, force)

  post = async (body = {}, { path = {}, query = {} } = {}, opt = '', config = {}) =>
    await post(this.formatUrl(path, query, opt), body, config)

  patch = async (body = {}, { path = {}, query = {} } = {}, opt = '', config = {}) =>
    await patch(this.formatUrl(path, query, opt), body, config)

  delete = async ({ path = {}, query = {} } = {}, opt = '', config = {}) =>
    await del(this.formatUrl(path, query, opt), config)

  put = async (body = {}, { path = {}, query = {} } = {}, opt = '', config = {}) =>
    await put(this.formatUrl(path, query, opt), body, config)
}

// Different API endpoints
export const commentApi = new Api('/v1/projects/:id/comments/')
export const documentsApi = new Api('/v1/projects/:id/documents/')

export const phaseApi = new Api('/v1/phases/')
export const projectApi = new Api('/v1/projects/')
export const projectDeadlinesApi = new Api('/v1/deadlines/')
export const projectTypeApi = new Api('/v1/projecttypes/')
export const projectSubtypeApi = new Api('/v1/projectsubtypes/')
export const schemaApi = new Api('/v1/schemas/')
export const userApi = new Api('/v1/users/')
export const reportApi = new Api('/v1/reports/')
export const footerApi = new Api('/v1/footer/')
export const overviewFloorAreaApi = new Api('v1/projects/overview/floor_area/')
export const overviewBySubtypeApi = new Api('v1/projects/overview/by_subtype/')
export const overviewFiltersApi = new Api('v1/projects/overview/filters/')
export const overviewMapApi = new Api('/v1/projects/overview/on_map/')
export const overviewFloorAreaTargetApi = new Api('/v1/targetfloorareas/')

export const cardSchemaApi = new Api('/v1/cardschema/')
export const externalDocumentsApi = new Api('/v1/projects/:id/external_documents/')
export const attributesApi = new Api('/v1/attributes/')
export const attributesApiLock = new Api('/v1/attributes/lock/')
export const attributesApiUnlock = new Api('/v1/attributes/unlock/')
export const attributesApiUnlockAll = new Api('/v1/attributes/unlock_all/')
export const personnelApi = new Api('/v1/personnel/')
export const legendApi = new Api('/v1/legend/')


