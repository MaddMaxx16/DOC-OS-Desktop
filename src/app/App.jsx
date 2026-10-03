import { useState } from 'react'
import { drivers } from '../data/drivers.js'
import { SHELL_CONFIG } from '../config/shellConfig.js'
import DesktopShell from '../shell/DesktopShell.jsx'

export default function App() {
  const [leftOpen, setLeftOpen] = useState(SHELL_CONFIG.leftDrawerDefaultOpen)
  const [rightOpen, setRightOpen] = useState(SHELL_CONFIG.rightDrawerDefaultOpen)
  const [selectedDriverId, setSelectedDriverId] = useState(null)

  const selectedDriver = drivers.find((driver) => driver.id === selectedDriverId) ?? null

  const selectDriver = (driverId) => {
    setSelectedDriverId(driverId)
    setLeftOpen(false)
    setRightOpen(true)
  }

  return (
    <DesktopShell
      drivers={drivers}
      selectedDriver={selectedDriver}
      leftOpen={leftOpen}
      rightOpen={rightOpen}
      onToggleLeft={() => setLeftOpen((value) => !value)}
      onToggleRight={() => setRightOpen((value) => !value)}
      onCloseLeft={() => setLeftOpen(false)}
      onCloseRight={() => setRightOpen(false)}
      onSelectDriver={selectDriver}
    />
  )
}
