export const SELECTION_TYPES = Object.freeze({
  DRIVER: 'driver',
  LOAD: 'load',
  STOP: 'stop',
  FACILITY: 'facility',
  ROUTE_LEG: 'route-leg',
})

export const SELECTION_TYPE_VALUES = Object.freeze(Object.values(SELECTION_TYPES))

export function createSelection(type, id) {
  if (!SELECTION_TYPE_VALUES.includes(type)) {
    throw new TypeError(`Unsupported selection type: ${type}`)
  }

  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new TypeError('Selection id must be a non-empty string')
  }

  return Object.freeze({ type, id })
}

export function isSelection(selection, type, id = null) {
  if (!selection || selection.type !== type) return false
  return id == null ? true : selection.id === id
}

export function getSelectionKey(selection) {
  return selection ? `${selection.type}:${selection.id}` : null
}
