const storage = (() => {
  let store = {}
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] },
    clear: () => { store = {} },
    key: (i) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length },
  }
})()

if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true, configurable: true })
}
if (typeof globalThis.sessionStorage === 'undefined' || typeof globalThis.sessionStorage.getItem !== 'function') {
  Object.defineProperty(globalThis, 'sessionStorage', { value: storage, writable: true, configurable: true })
}