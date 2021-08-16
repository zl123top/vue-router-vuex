# Vuex Router vuex


把 Vue Router 保存到vuex。

### 用法

```
vue3.0
```

```javascript
import store from './vuex/store' // vuex store 实例
import router from './router' // vue-router 实例
import { syncHistoryWithStore, pushBack } from 'vue-router-vuex'

syncHistoryWithStore(store, router) // 返回值是 unsync 回调方法

pushBack({
  name: 'Home'
})
```

### 工作原理

- 该库在 store 上增加了一个名为 `route`和`history` 的模块，用于表示当前路由的状态。

  ```javascript
  store.state.route.path   // current path (字符串类型)
  store.state.route.params // current params (对象类型)
  store.state.route.query  // current query (对象类型)

  store.state.route.history // 历史栈保存了历史记录
  ```

- 增加pushBack方法，可以根据路由的name值，返回历史记录
  ```javascript
  pushBack({
    name: 'Home'
  })
  ```
