import { isSelection, SELECTION_TYPES } from './selectionModel.js'
import { getStopById } from '../manifest/driverDayModel.js'

export function resolveSelectionContext(selection, drivers = [], driverDays = []) {
  if (!selection) return { driver: null, driverDay: null, stop: null }

  if (isSelection(selection, SELECTION_TYPES.DRIVER)) {
    const driver = drivers.find((item) => item.id === selection.id) ?? null
    const driverDay = driverDays.find((item) => item.driverId === selection.id) ?? null
    return { driver, driverDay, stop: null }
  }

  if (isSelection(selection, SELECTION_TYPES.STOP)) {
    const stop = getStopById(driverDays, selection.id)
    const driver = stop ? drivers.find((item) => item.id === stop.driverId) ?? null : null
    const driverDay = stop ? driverDays.find((item) => item.driverId === stop.driverId) ?? null : null
    return { driver, driverDay, stop }
  }

  return { driver: null, driverDay: null, stop: null }
}
