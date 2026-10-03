import { useEffect, useRef, useState } from 'react'
import { Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl'
import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { isSelection, SELECTION_TYPES } from '../domain/selection/selectionModel.js'
import { mapStyle } from '../data/mapStyle.js'
import './map.css'

const DEADHEAD_SOURCE = 'freightlink-deadhead-source'
const DEADHEAD_LAYER = 'freightlink-deadhead-layer'
const LOADED_SOURCE = 'freightlink-loaded-source'
const LOADED_LAYER = 'freightlink-loaded-layer'

export default function OperationsMap({
  drivers,
  driverDay,
  selectedDriver,
  selectedStop,
  selection,
  freightRoutePreview,
  workspaceOpen,
  marketLanes = [],
  locations = {},
  onSelectSubject,
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRefs = useRef(new globalThis.Map())
  const previewMarkerRefs = useRef([])
  const onSelectSubjectRef = useRef(onSelectSubject)
  const [mapReady, setMapReady] = useState(false)

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
    map.on('load', () => setMapReady(true))
    mapRef.current = map

    const observer = new ResizeObserver(() => map.resize())
    observer.observe(mapContainerRef.current)

    return () => {
      observer.disconnect()
      markerRefs.current.forEach((marker) => marker.remove())
      markerRefs.current.clear()
      previewMarkerRefs.current.forEach((marker) => marker.remove())
      previewMarkerRefs.current = []
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
      element.className = `driver-marker ${workspaceOpen ? 'market-mode' : ''} ${selected ? 'selected' : ''}`
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

    if (workspaceOpen) {
      for (const lane of marketLanes) {
        const pickup = locations[lane.pickupLocationId]
        const delivery = locations[lane.deliveryLocationId]
        if (!pickup?.coordinates || !delivery?.coordinates) continue

        const midpoint = [
          (pickup.coordinates[0] + delivery.coordinates[0]) / 2,
          (pickup.coordinates[1] + delivery.coordinates[1]) / 2,
        ]
        const selected = isSelection(selection, SELECTION_TYPES.LOAD, lane.id)
        const anotherLaneSelected = isSelection(selection, SELECTION_TYPES.LOAD) && !selected
        const element = document.createElement('button')
        element.type = 'button'
        element.className = `market-lane-marker ${selected ? 'selected' : ''} ${anotherLaneSelected ? 'muted' : ''}`
        element.setAttribute('aria-label', `Preview ${lane.laneRef}: ${pickup.label} to ${delivery.label}`)
        element.innerHTML = `<span>${lane.laneRef}</span><small>${pickup.label} → ${delivery.label}</small>`
        element.addEventListener('click', (event) => {
          event.preventDefault()
          event.stopPropagation()
          onSelectSubjectRef.current?.(SELECTION_TYPES.LOAD, lane.id)
        })

        const marker = new Marker({ element, anchor: 'bottom' })
          .setLngLat(midpoint)
          .addTo(map)

        markerRefs.current.set(`market:${lane.id}`, marker)
      }
    }

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
  }, [driverDay, drivers, locations, marketLanes, selectedDriver, selection, selectedStop, workspaceOpen])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return

    const clearLayer = (layerId, sourceId) => {
      if (map.getLayer(layerId)) map.removeLayer(layerId)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    }
    clearLayer(DEADHEAD_LAYER, DEADHEAD_SOURCE)
    clearLayer(LOADED_LAYER, LOADED_SOURCE)
    previewMarkerRefs.current.forEach((marker) => marker.remove())
    previewMarkerRefs.current = []

    if (!freightRoutePreview) return

    const identity = getDriverIdentity(freightRoutePreview.driver.id)
    const addLine = (sourceId, layerId, route, color, dashed = false) => {
      if (!Array.isArray(route?.routeShape) || route.routeShape.length < 2) return
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: route.routeShape },
        },
      })
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': color,
          'line-width': dashed ? 3 : 5,
          'line-opacity': dashed ? .72 : .94,
          ...(dashed ? { 'line-dasharray': [2, 2] } : {}),
        },
      })
    }

    addLine(DEADHEAD_SOURCE, DEADHEAD_LAYER, freightRoutePreview.deadheadRoute, identity.color, true)
    addLine(LOADED_SOURCE, LOADED_LAYER, freightRoutePreview.loadedRoute, '#9b82ad')

    const addPreviewMarker = (coordinates, role, label) => {
      if (!coordinates) return
      const element = document.createElement('div')
      element.className = `freight-preview-marker ${role}`
      element.innerHTML = `<span>${role === 'pickup' ? 'P' : 'D'}</span><small>${label}</small>`
      previewMarkerRefs.current.push(
        new Marker({ element, anchor: 'bottom' }).setLngLat(coordinates).addTo(map),
      )
    }

    addPreviewMarker(freightRoutePreview.pickup?.coordinates, 'pickup', freightRoutePreview.pickup?.label)
    addPreviewMarker(freightRoutePreview.delivery?.coordinates, 'delivery', freightRoutePreview.delivery?.label)

    const points = []
    for (const route of [freightRoutePreview.deadheadRoute, freightRoutePreview.loadedRoute]) {
      if (Array.isArray(route?.routeShape)) points.push(...route.routeShape)
    }
    if (!points.length) {
      if (freightRoutePreview.pickup?.coordinates) points.push(freightRoutePreview.pickup.coordinates)
      if (freightRoutePreview.delivery?.coordinates) points.push(freightRoutePreview.delivery.coordinates)
    }

    if (points.length >= 2) {
      const lngs = points.map((point) => point[0])
      const lats = points.map((point) => point[1])
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        {
          padding: {
            top: 54,
            right: 64,
            bottom: 64,
            left: 64,
          },
          maxZoom: 11.5,
          duration: 450,
        },
      )
    }

    return () => {
      clearLayer(DEADHEAD_LAYER, DEADHEAD_SOURCE)
      clearLayer(LOADED_LAYER, LOADED_SOURCE)
      previewMarkerRefs.current.forEach((marker) => marker.remove())
      previewMarkerRefs.current = []
    }
  }, [freightRoutePreview, mapReady, workspaceOpen])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !workspaceOpen || freightRoutePreview) return

    const points = []
    for (const lane of marketLanes) {
      const pickup = locations[lane.pickupLocationId]?.coordinates
      const delivery = locations[lane.deliveryLocationId]?.coordinates
      if (pickup) points.push(pickup)
      if (delivery) points.push(delivery)
    }
    for (const driver of drivers) {
      if (Array.isArray(driver.coordinates)) points.push(driver.coordinates)
    }

    if (points.length < 2) return

    const lngs = points.map((point) => point[0])
    const lats = points.map((point) => point[1])
    map.resize()
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      {
        padding: { top: 48, right: 56, bottom: 56, left: 56 },
        maxZoom: 10.1,
        duration: 450,
      },
    )
  }, [drivers, freightRoutePreview, locations, mapReady, marketLanes, workspaceOpen])

  useEffect(() => {
    const map = mapRef.current
    if (!map || freightRoutePreview || workspaceOpen) return

    if (selectedStop?.coordinates) {
      map.easeTo({ center: selectedStop.coordinates, zoom: Math.max(map.getZoom(), 10.7), duration: 450 })
      return
    }

    if (selectedDriver) {
      map.easeTo({ center: selectedDriver.coordinates, zoom: Math.max(map.getZoom(), 10), duration: 500 })
    }
  }, [freightRoutePreview, selectedDriver, selectedStop])

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
