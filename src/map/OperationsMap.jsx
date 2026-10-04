import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
} from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { getDriverIdentity } from '../domain/drivers/driverIdentity.js'
import {
  buildDriverRouteAnchors,
  buildDriverRouteSegments,
  markInsertionAffectedSegment,
} from '../domain/routing/driverRoutePlan.js'
import { hydrateCommittedRouteSegments } from '../domain/routing/committedRouteHydration.js'
import { nextOperationalEventId } from '../domain/routing/mapRouteDisplay.js'
import {
  buildRouteAccessByEventId,
  routeAccessCoordinate,
} from '../domain/routing/routeAccessPoints.js'
import { isSelection, SELECTION_TYPES } from '../domain/selection/selectionModel.js'
import { calculateRoadRoute } from '../services/roadRouting.js'
import { mapStyle } from '../data/mapStyle.js'
import './map.css'

setWorkerUrl(maplibreWorkerUrl)

const DRIVER_ROUTE_SOURCE = 'driver-plan-source'
const DRIVER_ROUTE_CASING_LAYER = 'driver-plan-casing'
const DRIVER_ROUTE_LAYER = 'driver-plan-layer'
const DRIVER_ROUTE_PICKUP_CASING_LAYER = 'driver-plan-pickup-casing'
const DRIVER_ROUTE_PICKUP_LAYER = 'driver-plan-pickup-layer'
const COMMITTED_STOP_SOURCE = 'committed-stop-source'
const COMMITTED_STOP_CIRCLE_LAYER = 'committed-stop-circle-layer'
const COMMITTED_STOP_BADGE_LAYER = 'committed-stop-badge-layer'
const COMMITTED_STOP_LABEL_LAYER = 'committed-stop-label-layer'

const DEADHEAD_SOURCE = 'freightlink-deadhead-source'
const DEADHEAD_CASING_LAYER = 'freightlink-deadhead-casing'
const DEADHEAD_LAYER = 'freightlink-deadhead-layer'
const LOADED_SOURCE = 'freightlink-loaded-source'
const LOADED_CASING_LAYER = 'freightlink-loaded-casing'
const LOADED_LAYER = 'freightlink-loaded-layer'
const REJOIN_SOURCE = 'freightlink-rejoin-source'
const REJOIN_CASING_LAYER = 'freightlink-rejoin-casing'
const REJOIN_LAYER = 'freightlink-rejoin-layer'

