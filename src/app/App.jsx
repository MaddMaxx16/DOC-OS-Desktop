import { useState } from 'react'
import { drivers } from '../data/drivers.js'
import { freightMarket } from '../data/freightMarket.js'
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
  const [activeApp, setActiveApp] = useState(null)
  const [freightRoutePreview, setFreightRoutePreview] = useState(null)

  const selectSubject = (type, id) => {
    setSelection(createSelection(type, id))

    if (type === SELECTION_TYPES.DRIVER) {
      setLeftOpen(false)
      if (activeApp !== 'freightlink') setRightOpen(true)
      return
    }

    if (type === SELECTION_TYPES.STOP) {
      if (activeApp !== 'freightlink') setRightOpen(true)
      return
    }

    if (type === SELECTION_TYPES.LOAD) {
      setRightOpen(false)
    }
  }

  const toggleApp = (appId) => {
    if (appId !== 'freightlink') return

    const opening = activeApp !== 'freightlink'
    setActiveApp(opening ? 'freightlink' : null)
    setLeftOpen(false)
    setRightOpen(false)

    if (!opening) {
      setFreightRoutePreview(null)
      if (selection?.type === SELECTION_TYPES.LOAD) setSelection(null)
    }
  }

  const closeActiveApp = () => {
    setActiveApp(null)
    setFreightRoutePreview(null)
    if (selection?.type === SELECTION_TYPES.LOAD) setSelection(null)
  }

  return (
    <DesktopShell
      drivers={drivers}
      driverDays={driverDays}
      marketLanes={freightMarket}
      locations={locations}
      selection={selection}
      activeApp={activeApp}
      freightRoutePreview={freightRoutePreview}
      leftOpen={leftOpen}
      rightOpen={rightOpen}
      onToggleLeft={() => setLeftOpen((value) => !value)}
      onToggleRight={() => setRightOpen((value) => !value)}
      onCloseLeft={() => setLeftOpen(false)}
      onCloseRight={() => setRightOpen(false)}
      onToggleApp={toggleApp}
      onCloseActiveApp={closeActiveApp}
      onRoutePreviewChange={setFreightRoutePreview}
      onSelectSubject={selectSubject}
    />
  )
}
