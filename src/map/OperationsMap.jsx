import { useEffect, useRef, useState } from 'react'
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
} from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import { isSelection, SELECTION_TYPES } from '../domain/selection/selectionModel.js'
import { mapStyle } from '../data/mapStyle.js'
import './map.css'

setWorkerUrl(maplibreWorkerUrl)

const DEADHEAD_SOURCE = 'freightlink-deadhead-source'
const DEADHEAD_CASING_LAYER = 'freightlink-deadhead-casing'
const DEADHEAD_LAYER = 'freightlink-deadhead-layer'
const LOADED_SOURCE = 'freightlink-loaded-source'
const LOADED_CASING_LAYER = 'freightlink-loaded-casing'
const LOADED_LAYER = 'freightlink-loaded-layer'

const PREVIEW_ROUTE = '#c8d2da'
const PREVIEW_DEADHEAD = '#8797a4'
const ROUTE_CASING = '#111a22'

function tuneBaseMap(map) {
  const layers = map.getStyle()?.layers ?? []

  for (const layer of layers) {
    if (layer.type !== 'symbol') continue

    const id = String(layer.id ?? '').toLowerCase()
    const noisyPoi = /(poi|shop|amenity|transit|aeroway|airport|housenum)/.test(id)
    const keepGeography = /(road|street|place|city|town|state|country|water)/.test(id)

    if (noisyPoi && !keepGeography) {
      map.setLayoutProperty(layer.id, 'visibility', 'none')
      continue
    }

    if (/(road|street)/.test(id) && map.getPaintProperty(layer.id, 'text-opacity') !== undefined) {
      map.setPaintProperty(layer.id, 'text-opacity', 0.72)
    }
  }
}

function truckMarkup(initials) {
  return `
    <span class="driver-truck-icon" aria-hidden="true">
      <svg viewBox="0 0 64 40" focusable="false">
        <path d="M4 9h33v22H4z" class="truck-box"/>
        <path d="M37 16h12l9 9v6H37z" class="truck-cab"/>
        <path d="M43 19h6l5 6H43z" class="truck-window"/>
        <circle cx="16" cy="33" r="5" class="truck-wheel"/>
        <circle cx="48" cy="33" r="5" class="truck-wheel"/>
      </svg>
      <b>${initials}</b>
    </span>
  `
}

function poiSvg(type) {
  if (type === 'yard') {
    return '<svg viewBox="0 0 48 48" focusable="false"><path d="M7 15h34v25H7z"/><path d="M12 9h24v8H12z"/><path d="M13 24h8v16h-8zm14 0h8v16h-8z"/></svg>'
  }
  if (type === 'staging') {
    return '<svg viewBox="0 0 48 48" focusable="false"><rect x="8" y="8" width="32" height="32" rx="5"/><path d="M18 34V14h8c7 0 11 3 11 9s-4 9-11 9h-3"/><path d="M23 19v8h3c4 0 6-1 6-4s-2-4-6-4z"/></svg>'
  }
  if (type === 'fuel') {
    return '<svg viewBox="0 0 48 48" focusable="false"><path d="M10 7h20v34H10z"/><path d="M14 12h12v9H14z"/><path d="M30 15h5l5 6v15c0 3-2 5-5 5s-5-2-5-5"/><path d="M35 15v7h5"/></svg>'
  }
  if (type === 'food') {
    return '<svg viewBox="0 0 48 48" focusable="false"><path d="M14 7v15m-5-15v10c0 4 2 6 5 6s5-2 5-6V7m-5 16v18"/><path d="M31 7c5 5 7 11 7 18h-7v16m0-34v18"/></svg>'
  }
  if (type === 'truck-stop') {
    return '<svg viewBox="0 0 48 48" focusable="false"><path d="M5 13h23v20H5z"/><path d="M28 20h8l7 7v6H28z"/><circle cx="14" cy="35" r="4"/><circle cx="36" cy="35" r="4"/></svg>'
  }
  if (type === 'service') {
    return '<svg viewBox="0 0 48 48" focusable="false"><path d="M31 8a10 10 0 0 0-10 13L8 34l6 6 13-13A10 10 0 0 0 40 17l-7 7-6-6 7-7a10 10 0 0 0-3-3z"/></svg>'
  }

  return '<svg viewBox="0 0 48 48" focusable="false"><path d="M6 18 24 7l18 11v23H6z"/><path d="M12 24h7v17h-7zm11 0h7v17h-7zm11 0h4v17h-4z"/><path d="M10 18h28"/></svg>'
}

