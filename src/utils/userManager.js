import { createUserManager } from 'redux-oidc'
import { WebStorageStateStore, InMemoryWebStorage } from 'oidc-client'
import { logout } from '../actions/authActions'

 const baseUrl = `${window.location.protocol}//${window.location.hostname}${
  window.location.port ? `:${window.location.port}` : ''
}`

const userManagerConfig = {
  client_id: process.env.REACT_APP_OPENID_CONNECT_CLIENT_ID,
  redirect_uri: `${baseUrl}/callback`,
  response_type: 'id_token token',
  scope: `openid profile email ${process.env.REACT_APP_OPENID_AUDIENCE}`,
  authority: process.env.REACT_APP_OPENID_ENDPOINT + '/openid/',
  post_logout_redirect_uri: `${baseUrl}/logout/callback`,
  automaticSilentRenew: true,
  silent_redirect_uri: `${baseUrl}/silent-renew`,
  stateStore: new WebStorageStateStore({ store: localStorage }),
  userStore: new WebStorageStateStore({ store: localStorage }),
  includeIdTokenInSilentRenew:true
}

if (process.env.NODE_ENV === 'test') {
  const stateStoreStorage = new InMemoryWebStorage()
  const userStoreStorage = new InMemoryWebStorage()

  userManagerConfig.stateStore = new WebStorageStateStore({ store: stateStoreStorage })
  userManagerConfig.userStore = new WebStorageStateStore({ store: userStoreStorage })
}

const userManager = createUserManager(userManagerConfig)

userManager.events.addSilentRenewError( () => {
  logout()
})

export default userManager
