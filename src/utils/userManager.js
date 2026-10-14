import { WebStorageStateStore, InMemoryWebStorage, Log, UserManager } from 'oidc-client-ts'

Log.setLogger(console);
Log.setLevel(Log.DEBUG);

 const baseUrl = `${window.location.protocol}//${window.location.hostname}${
  window.location.port ? `:${window.location.port}` : ''
}`

const userManagerConfig = {
  client_id: process.env.REACT_APP_OPENID_CONNECT_CLIENT_ID,
  redirect_uri: `${baseUrl}/callback`,
  response_type: 'code',
  scope: 'openid profile email',
  authority: process.env.REACT_APP_OPENID_ENDPOINT,
  post_logout_redirect_uri: `${baseUrl}/logout/callback`,
  automaticSilentRenew: true,
  silent_redirect_uri: `${baseUrl}/silent-renew.html`,
  stateStore: new WebStorageStateStore({ store: localStorage }),
  userStore: new WebStorageStateStore({ store: localStorage }),
  includeIdTokenInSilentRenew:true,
  //For debugging silent renew. Value represents how much to reduce timer by, not how long timer is.
  //accessTokenExpiringNotificationTimeInSeconds: 4.5 * 60
}

if (process.env.NODE_ENV === 'test') {
  const stateStoreStorage = new InMemoryWebStorage()
  const userStoreStorage = new InMemoryWebStorage()

  userManagerConfig.stateStore = new WebStorageStateStore({ store: stateStoreStorage })
  userManagerConfig.userStore = new WebStorageStateStore({ store: userStoreStorage })
}

const userManager = new UserManager(userManagerConfig)

// Save a handle to the original built-in method before wrapping it
const signinSilent = userManager.signinSilent.bind(userManager)
const renewalLockName = `oidc-renew:${userManagerConfig.authority}:${userManagerConfig.client_id}`
let renewalPromise = null

userManager.signinSilent = (args) => {
  if (renewalPromise) {
    return renewalPromise
  }

  renewalPromise = (async () => {
    if (!navigator.locks?.request) {
      return signinSilent(args)
    }

    // For multi-tab scenarios, we acquire a lock to ensure only one tab performs the silent renewal at a time
    const previousUser = await userManager.getUser()
    return navigator.locks.request(renewalLockName, async () => {
      const currentUser = await userManager.getUser()
      if (currentUser && !currentUser.expired &&
          currentUser.access_token !== previousUser?.access_token) {
        await userManager.events.load(currentUser)
        return currentUser
      }

      return signinSilent(args)
    })
  })().finally(() => {
    renewalPromise = null
  })

  return renewalPromise
}

userManager.events.addSilentRenewError((error) => {
  console.error('Silent renew failed', error)
})

export default userManager
