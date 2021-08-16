
export interface SyncOptions {
  moduleName: string,
  historyName?: string,
  rewrite?: Boolean
}

export interface State {
  name?: string | null
  path: string
  hash: string
  query: Record<string, string | (string | null)[]>
  params: Record<string, string>
  fullPath: string
  meta?: any
  from?: Omit<State, 'from'>,
  historyList?: any[],
  currentId?: Number
}

export interface Transition {
  to: any
  from: any
}
let pushBack: any
export function syncHistoryWithStore(
  store: any,
  router: any,
  options?: SyncOptions
): () => void {
  const moduleName = (options || {}).moduleName || 'route'
  store.registerModule(moduleName, {
    namespaced: true,
    state: cloneRoute(router.currentRoute, false),
    mutations: {
      ROUTE_CHANGED(_state: State, transition: Transition): void {
        store.state[moduleName] = cloneRoute(transition.to, transition.from)
      }
    }
  })
  let isTimeTraveling: boolean = false
  let currentPath: string
  syncHistoryList(store, router, options)
  const storeUnwatch = store.watch(
    (state: any) => state[moduleName],
    (route: any) => {
      const { fullPath } = route
      if (fullPath === currentPath) {
        return
      }
      if (currentPath != null) {
        isTimeTraveling = true
        router.push(route as any)
      }
      currentPath = fullPath
    },
    { sync: true } as any
  )
  // router.beforeEach((to: any, from: any) => {
  //   store.commit(moduleName + '/HISTORY_CHANGED', { to, from })
  // })
  const afterEachUnHook = router.afterEach((to: any, from: any) => {
    if (isTimeTraveling) {
      isTimeTraveling = false
      return
    }
    currentPath = to.fullPath    
    store.commit(moduleName + '/ROUTE_CHANGED', { to, from })
  })

  return function unsync(): void {
    // On unsync, remove router hook
    if (afterEachUnHook != null) {
      afterEachUnHook()
    }

    // On unsync, remove store watch
    if (storeUnwatch != null) {
      storeUnwatch()
    }

    // On unsync, unregister Module with store
    store.unregisterModule(moduleName)
  }
}

export { pushBack }

function syncHistoryList (store: any, router: any, options: any) {
  const historyName = (options || {}).historyName || 'history'
  store.registerModule(historyName, {
    namespaced: true,
    state: cloneHistory(),
    mutations: {
      HISTORY_CHANGED(_state: State, option: any): void {
        if (option.type === 'push') {
          store.state[historyName] = cloneHistory({
            historyList: [
              ...store.state[historyName].historyList.slice(0, store.state[historyName].currentId + 1),
              option.value
            ],
            currentId: store.state[historyName].currentId + 1
          })
        } else if ('replace') {
          store.state[historyName] = cloneHistory({
            historyList: store.state[historyName].historyList.length === 0 ? [option.value] : store.state[historyName].historyList.map((val: any, i: any) => {
              if (i === store.state[historyName].currentId) {
                return option.value
              } else {
                return val
              }
            }),
            currentId: store.state[historyName].currentId
          })
        }
      },
      CURRENT_CHANGED(_state: State, currentId: any): void {
        store.state[historyName] = cloneHistory({
          historyList: store.state[historyName].historyList,
          currentId: currentId
        })
      }
    }
  })
  const rewrite = (options || {}).rewrite !== false;
  const push = router.push
  const replace = router.replace
  const go = router.go
  if (rewrite) {
    router.push = (...res: any[]) => {
      store.commit(historyName + '/HISTORY_CHANGED', {
        type: 'push',
        value: {
          name: res[0].name,
          path: res[0].path
        }
      })
      push(...res)
    }
    router.replace = (...res: any[]) => {
      store.commit(historyName + '/HISTORY_CHANGED', {
        type: 'replace',
        value: {
          name: res[0].name,
          path: res[0].path
        }
      })
      replace(...res)
    }
    router.go = (delta: Number) => {
      store.commit(historyName + '/CURRENT_CHANGED', store.state[historyName].currentId + delta)
      go(delta)
    }
    router.back = () => router.go(-1)
    router.forward = () => router.go(1)
  }
  pushBack = (to: any) => {
    const i = store.state[historyName].historyList.findIndex((val: any) => val.name === to.name)
    if (i > -1) {
      router.go(i - store.state[historyName].currentId)
    } else {
      router.push(to)
    }
  }
}

function cloneRoute(to: any, from?: any): State {
  const clone: State = {
    name: to.name,
    path: to.path,
    hash: to.hash,
    query: to.query,
    params: to.params,
    fullPath: to.fullPath,
    meta: to.meta
  }

  if (from) {
    clone.from = cloneRoute(from)
  }

  return Object.freeze(clone)
}

function cloneHistory(params: any = {}) {
  const clone: any = {
    historyList: params.historyList || [],
    currentId: params.currentId || 0
  }
  return Object.freeze(clone)
}
