import { useEffect, useRef } from 'react'
import { Map, Marker, NavigationControl } from 'maplibre-gl'
import { mapStyle } from '../data/mapStyle.js'
import './map.css'

export default function OperationsMap({ drivers, selectedDriver, onSelectDriver }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRefs = useRef(new Map())
  const onSelectDriverRef = useRef(onSelectDriver)

  useEffect(() => {
    onSelectDriverRef.current = onSelectDriver
  }, [onSelectDriver])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined

    const map = new Map({
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
      const element = document.createElement('button')
      element.type = 'button'
      element.className = `driver-marker ${selectedDriver?.id === driver.id ? 'selected' : ''}`
      element.innerHTML = `<span>${driver.initials}</span><small>${driver.name}</small>`
      element.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        onSelectDriverRef.current?.(driver.id)
      })

      const marker = new Marker({ element, anchor: 'bottom' })
        .setLngLat(driver.coordinates)
        .addTo(map)

      markerRefs.current.set(driver.id, marker)
    })
  }, [drivers, selectedDriver])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedDriver) return
    map.easeTo({ center: selectedDriver.coordinates, zoom: Math.max(map.getZoom(), 10), duration: 500 })
  }, [selectedDriver])

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
