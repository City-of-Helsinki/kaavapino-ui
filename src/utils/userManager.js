import { WebStorageStateStore, InMemoryWebStorage, Log, UserManager } from 'oidc-client-ts'
import { logout } from '../actions/authActions'

Log.setLogger(console);
Log.setLevel(Log.DEBUG);

 const baseUrl = `${window.location.protocol}//${window.location.hostname}${
  window.location.port ? `:${window.location.port}` : ''
}`

const userManagerConfig = {
  client_id: process.env.REACT_APP_OPENID_CONNECT_CLIENT_ID,
  redirect_uri: `${baseUrl}/callback`,
  response_type: 'code',
  scope: `openid profile email`, //${process.env.REACT_APP_OPENID_AUDIENCE}`,
  authority: process.env.REACT_APP_OPENID_ENDPOINT,
  post_logout_redirect_uri: `${baseUrl}/logout/callback`,
  automaticSilentRenew: true,
  silent_redirect_uri: `${baseUrl}/silent-renew`,
  stateStore: new WebStorageStateStore({ store: localStorage }),
  userStore: new WebStorageStateStore({ store: localStorage }),
  includeIdTokenInSilentRenew:true
  //For debugging, set token renew time to 1min and after that should silent renew 59.65 * 60
  //accessTokenExpiringNotificationTimeInSeconds: 59.5 * 60
}

if (process.env.NODE_ENV === 'test') {
  const stateStoreStorage = new InMemoryWebStorage()
  const userStoreStorage = new InMemoryWebStorage()

  userManagerConfig.stateStore = new WebStorageStateStore({ store: stateStoreStorage })
  userManagerConfig.userStore = new WebStorageStateStore({ store: userStoreStorage })
}

const userManager = new UserManager(userManagerConfig)

userManager.events.addSilentRenewError( () => {
  logout()
})

export default userManager