const PREVIEW_ROUTE = '#c8d2da'
const PREVIEW_DEADHEAD = '#8797a4'
const ROUTE_CASING = '#111a22'
const PICKUP_ROUTE_DASH = [2, 1.5]
const PICKUP_CASING_DASH = [1.15, 0.85]

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
  planningPlaceOptions = [],
  pendingPlanningPlace = null,
  workspaceOpen,
  marketLanes = [],
  locations = {},
  onPreviewPlanningPlace,
  onSelectSubject,
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRefs = useRef(new globalThis.Map())
  const previewMarkerRefs = useRef([])
  const onSelectSubjectRef = useRef(onSelectSubject)
  const onPreviewPlanningPlaceRef = useRef(onPreviewPlanningPlace)
  const [mapReady, setMapReady] = useState(false)
  const [driverRouteResult, setDriverRouteResult] = useState(null)

  const driverRouteKey = selectedDriver && driverDay
    ? `${selectedDriver.id}:${driverDay.timeline.map((event) => (
        `${event.id}@${event.locationId ?? 'truck'}@${Array.isArray(event.coordinates) ? event.coordinates.join(',') : ''}`
      )).join('|')}`
    : null
  const plannedDriverRoutes = useMemo(
    () => (
      driverRouteResult?.key === driverRouteKey
        ? driverRouteResult.segments
        : []
    ),
    [driverRouteKey, driverRouteResult],
  )
  const nextStopId = nextOperationalEventId(driverDay)

  useEffect(() => {
    onSelectSubjectRef.current = onSelectSubject
  }, [onSelectSubject])

  useEffect(() => {
    onPreviewPlanningPlaceRef.current = onPreviewPlanningPlace
  }, [onPreviewPlanningPlace])

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

    const loadSelected = isSelection(selection, SELECTION_TYPES.LOAD)
    const routeAccessByEventId = buildRouteAccessByEventId(plannedDriverRoutes)

    drivers.forEach((driver) => {
      if (loadSelected && (!selectedDriver || driver.id !== selectedDriver.id)) return
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

    if (workspaceOpen && !loadSelected) {
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
    const routeAnchors = driverIdentity && driverDay
      ? buildDriverRouteAnchors(driverDay, locations)
      : []
    const previewPickupId = freightRoutePreview?.pickup?.id ?? null
    const previewDeliveryId = freightRoutePreview?.delivery?.id ?? null

    const addRouteAnchorMarker = (routeAnchor, { interactive = false } = {}) => {
      const selected = Boolean(
        selectedStop
        && routeAnchor.eventIds.includes(selectedStop.id),
      )
      const element = document.createElement(interactive ? 'button' : 'div')
      if (interactive) element.type = 'button'
      element.className = `poi-marker driver-route-anchor ${routeAnchor.poiType} ${selected ? 'selected' : ''}`
      element.style.setProperty('--driver-color', driverIdentity.color)
      element.setAttribute(
        'aria-label',
        `${routeAnchor.badge ? `${routeAnchor.badge} · ` : ''}${routeAnchor.locationLabel}`,
      )
      element.innerHTML = `${facilityMarkup({
        type: routeAnchor.poiType,
        badge: routeAnchor.badge,
      })}<small>${routeAnchor.locationLabel}</small>`

      if (interactive && routeAnchor.eventIds.length) {
        element.addEventListener('click', (event) => {
          event.preventDefault()
          event.stopPropagation()
          onSelectSubjectRef.current?.(SELECTION_TYPES.STOP, routeAnchor.eventIds[0])
        })
      }

      let offset = [0, 0]
      if (routeAnchor.locationId && routeAnchor.locationId === previewPickupId) offset = [-18, 0]
      else if (routeAnchor.locationId && routeAnchor.locationId === previewDeliveryId) offset = [18, 0]

      const anchorEventId = (
        selectedStop
        && routeAnchor.eventIds.includes(selectedStop.id)
      )
        ? selectedStop.id
        : routeAnchor.eventIds[0]
      const markerCoordinates = routeAccessCoordinate(
        routeAccessByEventId,
        anchorEventId,
        routeAnchor.coordinates,
      )

      const marker = new Marker({ element, anchor: 'bottom', offset })
        .setLngLat(markerCoordinates)
        .addTo(map)

      markerRefs.current.set(`route-anchor:${routeAnchor.id}`, marker)
    }

    if (workspaceOpen && driverIdentity) {
      for (const routeAnchor of routeAnchors) {
        addRouteAnchorMarker(routeAnchor)
      }
    } else if (driverIdentity) {
      for (const routeAnchor of routeAnchors) {
        const isFreightLocation = routeAnchor.eventKinds.includes('freight-stop')
        if (!isFreightLocation) addRouteAnchorMarker(routeAnchor, { interactive: true })
      }
    }

    if (
      !workspaceOpen
      && selectedDriver
      && (selectedStop?.kind === 'lunch' || selectedStop?.kind === 'staging')
    ) {
      for (const option of planningPlaceOptions) {
        if (
          !Array.isArray(option.coordinates)
          || option.id === selectedStop.locationId
          || option.id === pendingPlanningPlace?.locationId
        ) continue

        const element = document.createElement('button')
        element.type = 'button'
        element.className = `poi-marker planning-place-option ${option.poiType}`
        element.style.setProperty('--driver-color', driverIdentity?.color ?? '#8ea3b0')
        element.setAttribute(
          'aria-label',
          `Choose ${option.label} for ${selectedStop.kind}`,
        )
        element.innerHTML = `${facilityMarkup({
          type: option.poiType,
          badge: selectedStop.kind === 'lunch' ? 'L?' : 'S?',
        })}<small>${option.label}</small>`
        element.addEventListener('click', (event) => {
          event.preventDefault()
          event.stopPropagation()
          onPreviewPlanningPlaceRef.current?.({
            driverId: selectedDriver.id,
            kind: selectedStop.kind,
            locationId: option.id,
          })
        })

        const marker = new Marker({ element, anchor: 'bottom' })
          .setLngLat(option.coordinates)
          .addTo(map)

        markerRefs.current.set(`planning-place:${option.id}`, marker)
      }
    }



  }, [driverDay, drivers, freightRoutePreview, locations, marketLanes, pendingPlanningPlace, plannedDriverRoutes, planningPlaceOptions, selectedDriver, selection, selectedStop, workspaceOpen])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return undefined

    const clearCommittedStops = () => {
      if (map.getLayer(COMMITTED_STOP_LABEL_LAYER)) map.removeLayer(COMMITTED_STOP_LABEL_LAYER)
      if (map.getLayer(COMMITTED_STOP_BADGE_LAYER)) map.removeLayer(COMMITTED_STOP_BADGE_LAYER)
      if (map.getLayer(COMMITTED_STOP_CIRCLE_LAYER)) map.removeLayer(COMMITTED_STOP_CIRCLE_LAYER)
      if (map.getSource(COMMITTED_STOP_SOURCE)) map.removeSource(COMMITTED_STOP_SOURCE)
    }

    clearCommittedStops()

    if (workspaceOpen || !selectedDriver || !driverDay?.freightStops?.length) {
      return clearCommittedStops
    }

    const identity = getDriverIdentity(selectedDriver.id)
    const accessByEventId = buildRouteAccessByEventId(plannedDriverRoutes)
    const features = driverDay.freightStops
      .map((stop) => {
        const coordinates = routeAccessCoordinate(
          accessByEventId,
          stop.id,
          stop.coordinates,
        )
        if (!Array.isArray(coordinates)) return null

        const selected = isSelection(selection, SELECTION_TYPES.STOP, stop.id)
        const priority = selected || stop.id === nextStopId

        return {
          type: 'Feature',
          id: stop.id,
          properties: {
            id: stop.id,
            role: stop.role,
            badge: `${stop.role === 'pickup' ? 'P' : 'D'}${stop.loadOrdinal}`,
            label: stop.locationLabel,
            priority,
            selected,
          },
          geometry: {
            type: 'Point',
            coordinates,
          },
        }
      })
      .filter(Boolean)

    if (!features.length) return clearCommittedStops

    map.addSource(COMMITTED_STOP_SOURCE, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    })

    map.addLayer({
      id: COMMITTED_STOP_CIRCLE_LAYER,
      type: 'circle',
      source: COMMITTED_STOP_SOURCE,
      paint: {
        'circle-radius': [
          'case',
          ['boolean', ['get', 'selected'], false],
          16,
          14,
        ],
        'circle-color': '#101a22',
        'circle-stroke-color': identity.color,
        'circle-stroke-width': [
          'case',
          ['boolean', ['get', 'selected'], false],
          3,
          2,
        ],
        'circle-opacity': 0.98,
        'circle-stroke-opacity': 1,
      },
    })

    map.addLayer({
      id: COMMITTED_STOP_BADGE_LAYER,
      type: 'symbol',
      source: COMMITTED_STOP_SOURCE,
      layout: {
        'text-field': ['get', 'badge'],
        'text-size': 10,
        'text-font': ['Open Sans Bold'],
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': identity.color,
        'text-halo-color': '#071019',
        'text-halo-width': 1,
      },
    })

    map.addLayer({
      id: COMMITTED_STOP_LABEL_LAYER,
      type: 'symbol',
      source: COMMITTED_STOP_SOURCE,
      filter: ['==', ['get', 'priority'], true],
      layout: {
        'text-field': ['get', 'label'],
        'text-size': 11,
        'text-font': ['Open Sans Semibold'],
        'text-anchor': 'top',
        'text-offset': [0, 1.9],
        'text-max-width': 18,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': '#d7e1e7',
        'text-halo-color': '#071018',
        'text-halo-width': 2,
      },
    })

    const selectStop = (event) => {
      const stopId = event.features?.[0]?.properties?.id
      if (stopId) onSelectSubjectRef.current?.(SELECTION_TYPES.STOP, stopId)
    }
    const showStopLabel = (event) => {
      const stopId = event.features?.[0]?.properties?.id
      map.getCanvas().style.cursor = 'pointer'
      if (!stopId || !map.getLayer(COMMITTED_STOP_LABEL_LAYER)) return
      map.setFilter(COMMITTED_STOP_LABEL_LAYER, [
        'any',
        ['==', ['get', 'priority'], true],
        ['==', ['get', 'id'], stopId],
      ])
    }
    const resetStopLabel = () => {
      map.getCanvas().style.cursor = ''
      if (!map.getLayer(COMMITTED_STOP_LABEL_LAYER)) return
      map.setFilter(COMMITTED_STOP_LABEL_LAYER, ['==', ['get', 'priority'], true])
    }

    for (const layerId of [
      COMMITTED_STOP_CIRCLE_LAYER,
      COMMITTED_STOP_BADGE_LAYER,
      COMMITTED_STOP_LABEL_LAYER,
    ]) {
      map.on('click', layerId, selectStop)
      map.on('mouseenter', layerId, showStopLabel)
      map.on('mouseleave', layerId, resetStopLabel)
    }

    return () => {
      for (const layerId of [
        COMMITTED_STOP_CIRCLE_LAYER,
        COMMITTED_STOP_BADGE_LAYER,
        COMMITTED_STOP_LABEL_LAYER,
      ]) {
        map.off('click', layerId, selectStop)
        map.off('mouseenter', layerId, showStopLabel)
        map.off('mouseleave', layerId, resetStopLabel)
      }
      resetStopLabel()
      clearCommittedStops()
    }
  }, [
    driverDay,
    mapReady,
    nextStopId,
    plannedDriverRoutes,
    selectedDriver,
    selection,
    workspaceOpen,
  ])

  useEffect(() => {
    if (!driverRouteKey || !driverDay) return undefined

    const segmentSpecs = buildDriverRouteSegments(driverDay, locations)
    let active = true

    hydrateCommittedRouteSegments(segmentSpecs, {
      routeSegment: calculateRoadRoute,
      isActive: () => active,
      onProgress: (segments) => {
        if (!active) return
        setDriverRouteResult({ key: driverRouteKey, segments })
      },
    }).then((segments) => {
      if (!active) return
      setDriverRouteResult({ key: driverRouteKey, segments })
    })

    return () => {
      active = false
    }
  }, [driverDay, driverRouteKey, locations])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return undefined

    const clearDriverRoute = () => {
      if (map.getLayer(DRIVER_ROUTE_PICKUP_LAYER)) map.removeLayer(DRIVER_ROUTE_PICKUP_LAYER)
      if (map.getLayer(DRIVER_ROUTE_PICKUP_CASING_LAYER)) map.removeLayer(DRIVER_ROUTE_PICKUP_CASING_LAYER)
      if (map.getLayer(DRIVER_ROUTE_LAYER)) map.removeLayer(DRIVER_ROUTE_LAYER)
      if (map.getLayer(DRIVER_ROUTE_CASING_LAYER)) map.removeLayer(DRIVER_ROUTE_CASING_LAYER)
      if (map.getSource(DRIVER_ROUTE_SOURCE)) map.removeSource(DRIVER_ROUTE_SOURCE)
    }

    clearDriverRoute()

    if (!selectedDriver || !plannedDriverRoutes.length) return clearDriverRoute

    const identity = getDriverIdentity(selectedDriver.id)
    const insertion = freightRoutePreview?.evaluation?.insertion ?? null
    const segments = markInsertionAffectedSegment(plannedDriverRoutes, insertion)
    const features = segments
      .filter((segment) => (
        segment.route?.source === 'road'
        && Array.isArray(segment.route?.routeShape)
        && segment.route.routeShape.length >= 2
      ))
      .map((segment) => ({
        type: 'Feature',
        properties: {
          affected: segment.affected,
          destinationRole: segment.toRole ?? '',
        },
        geometry: { type: 'LineString', coordinates: segment.route.routeShape },
      }))

    if (!features.length) return clearDriverRoute

    map.addSource(DRIVER_ROUTE_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    })

    const beforeId = map.getLayer(COMMITTED_STOP_CIRCLE_LAYER)
      ? COMMITTED_STOP_CIRCLE_LAYER
      : map.getLayer(DEADHEAD_CASING_LAYER)
        ? DEADHEAD_CASING_LAYER
        : map.getLayer(LOADED_CASING_LAYER)
          ? LOADED_CASING_LAYER
          : undefined

    const solidLegFilter = ['!=', ['get', 'destinationRole'], 'pickup']
    const pickupLegFilter = ['==', ['get', 'destinationRole'], 'pickup']

    map.addLayer({
      id: DRIVER_ROUTE_CASING_LAYER,
      type: 'line',
      source: DRIVER_ROUTE_SOURCE,
      filter: solidLegFilter,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ROUTE_CASING,
        'line-width': 7,
        'line-opacity': [
          'case',
          ['boolean', ['get', 'affected'], false],
          0.22,
          freightRoutePreview ? 0.62 : 0.82,
        ],
      },
    }, beforeId)

    map.addLayer({
      id: DRIVER_ROUTE_LAYER,
      type: 'line',
      source: DRIVER_ROUTE_SOURCE,
      filter: solidLegFilter,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': identity.color,
        'line-width': 4,
        'line-opacity': [
          'case',
          ['boolean', ['get', 'affected'], false],
          0.14,
          freightRoutePreview ? 0.62 : 0.88,
        ],
      },
    }, beforeId)

    map.addLayer({
      id: DRIVER_ROUTE_PICKUP_CASING_LAYER,
      type: 'line',
      source: DRIVER_ROUTE_SOURCE,
      filter: pickupLegFilter,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ROUTE_CASING,
        'line-width': 7,
        'line-opacity': [
          'case',
          ['boolean', ['get', 'affected'], false],
          0.22,
          freightRoutePreview ? 0.62 : 0.82,
        ],
        'line-dasharray': PICKUP_CASING_DASH,
      },
    }, beforeId)

    map.addLayer({
      id: DRIVER_ROUTE_PICKUP_LAYER,
      type: 'line',
      source: DRIVER_ROUTE_SOURCE,
      filter: pickupLegFilter,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': identity.color,
        'line-width': 4,
        'line-opacity': [
          'case',
          ['boolean', ['get', 'affected'], false],
          0.14,
          freightRoutePreview ? 0.62 : 0.88,
        ],
        'line-dasharray': PICKUP_ROUTE_DASH,
      },
    }, beforeId)



    return clearDriverRoute
  }, [freightRoutePreview, mapReady, plannedDriverRoutes, selectedDriver])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return undefined

    const clearRoute = () => {
      for (const layerId of [
        DEADHEAD_LAYER,
        DEADHEAD_CASING_LAYER,
        LOADED_LAYER,
        LOADED_CASING_LAYER,
        REJOIN_LAYER,
        REJOIN_CASING_LAYER,
      ]) {
        if (map.getLayer(layerId)) map.removeLayer(layerId)
      }
      for (const sourceId of [DEADHEAD_SOURCE, LOADED_SOURCE, REJOIN_SOURCE]) {
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
    addRoute({
      sourceId: REJOIN_SOURCE,
      casingLayerId: REJOIN_CASING_LAYER,
      layerId: REJOIN_LAYER,
      route: freightRoutePreview.rejoinRoute,
      color: PREVIEW_DEADHEAD,
      width: 3,
      dashed: true,
    })

    const addPreviewMarker = (location, role, accessCoordinates = null) => {
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
          .setLngLat(accessCoordinates ?? location.coordinates)
          .addTo(map),
      )
    }

    const pickupAccess = (
      freightRoutePreview.deadheadRoute?.destinationAccessCoordinates
      ?? freightRoutePreview.loadedRoute?.originAccessCoordinates
      ?? null
    )
    const deliveryAccess = (
      freightRoutePreview.loadedRoute?.destinationAccessCoordinates
      ?? freightRoutePreview.rejoinRoute?.originAccessCoordinates
      ?? null
    )

    addPreviewMarker(freightRoutePreview.pickup, 'pickup', pickupAccess)
    addPreviewMarker(freightRoutePreview.delivery, 'delivery', deliveryAccess)

    const points = []
    for (const route of [
      freightRoutePreview.deadheadRoute,
      freightRoutePreview.loadedRoute,
      freightRoutePreview.rejoinRoute,
    ]) {
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

    if (
      selectedStop
      && ['lunch', 'staging'].includes(selectedStop.kind)
      && planningPlaceOptions.length
    ) {
      const points = planningPlaceOptions
        .map((option) => option.coordinates)
        .filter((coordinates) => Array.isArray(coordinates))

      if (Array.isArray(selectedStop.coordinates)) points.push(selectedStop.coordinates)

      if (points.length >= 2) {
        const lngs = points.map((point) => point[0])
        const lats = points.map((point) => point[1])
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          {
            padding: { top: 64, right: 440, bottom: 70, left: 70 },
            maxZoom: 10.4,
            duration: 450,
          },
        )
        return
      }
    }

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
  }, [freightRoutePreview, planningPlaceOptions, selectedDriver, selectedStop, workspaceOpen])

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
