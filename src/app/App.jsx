import { useState } from 'react'
import { drivers } from '../data/drivers.js'
import { driverPlans, loads, locations } from '../data/operationsSeed.js'
import { SHELL_CONFIG } from '../config/shellConfig.js'
import { buildDriverDays } from '../domain/manifest/driverDayModel.js'
import { createSelection, SELECTION_TYPES } from '../domain/selection/selectionModel.js'
import DesktopShell from '../shell/DesktopShell.jsx'

const driverDays = buildDriverDays(drivers, loads, driverPlans, locations)

export default function App() {
  const [leftOpen, setLeftOpen] = useState(SHELL_CONFIG.leftDrawerDefaultOpen)
  const [rightOpen, setRightOpen] = useState(SHELL_CONFIG.rightDrawerDefaultOpen)
  const [selection, setSelection] = useState(null)

  const selectSubject = (type, id) => {
    setSelection(createSelection(type, id))
    if (type === SELECTION_TYPES.DRIVER) setLeftOpen(false)
    setRightOpen(true)
  }

  return (
    <DesktopShell
      drivers={drivers}
      driverDays={driverDays}
      selection={selection}
      leftOpen={leftOpen}
      rightOpen={rightOpen}
      onToggleLeft={() => setLeftOpen((value) => !value)}
      onToggleRight={() => setRightOpen((value) => !value)}
      onCloseLeft={() => setLeftOpen(false)}
      onCloseRight={() => setRightOpen(false)}
      onSelectSubject={selectSubject}
    />
  )
}