function locationType(location, fallback = 'warehouse') {
  return location?.poiType ?? fallback
}

function facilityMarkup({ type, role, badge }) {
  const roleLabel = role === 'pickup' ? 'PICKUP' : role === 'delivery' ? 'DELIVERY' : ''
  return `
    <span class="poi-symbol ${type}" aria-hidden="true">
      ${poiSvg(type)}
      ${badge ? `<b>${badge}</b>` : ''}
    </span>
    ${roleLabel ? `<em>${roleLabel}</em>` : ''}
  `
}

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
      bearing: 0,
      pitch: 0,
      maxPitch: 0,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      keyboard: false,
      attributionControl: false,
      renderWorldCopies: false,
    })

    map.dragRotate.disable()
    map.touchZoomRotate.disableRotation()
    map.touchPitch.disable()
    map.setBearing(0)
    map.setPitch(0)

    map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right')
    map.on('load', () => {
      map.setBearing(0)
      map.setPitch(0)
      tuneBaseMap(map)
      setMapReady(true)
    })
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

    const freightPreviewActive = Boolean(freightRoutePreview)

    drivers.forEach((driver) => {
      if (freightPreviewActive && driver.id !== selectedDriver?.id) return
      const identity = getDriverIdentity(driver.id)
      const selected = selectedDriver?.id === driver.id
      const element = document.createElement('button')
      element.type = 'button'
      element.className = `driver-marker ${workspaceOpen ? 'market-mode' : ''} ${selected ? 'selected' : ''}`
      element.style.setProperty('--driver-color', identity.color)
      element.dataset.driverId = driver.id
      element.setAttribute('aria-label', `Select ${driver.name}, ${identity.colorName} driver`)
      element.innerHTML = `${truckMarkup(driver.initials)}<small><i></i>${driver.name}</small>`
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

    if (workspaceOpen && !freightPreviewActive) {
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
    for (const stop of freightPreviewActive ? [] : (driverDay?.freightStops ?? [])) {
      if (!stop.coordinates || !driverIdentity) continue
      const selected = isSelection(selection, SELECTION_TYPES.STOP, stop.id)
      const location = locations[stop.locationId]
      const element = document.createElement('button')
      element.type = 'button'
      element.className = `poi-marker facility-stop ${stop.role} ${selected ? 'selected' : ''}`
      element.style.setProperty('--driver-color', driverIdentity.color)
      element.setAttribute('aria-label', `Select ${stop.role} ${stop.loadRef} at ${stop.locationLabel}`)
      element.innerHTML = `${facilityMarkup({
        type: locationType(location),
        role: stop.role,
        badge: `${stop.role === 'pickup' ? 'P' : 'D'}${stop.loadOrdinal}`,
      })}<small>${stop.locationLabel}</small>`
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
      !freightPreviewActive
      && selectedStop?.coordinates
      && driverIdentity
      && ['lunch', 'staging'].includes(selectedStop.kind)
    ) {
      const location = locations[selectedStop.locationId]
      const eventType = selectedStop.kind === 'lunch' ? 'food' : locationType(location, 'staging')
      const element = document.createElement('button')
      element.type = 'button'
      element.className = `poi-marker operational-event-marker ${selectedStop.kind} selected`
      element.style.setProperty('--driver-color', driverIdentity.color)
      element.setAttribute('aria-label', `${selectedStop.label} at ${selectedStop.locationLabel}`)
      element.innerHTML = `${facilityMarkup({
        type: eventType,
        badge: selectedStop.kind === 'lunch' ? 'L' : 'S',
      })}<small>${selectedStop.locationLabel}</small>`

      const marker = new Marker({ element, anchor: 'bottom' })
        .setLngLat(selectedStop.coordinates)
        .addTo(map)

      markerRefs.current.set(`event:${selectedStop.id}`, marker)
    }
  }, [driverDay, drivers, locations, marketLanes, selectedDriver, selection, selectedStop, workspaceOpen])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return undefined

    const clearRoute = () => {
      for (const layerId of [
        DEADHEAD_LAYER,
        DEADHEAD_CASING_LAYER,
        LOADED_LAYER,
        LOADED_CASING_LAYER,
      ]) {
        if (map.getLayer(layerId)) map.removeLayer(layerId)
      }
      for (const sourceId of [DEADHEAD_SOURCE, LOADED_SOURCE]) {
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      }
    }

    clearRoute()
    previewMarkerRefs.current.forEach((marker) => marker.remove())
    previewMarkerRefs.current = []

    if (!freightRoutePreview) return clearRoute

    const addRoute = ({
      sourceId,
      casingLayerId,
      layerId,
      route,
      color,
      width,
      dashed = false,
    }) => {
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
        id: casingLayerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ROUTE_CASING,
          'line-width': width + 4,
          'line-opacity': 0.92,
          ...(dashed ? { 'line-dasharray': [2, 2] } : {}),
        },
      })

      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': color,
          'line-width': width,
          'line-opacity': dashed ? 0.8 : 1,
          ...(dashed ? { 'line-dasharray': [2, 2] } : {}),
        },
      })
    }

    addRoute({
      sourceId: DEADHEAD_SOURCE,
      casingLayerId: DEADHEAD_CASING_LAYER,
      layerId: DEADHEAD_LAYER,
      route: freightRoutePreview.deadheadRoute,
      color: PREVIEW_DEADHEAD,
      width: 3,
      dashed: true,
    })
    addRoute({
      sourceId: LOADED_SOURCE,
      casingLayerId: LOADED_CASING_LAYER,
      layerId: LOADED_LAYER,
      route: freightRoutePreview.loadedRoute,
      color: PREVIEW_ROUTE,
      width: 6,
    })

    const addPreviewMarker = (location, role) => {
      if (!location?.coordinates) return

      const element = document.createElement('div')
      element.className = `poi-marker freight-preview-marker ${role}`
      element.innerHTML = `${facilityMarkup({
        type: locationType(location),
        role,
        badge: role === 'pickup' ? 'P' : 'D',
      })}<small>${location.label}</small>`

      previewMarkerRefs.current.push(
        new Marker({ element, anchor: 'bottom' })
          .setLngLat(location.coordinates)
          .addTo(map),
      )
    }

    addPreviewMarker(freightRoutePreview.pickup, 'pickup')
    addPreviewMarker(freightRoutePreview.delivery, 'delivery')

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
      map.setBearing(0)
      map.setPitch(0)
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        {
          padding: { top: 58, right: 72, bottom: 66, left: 72 },
          maxZoom: 11.5,
          duration: 450,
        },
      )
    }

    return () => {
      clearRoute()
      previewMarkerRefs.current.forEach((marker) => marker.remove())
      previewMarkerRefs.current = []
    }
  }, [freightRoutePreview, mapReady])

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
    map.setBearing(0)
    map.setPitch(0)
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      {
        padding: { top: 56, right: 64, bottom: 56, left: 64 },
        maxZoom: 10.1,
        duration: 450,
      },
    )
  }, [drivers, freightRoutePreview, locations, mapReady, marketLanes, workspaceOpen])

  useEffect(() => {
    const map = mapRef.current
    if (!map || freightRoutePreview || workspaceOpen) return

    if (selectedStop?.coordinates) {
      map.easeTo({
        center: selectedStop.coordinates,
        zoom: Math.max(map.getZoom(), 10.7),
        bearing: 0,
        pitch: 0,
        duration: 450,
      })
      return
    }

    if (selectedDriver) {
      map.easeTo({
        center: selectedDriver.coordinates,
        zoom: Math.max(map.getZoom(), 10),
        bearing: 0,
        pitch: 0,
        duration: 500,
      })
    }
  }, [freightRoutePreview, selectedDriver, selectedStop, workspaceOpen])

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
