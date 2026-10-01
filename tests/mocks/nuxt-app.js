// Minimal stand-in for Nuxt's `#app` so composables that import from it can be
// unit-tested under plain Vitest (no Nuxt runtime). Aliased in vitest.config.js.
//
// useState: shared keyed refs, same contract as Nuxt's (one ref per key for the
// life of the module). Tests that need isolation can call __resetNuxtState().
import { ref } from 'vue'

const states = new Map()

export const useState = (key, init) => {
  if (!states.has(key)) {
    states.set(key, ref(typeof init === 'function' ? init() : init))
  }
  return states.get(key)
}

export const __resetNuxtState = () => states.clear()

export const useRoute = () => ({ query: {}, params: {}, path: '/' })

export const useRuntimeConfig = () => ({ public: {} })

export const useHead = () => {}
