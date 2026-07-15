import { proxy } from 'valtio'
import { useProxy } from 'valtio/utils'

// Frosted-glass page state: `open` widens the transmission lens while the
// pointer is over the model; `selectedId` drives the top-left model menu.
export const store = proxy({ open: false, selectedId: 'helmet' })
export const useStore = () => useProxy(store)
