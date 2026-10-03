import { useEffect, useRef } from 'react'
import { Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl'
import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { isSelection, SELECTION_TYPES } from '../domain/selection/selectionModel.js'
import { mapStyle } from '../data/mapStyle.js'
import './map.css'

export default function OperationsMap({
  drivers,
  driverDay,
  selectedDriver,
  selectedStop,
  selection,
  onSelectSubject,
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRefs = useRef(new globalThis.Map())
  const onSelectSubjectRef = useRef(onSelectSubject)

  useEffect(() => {
    onSelectSubjectRef.current = onSelectSubject
  }, [onSelectSubject])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-74.02, 40.755],
      zoom: 9.1,
      attributionControl: false,
      renderWorldCopies: false,
    })

    map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right')
    mapRef.current = map

    const observer = new ResizeObserver(() => map.resize())
    observer.observe(mapContainerRef.current)

    return () => {
      observer.disconnect()
      markerRefs.current.forEach((marker) => marker.remove())
      markerRefs.current.clear()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markerRefs.current.forEach((marker) => marker.remove())
    markerRefs.current.clear()

    drivers.forEach((driver) => {
      const identity = getDriverIdentity(driver.id)
      const selected = selectedDriver?.id === driver.id
      const element = document.createElement('button')
      element.type = 'button'
      element.className = `driver-marker ${selected ? 'selected' : ''}`
      element.style.setProperty('--driver-color', identity.color)
      element.dataset.driverId = driver.id
      element.setAttribute('aria-label', `Select ${driver.name}, ${identity.colorName} driver`)
      element.innerHTML = `<span>${driver.initials}</span><small><i></i>${driver.name}</small>`
      element.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        onSelectSubjectRef.current?.(SELECTION_TYPES.DRIVER, driver.id)
      })

      const marker = new Marker({ element, anchor: 'bottom' })
        .setLngLat(driver.coordinates)
        .addTo(map)

      markerRefs.current.set(`driver:${driver.id}`, marker)
    })

    const driverIdentity = selectedDriver ? getDriverIdentity(selectedDriver.id) : null
    for (const stop of driverDay?.freightStops ?? []) {
      if (!stop.coordinates || !driverIdentity) continue
      const selected = isSelection(selection, SELECTION_TYPES.STOP, stop.id)
      const element = document.createElement('button')
      element.type = 'button'
      element.className = `manifest-stop-marker ${stop.role} ${selected ? 'selected' : ''}`
      element.style.setProperty('--driver-color', driverIdentity.color)
      element.setAttribute('aria-label', `Select ${stop.role} ${stop.loadRef} at ${stop.locationLabel}`)
      element.innerHTML = `<span>${stop.role === 'pickup' ? 'P' : 'D'}${stop.loadOrdinal}</span><small>${stop.loadRef}</small>`
      element.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        onSelectSubjectRef.current?.(SELECTION_TYPES.STOP, stop.id)
      })

      const marker = new Marker({ element, anchor: 'bottom' })
        .setLngLat(stop.coordinates)
        .addTo(map)

      markerRefs.current.set(`stop:${stop.id}`, marker)
    }

    if (
      selectedStop?.coordinates
      && driverIdentity
      && ['lunch', 'staging'].includes(selectedStop.kind)
    ) {
      const element = document.createElement('button')
      element.type = 'button'
      element.className = `operational-event-marker ${selectedStop.kind} selected`
      element.style.setProperty('--driver-color', driverIdentity.color)
      element.setAttribute('aria-label', `${selectedStop.label} at ${selectedStop.locationLabel}`)
      element.innerHTML = `<span>${selectedStop.kind === 'lunch' ? 'LUNCH' : 'STAGE'}</span><small>${selectedStop.locationLabel}</small>`

      const marker = new Marker({ element, anchor: 'bottom' })
        .setLngLat(selectedStop.coordinates)
        .addTo(map)

      markerRefs.current.set(`event:${selectedStop.id}`, marker)
    }
  }, [driverDay, drivers, selectedDriver, selection])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (selectedStop?.coordinates) {
      map.easeTo({ center: selectedStop.coordinates, zoom: Math.max(map.getZoom(), 10.7), duration: 450 })
      return
    }

    if (selectedDriver) {
      map.easeTo({ center: selectedDriver.coordinates, zoom: Math.max(map.getZoom(), 10), duration: 500 })
    }
  }, [selectedDriver, selectedStop])

  return (
    <div className="map-stage">
      <div ref={mapContainerRef} className="map-container" />
      <div className="map-vignette" aria-hidden="true" />
      <div className="map-label">
        <span>LIVE MAP</span>
        <strong>New York Metro</strong>
      </div>
    </div>
  )
}
