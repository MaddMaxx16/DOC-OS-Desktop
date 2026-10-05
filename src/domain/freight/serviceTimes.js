export const FREIGHT_SERVICE_MINUTES = Object.freeze({
  pickup: 12,
  delivery: 10,
})

export function freightServiceMinutes(role, override = null) {
  if (override !== null && override !== undefined && override !== '') {
    const explicit = Number(override)
    if (Number.isFinite(explicit) && explicit >= 0) return explicit
  }

  return FREIGHT_SERVICE_MINUTES[role] ?? 0
}
