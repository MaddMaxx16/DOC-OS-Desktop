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
  coordinateAlongRouteShape,
  routeExecutionPosition,
  routeSegmentExecutionPhase,
} from '../domain/live/routeExecution.js'
import { SIMULATION_TICK_MS } from '../domain/live/liveOperations.js'
import {
  buildDriverRouteSegments,
  markInsertionAffectedSegment,
} from '../domain/routing/driverRoutePlan.js'
import { hydrateCommittedRouteSegments } from '../domain/routing/committedRouteHydration.js'
import { nextOperationalEventId } from '../domain/routing/mapRouteDisplay.js'
import {
  buildRouteAccessByEventId,
  routeAccessCoordinate,
  stitchCommittedRouteSegments,
  stitchFreightPreviewRoutes,
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
const FLEET_ACTIVE_ROUTE_SOURCE = 'fleet-active-route-source'
const FLEET_ACTIVE_ROUTE_CASING_LAYER = 'fleet-active-route-casing-layer'
const FLEET_ACTIVE_ROUTE_LAYER = 'fleet-active-route-layer'
const COMMITTED_STOP_SOURCE = 'committed-stop-source'
const COMMITTED_STOP_CIRCLE_LAYER = 'committed-stop-circle-layer'
const COMMITTED_STOP_BADGE_LAYER = 'committed-stop-badge-layer'
const COMMITTED_STOP_ICON_LAYER = 'committed-stop-icon-layer'
const COMMITTED_STOP_LABEL_LAYER = 'committed-stop-label-layer'

const PLANNING_POI_SOURCE = 'planning-poi-source'
const PLANNING_POI_CIRCLE_LAYER = 'planning-poi-circle-layer'
const PLANNING_POI_ICON_LAYER = 'planning-poi-icon-layer'
const PLANNING_POI_LABEL_LAYER = 'planning-poi-label-layer'

const POI_ICON_IDS = Object.freeze({
  yard: 'poi-yard',
  staging: 'poi-staging',
  fuel: 'poi-fuel',
  food: 'poi-food',
  'truck-stop': 'poi-truck-stop',
  service: 'poi-service',
  warehouse: 'poi-warehouse',
})

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

function drawPoiIcon(type) {
  const canvas = document.createElement('canvas')
  canvas.width = 48
  canvas.height = 48
  const context = canvas.getContext('2d')
  if (!context) return null

  context.clearRect(0, 0, 48, 48)
  context.strokeStyle = '#f3f7fa'
  context.fillStyle = '#f3f7fa'
  context.lineWidth = 3.5
  context.lineCap = 'round'
  context.lineJoin = 'round'

  const strokePath = (path) => context.stroke(new Path2D(path))

  if (type === 'yard') {
    strokePath('M7 15h34v25H7z M12 9h24v8H12z M13 24h8v16h-8 M27 24h8v16h-8')
  } else if (type === 'staging') {
    strokePath('M8 8h32v32H8z M18 34V14h8c7 0 11 3 11 9s-4 9-11 9h-3 M23 19v8h3c4 0 6-1 6-4s-2-4-6-4z')
  } else if (type === 'fuel') {
    strokePath('M10 7h20v34H10z M14 12h12v9H14z M30 15h5l5 6v15c0 3-2 5-5 5s-5-2-5-5 M35 15v7h5')
  } else if (type === 'food') {
    strokePath('M14 7v15 M9 7v10c0 4 2 6 5 6s5-2 5-6V7 M14 23v18 M31 7c5 5 7 11 7 18h-7v16 M31 7v18')
  } else if (type === 'truck-stop') {
    strokePath('M5 13h23v20H5z M28 20h8l7 7v6H28z')
    context.beginPath()
    context.arc(14, 35, 4, 0, Math.PI * 2)
    context.arc(36, 35, 4, 0, Math.PI * 2)
    context.stroke()
  } else if (type === 'service') {
    strokePath('M31 8a10 10 0 0 0-10 13L8 34l6 6 13-13A10 10 0 0 0 40 17l-7 7-6-6 7-7a10 10 0 0 0-3-3z')
  } else {
    strokePath('M6 18L24 7l18 11v23H6z M12 24h7v17h-7 M23 24h7v17h-7 M34 24h4v17h-4 M10 18h28')
  }

  return context.getImageData(0, 0, 48, 48)
}

function registerPoiIconImages(map) {
  for (const [type, imageId] of Object.entries(POI_ICON_IDS)) {
    if (map.hasImage(imageId)) continue
    const image = drawPoiIcon(type)
    if (image) map.addImage(imageId, image, { pixelRatio: 2 })
  }
}

function poiIconImageExpression() {
  return [
    'match',
    ['get', 'poiType'],
    'yard', POI_ICON_IDS.yard,
    'staging', POI_ICON_IDS.staging,
    'fuel', POI_ICON_IDS.fuel,
    'food', POI_ICON_IDS.food,
    'truck-stop', POI_ICON_IDS['truck-stop'],
    'service', POI_ICON_IDS.service,
    POI_ICON_IDS.warehouse,
  ]
}

function truckFacingAlongRoute(routeShape = [], progress = 0, fallback = 'right') {
  if (!Array.isArray(routeShape) || routeShape.length < 2) return fallback

  const clampedProgress = Math.min(1, Math.max(0, Number(progress) || 0))
  const sampleWindow = 0.004
  const before = coordinateAlongRouteShape(
    routeShape,
    Math.max(0, clampedProgress - sampleWindow),
  )
  const after = coordinateAlongRouteShape(
    routeShape,
    Math.min(1, clampedProgress + sampleWindow),
  )

  if (!Array.isArray(before) || !Array.isArray(after)) return fallback

  const longitudeDelta = Number(after[0]) - Number(before[0])
  if (!Number.isFinite(longitudeDelta) || Math.abs(longitudeDelta) < 0.00002) {
    return fallback
  }

  return longitudeDelta < 0 ? 'left' : 'right'
}

function committedRouteComplete(segments = []) {
  return segments.length > 0
    && segments.every((segment) => (
      segment.route?.source === 'road'
      && Array.isArray(segment.route?.routeShape)
      && segment.route.routeShape.length >= 2
    ))
}

function waitForRouteRetry(milliseconds, isActive) {
  return new Promise((resolve) => {
    const startedAt = Date.now()

    const check = () => {
      if (!isActive() || Date.now() - startedAt >= milliseconds) {
        resolve()
        return
      }
      setTimeout(check, Math.min(250, milliseconds))
    }

    check()
  })
}

function committedRouteGeoJson(segments = [], execution = null) {
  return {
    type: 'FeatureCollection',
    features: segments
      .filter((segment) => (
        segment.route?.source === 'road'
        && Array.isArray(segment.route?.routeShape)
        && segment.route.routeShape.length >= 2
      ))
      .map((segment) => ({
        type: 'Feature',
        properties: {
          id: segment.id,
          affected: segment.affected,
          destinationRole: segment.toRole ?? '',
          executionPhase: routeSegmentExecutionPhase(segment.id, execution),
        },
        geometry: {
          type: 'LineString',
          coordinates: segment.route.routeShape,
        },
      })),
  }
}

function fleetActiveSegment(
  driverId,
  liveDriverStates = {},
  fleetDisplayRoutesByDriverId = {},
) {
  const live = liveDriverStates[driverId] ?? null
  if (live?.executionPhase !== 'en-route' || !live.activeSegmentId) {
    return null
  }

  return (fleetDisplayRoutesByDriverId[driverId] ?? [])
    .find((segment) => segment.id === live.activeSegmentId) ?? null
}

function fleetActiveRouteGeoJson(
  drivers = [],
  liveDriverStates = {},
  fleetDisplayRoutesByDriverId = {},
  selectedDriverId = null,
) {
  const features = []

  for (const driver of drivers) {
    if (driver.id === selectedDriverId) continue

    const segment = fleetActiveSegment(
      driver.id,
      liveDriverStates,
      fleetDisplayRoutesByDriverId,
    )
    const routeShape = segment?.route?.routeShape ?? []

    if (!Array.isArray(routeShape) || routeShape.length < 2) continue

    features.push({
      type: 'Feature',
      properties: {
        driverId: driver.id,
        color: getDriverIdentity(driver.id).color,
      },
      geometry: {
        type: 'LineString',
        coordinates: routeShape,
      },
    })
  }

  return {
    type: 'FeatureCollection',
    features,
  }
}

function fleetStatusLabel(driver, liveState) {
  if (!liveState?.sent || liveState.phase === 'draft') return 'PLAN NOT SENT'
  if (liveState.phase === 'scheduled') return 'SCHEDULED'
  if (liveState.phase === 'closed') return 'SHIFT CLOSED'

  if (liveState.executionPhase === 'en-route') return 'EN ROUTE'
  if (liveState.executionPhase === 'service-loading') return 'LOADING'
  if (liveState.executionPhase === 'service-unloading') return 'UNLOADING'
  if (liveState.executionPhase === 'dwell-break') return 'ON BREAK'
  if (liveState.executionPhase === 'arrived') return 'ARRIVED'
  if (liveState.executionPhase === 'complete') return 'COMPLETE'

  return liveState.label ?? driver.status
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

function driverDayRouteKey(day = null) {
  if (!day?.driverId || !Array.isArray(day.timeline)) return null

  return `${day.driverId}:${day.timeline.map((event) => (
    `${event.id}@${event.locationId ?? 'truck'}@${Array.isArray(event.coordinates) ? event.coordinates.join(',') : ''}`
  )).join('|')}`
}

export default function OperationsMap({
  drivers,
  driverDays = [],
  driverDay,
  selectedDriver,
  selectedStop,
  selection,
  liveDriverStates = {},
  liveState = null,
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
  const cameraFrameKeyRef = useRef(null)
  const truckAnimationFrameRefs = useRef(new globalThis.Map())
  const truckMotionRefs = useRef(new globalThis.Map())
  const fleetRouteResultsRef = useRef({})
  const [mapReady, setMapReady] = useState(false)
  const [driverRouteResult, setDriverRouteResult] = useState(null)
  const [fleetRouteResults, setFleetRouteResults] = useState({})
  const [openDriverLabelId, setOpenDriverLabelId] = useState(null)

  const driverRouteKey = driverDayRouteKey(driverDay)
  const committedSelectedRoute = selectedDriver
    ? fleetRouteResults[selectedDriver.id] ?? null
    : null
  const plannedDriverRoutes = useMemo(() => {
    if (!selectedDriver) return []

    if (
      driverRouteResult
      && driverRouteResult.driverId === selectedDriver.id
      && driverRouteResult.key === driverRouteKey
      && Array.isArray(driverRouteResult.segments)
    ) {
      return driverRouteResult.segments
    }

    if (
      committedSelectedRoute
      && Array.isArray(committedSelectedRoute.segments)
    ) {
      return committedSelectedRoute.segments
    }

    return []
  }, [
    committedSelectedRoute,
    driverRouteKey,
    driverRouteResult,
    selectedDriver,
  ])
  const displayDriverRoutes = useMemo(
    () => stitchCommittedRouteSegments(plannedDriverRoutes),
    [plannedDriverRoutes],
  )
  const fleetDisplayRoutesByDriverId = useMemo(
    () => Object.fromEntries(
      driverDays.map((day) => [
        day.driverId,
        stitchCommittedRouteSegments(
          fleetRouteResults[day.driverId]?.segments ?? [],
        ),
      ]),
    ),
    [driverDays, fleetRouteResults],
  )
  const nextStopId = liveState?.nextEventId ?? nextOperationalEventId(driverDay)
  const completedEventKey = (liveState?.completedEventIds ?? []).join('|')
  const completedEventIds = useMemo(
    () => new Set(completedEventKey ? completedEventKey.split('|') : []),
    [completedEventKey],
  )
  const selectedDriverLiveCoordinates = useMemo(
    () => (
      selectedDriver
        ? routeExecutionPosition(
            liveDriverStates[selectedDriver.id] ?? liveState,
            fleetDisplayRoutesByDriverId[selectedDriver.id] ?? [],
            selectedDriver.coordinates ?? null,
          )
        : null
    ),
    [
      fleetDisplayRoutesByDriverId,
      liveDriverStates,
      liveState,
      selectedDriver,
    ],
  )
  const fleetActiveRouteData = useMemo(
    () => fleetActiveRouteGeoJson(
      drivers,
      liveDriverStates,
      fleetDisplayRoutesByDriverId,
      selectedDriver?.id ?? null,
    ),
    [
      drivers,
      fleetDisplayRoutesByDriverId,
      liveDriverStates,
      selectedDriver,
    ],
  )

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
      registerPoiIconImages(map)
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
      truckAnimationFrameRefs.current.forEach((frameId) => cancelAnimationFrame(frameId))
      truckAnimationFrameRefs.current.clear()
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
    drivers.forEach((driver) => {
      if (loadSelected && (!selectedDriver || driver.id !== selectedDriver.id)) return
      const identity = getDriverIdentity(driver.id)
      const selected = selectedDriver?.id === driver.id
      const context = Boolean(selectedDriver && !selected)
      const labelOpen = openDriverLabelId === driver.id
      const motion = truckMotionRefs.current.get(driver.id)
      const element = document.createElement('button')
      element.type = 'button'
      element.className = `driver-marker ${workspaceOpen ? 'market-mode' : ''} ${selected ? 'selected' : ''} ${context ? 'context' : ''} ${labelOpen ? 'label-open' : ''}`
      element.style.setProperty('--driver-color', identity.color)
      element.dataset.driverId = driver.id
      element.dataset.facing = motion?.facing ?? 'right'
      element.dataset.livePhase = motion?.executionPhase ?? 'planned'
      element.setAttribute(
        'aria-label',
        `Select ${driver.name}, ${motion?.label ?? identity.colorName}`,
      )
      element.innerHTML = `${truckMarkup(driver.initials)}<small><i></i>${driver.name}</small>`
      element.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        setOpenDriverLabelId((current) => current === driver.id ? null : driver.id)
        onSelectSubjectRef.current?.(SELECTION_TYPES.DRIVER, driver.id)
      })

      const marker = new Marker({ element, anchor: 'center' })
        .setLngLat(
          Array.isArray(motion?.coordinates)
            ? motion.coordinates
            : driver.coordinates,
        )
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

  }, [
    drivers,
    locations,
    marketLanes,
    openDriverLabelId,
    selectedDriver,
    selection,
    workspaceOpen,
  ])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return undefined

    const closeDriverLabel = () => setOpenDriverLabelId(null)
    map.on('click', closeDriverLabel)

    return () => {
      map.off('click', closeDriverLabel)
    }
  }, [mapReady])

  useEffect(() => {
    for (const driver of drivers) {
      const driverId = driver.id
      const live = liveDriverStates[driverId] ?? null
      const routes = fleetDisplayRoutesByDriverId[driverId] ?? []
      const marker = markerRefs.current.get(`driver:${driverId}`) ?? null
      const element = marker?.getElement?.() ?? null
      const previousMotion = truckMotionRefs.current.get(driverId) ?? {
        driverId,
        segmentId: null,
        progress: 0,
        facing: 'right',
        coordinates: driver.coordinates,
        executionPhase: 'planned',
        label: driver.status,
      }

      const previousFrameId = truckAnimationFrameRefs.current.get(driverId)
      if (previousFrameId) {
        cancelAnimationFrame(previousFrameId)
        truckAnimationFrameRefs.current.delete(driverId)
      }

      if (element) {
        element.dataset.livePhase = live?.executionPhase ?? 'planned'
        element.setAttribute(
          'aria-label',
          `Select ${driver.name}, ${live?.label ?? driver.status}`,
        )
      }

      const activeSegmentId = live?.activeSegmentId ?? null
      const targetProgress = Math.min(
        1,
        Math.max(0, Number(live?.activeSegmentProgress) || 0),
      )
      const activeSegment = fleetActiveSegment(
        driverId,
        liveDriverStates,
        fleetDisplayRoutesByDriverId,
      )
      const routeShape = activeSegment?.route?.routeShape ?? []
      const targetCoordinates = routeExecutionPosition(
        live,
        routes,
        driver.coordinates ?? null,
      )

      if (
        live?.executionPhase !== 'en-route'
        || !activeSegmentId
        || routeShape.length < 2
      ) {
        if (marker && Array.isArray(targetCoordinates)) {
          marker.setLngLat(targetCoordinates)
        }

        truckMotionRefs.current.set(driverId, {
          driverId,
          segmentId: activeSegmentId,
          progress: targetProgress,
          facing: previousMotion.facing ?? 'right',
          coordinates: Array.isArray(targetCoordinates)
            ? targetCoordinates
            : previousMotion.coordinates ?? driver.coordinates,
          executionPhase: live?.executionPhase ?? 'planned',
          label: live?.label ?? driver.status,
        })
        continue
      }

      const continuingSegment = (
        previousMotion.segmentId === activeSegmentId
        && previousMotion.progress <= targetProgress
      )
      const startProgress = continuingSegment
        ? previousMotion.progress
        : 0

      const targetFacing = truckFacingAlongRoute(
        routeShape,
        targetProgress,
        previousMotion.facing ?? 'right',
      )

      if (!marker) {
        truckMotionRefs.current.set(driverId, {
          driverId,
          segmentId: activeSegmentId,
          progress: targetProgress,
          facing: targetFacing,
          coordinates: Array.isArray(targetCoordinates)
            ? targetCoordinates
            : previousMotion.coordinates ?? driver.coordinates,
          executionPhase: live?.executionPhase ?? 'planned',
          label: live?.label ?? driver.status,
        })
        continue
      }

      if (targetProgress <= startProgress + 0.000001) {
        const coordinates = coordinateAlongRouteShape(routeShape, targetProgress)
          ?? targetCoordinates
        if (Array.isArray(coordinates)) marker.setLngLat(coordinates)
        if (element) element.dataset.facing = targetFacing

        truckMotionRefs.current.set(driverId, {
          driverId,
          segmentId: activeSegmentId,
          progress: targetProgress,
          facing: targetFacing,
          coordinates: Array.isArray(coordinates)
            ? coordinates
            : previousMotion.coordinates ?? driver.coordinates,
          executionPhase: live?.executionPhase ?? 'planned',
          label: live?.label ?? driver.status,
        })
        continue
      }

      const startedAt = performance.now()
      const animationDurationMs = SIMULATION_TICK_MS * 1.15

      const animate = (now) => {
        const elapsed = Math.max(0, now - startedAt)
        const frameProgress = Math.min(1, elapsed / animationDurationMs)
        const renderedProgress = startProgress
          + ((targetProgress - startProgress) * frameProgress)
        const coordinates = coordinateAlongRouteShape(routeShape, renderedProgress)
        const facing = truckFacingAlongRoute(
          routeShape,
          renderedProgress,
          truckMotionRefs.current.get(driverId)?.facing
            ?? previousMotion.facing
            ?? 'right',
        )

        if (Array.isArray(coordinates)) marker.setLngLat(coordinates)
        if (element) element.dataset.facing = facing

        truckMotionRefs.current.set(driverId, {
          driverId,
          segmentId: activeSegmentId,
          progress: renderedProgress,
          facing,
          coordinates: Array.isArray(coordinates)
            ? coordinates
            : previousMotion.coordinates ?? driver.coordinates,
          executionPhase: live?.executionPhase ?? 'planned',
          label: live?.label ?? driver.status,
        })

        if (frameProgress < 1) {
          const frameId = requestAnimationFrame(animate)
          truckAnimationFrameRefs.current.set(driverId, frameId)
        } else {
          truckAnimationFrameRefs.current.delete(driverId)
        }
      }

      const frameId = requestAnimationFrame(animate)
      truckAnimationFrameRefs.current.set(driverId, frameId)
    }

    return () => {
      truckAnimationFrameRefs.current.forEach((frameId) => cancelAnimationFrame(frameId))
      truckAnimationFrameRefs.current.clear()
    }
  }, [
    drivers,
    fleetDisplayRoutesByDriverId,
    liveDriverStates,
    locations,
    marketLanes,
    openDriverLabelId,
    selectedDriver,
    selection,
    workspaceOpen,
  ])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return undefined

    const clearCommittedStops = () => {
      if (map.getLayer(COMMITTED_STOP_LABEL_LAYER)) map.removeLayer(COMMITTED_STOP_LABEL_LAYER)
      if (map.getLayer(COMMITTED_STOP_ICON_LAYER)) map.removeLayer(COMMITTED_STOP_ICON_LAYER)
      if (map.getLayer(COMMITTED_STOP_BADGE_LAYER)) map.removeLayer(COMMITTED_STOP_BADGE_LAYER)
      if (map.getLayer(COMMITTED_STOP_CIRCLE_LAYER)) map.removeLayer(COMMITTED_STOP_CIRCLE_LAYER)
      if (map.getSource(COMMITTED_STOP_SOURCE)) map.removeSource(COMMITTED_STOP_SOURCE)
    }

    clearCommittedStops()

    if (!selectedDriver || !driverDay?.timeline?.length) {
      return clearCommittedStops
    }

    const operationalStops = driverDay.timeline.filter((stop) => (
      stop.kind === 'freight-stop'
      || stop.kind === 'lunch'
      || stop.kind === 'staging'
    ))
    if (!operationalStops.length) return clearCommittedStops

    const identity = getDriverIdentity(selectedDriver.id)
    const accessByEventId = buildRouteAccessByEventId(displayDriverRoutes)
    const features = operationalStops
      .map((stop) => {
        const coordinates = routeAccessCoordinate(
          accessByEventId,
          stop.id,
          null,
        )
        if (!Array.isArray(coordinates)) return null

        const selected = isSelection(selection, SELECTION_TYPES.STOP, stop.id)
        const completed = completedEventIds.has(stop.id)
        const planningPreview = Boolean(
          pendingPlanningPlace
          && pendingPlanningPlace.driverId === selectedDriver.id
          && pendingPlanningPlace.kind === stop.kind
          && pendingPlanningPlace.locationId === stop.locationId
        )
        const priority = selected || stop.id === nextStopId || planningPreview
        const location = locations[stop.locationId]
        const poiType = stop.kind === 'freight-stop'
          ? 'warehouse'
          : locationType(
              location,
              stop.kind === 'staging' ? 'staging' : 'warehouse',
            )

        const badge = stop.kind === 'freight-stop'
          ? `${stop.role === 'pickup' ? 'P' : 'D'}${stop.loadOrdinal}`
          : ''

        return {
          type: 'Feature',
          id: stop.id,
          properties: {
            id: stop.id,
            kind: stop.kind,
            role: stop.role ?? '',
            poiType,
            badge,
            label: stop.locationLabel,
            priority,
            selected,
            completed,
            planningPreview,
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
        'circle-color': [
          'case',
          ['boolean', ['get', 'planningPreview'], false],
          '#1a131d',
          '#101a22',
        ],
        'circle-stroke-color': [
          'case',
          ['boolean', ['get', 'planningPreview'], false],
          '#c1a0cf',
          identity.color,
        ],
        'circle-stroke-width': [
          'case',
          ['boolean', ['get', 'selected'], false],
          3,
          2,
        ],
        'circle-opacity': [
          'case',
          ['boolean', ['get', 'completed'], false],
          0.42,
          0.98,
        ],
        'circle-stroke-opacity': [
          'case',
          ['boolean', ['get', 'completed'], false],
          0.58,
          1,
        ],
      },
    })

    map.addLayer({
      id: COMMITTED_STOP_BADGE_LAYER,
      type: 'symbol',
      source: COMMITTED_STOP_SOURCE,
      filter: ['==', ['get', 'kind'], 'freight-stop'],
      layout: {
        'text-field': ['get', 'badge'],
        'text-size': 10,
        'text-font': ['Open Sans Bold'],
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': identity.color,
        'text-opacity': [
          'case',
          ['boolean', ['get', 'completed'], false],
          0.5,
          1,
        ],
        'text-halo-color': '#071019',
        'text-halo-width': 1,
      },
    })

    map.addLayer({
      id: COMMITTED_STOP_ICON_LAYER,
      type: 'symbol',
      source: COMMITTED_STOP_SOURCE,
      filter: ['!=', ['get', 'kind'], 'freight-stop'],
      layout: {
        'icon-image': poiIconImageExpression(),
        'icon-size': [
          'case',
          ['boolean', ['get', 'selected'], false],
          1.08,
          0.96,
        ],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
      paint: {
        'icon-opacity': [
          'case',
          ['boolean', ['get', 'completed'], false],
          0.48,
          1,
        ],
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
      COMMITTED_STOP_ICON_LAYER,
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
        COMMITTED_STOP_ICON_LAYER,
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
    completedEventIds,
    nextStopId,
    displayDriverRoutes,
    selectedDriver,
    selection,
    locations,
    pendingPlanningPlace,
  ])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return undefined

    const clearPlanningPois = () => {
      if (map.getLayer(PLANNING_POI_LABEL_LAYER)) map.removeLayer(PLANNING_POI_LABEL_LAYER)
      if (map.getLayer(PLANNING_POI_ICON_LAYER)) map.removeLayer(PLANNING_POI_ICON_LAYER)
      if (map.getLayer(PLANNING_POI_CIRCLE_LAYER)) map.removeLayer(PLANNING_POI_CIRCLE_LAYER)
      if (map.getSource(PLANNING_POI_SOURCE)) map.removeSource(PLANNING_POI_SOURCE)
    }

    clearPlanningPois()

    if (
      workspaceOpen
      || !selectedDriver
      || !selectedStop
      || !['lunch', 'staging'].includes(selectedStop.kind)
    ) {
      return clearPlanningPois
    }

    const pendingLocationId = (
      pendingPlanningPlace?.driverId === selectedDriver.id
      && pendingPlanningPlace?.kind === selectedStop.kind
    )
      ? pendingPlanningPlace.locationId
      : null

    const features = planningPlaceOptions
      .filter((option) => (
        Array.isArray(option.coordinates)
        && option.id !== selectedStop.locationId
        && option.id !== pendingLocationId
      ))
      .map((option) => ({
        type: 'Feature',
        id: option.id,
        properties: {
          id: option.id,
          locationId: option.id,
          kind: selectedStop.kind,
          label: option.label,
          poiType: option.poiType ?? 'warehouse',
        },
        geometry: {
          type: 'Point',
          coordinates: option.coordinates,
        },
      }))

    if (!features.length) return clearPlanningPois

    map.addSource(PLANNING_POI_SOURCE, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    })

    map.addLayer({
      id: PLANNING_POI_CIRCLE_LAYER,
      type: 'circle',
      source: PLANNING_POI_SOURCE,
      paint: {
        'circle-radius': 15,
        'circle-color': '#17131b',
        'circle-stroke-color': '#b79bc5',
        'circle-stroke-width': 2,
        'circle-opacity': 0.9,
        'circle-stroke-opacity': 0.92,
      },
    })

    map.addLayer({
      id: PLANNING_POI_ICON_LAYER,
      type: 'symbol',
      source: PLANNING_POI_SOURCE,
      layout: {
        'icon-image': poiIconImageExpression(),
        'icon-size': 0.92,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
      paint: {
        'icon-opacity': 0.96,
      },
    })

    map.addLayer({
      id: PLANNING_POI_LABEL_LAYER,
      type: 'symbol',
      source: PLANNING_POI_SOURCE,
      filter: ['==', ['get', 'id'], ''],
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
        'text-color': '#e5d8ea',
        'text-halo-color': '#100c12',
        'text-halo-width': 2,
      },
    })

    const previewPlanningPlace = (event) => {
      const properties = event.features?.[0]?.properties
      if (!properties?.locationId) return
      onPreviewPlanningPlaceRef.current?.({
        driverId: selectedDriver.id,
        kind: properties.kind,
        locationId: properties.locationId,
      })
    }

    const showPlanningLabel = (event) => {
      const locationId = event.features?.[0]?.properties?.locationId
      map.getCanvas().style.cursor = 'pointer'
      if (!locationId || !map.getLayer(PLANNING_POI_LABEL_LAYER)) return
      map.setFilter(PLANNING_POI_LABEL_LAYER, ['==', ['get', 'id'], locationId])
    }

    const hidePlanningLabel = () => {
      map.getCanvas().style.cursor = ''
      if (!map.getLayer(PLANNING_POI_LABEL_LAYER)) return
      map.setFilter(PLANNING_POI_LABEL_LAYER, ['==', ['get', 'id'], ''])
    }

    for (const layerId of [
      PLANNING_POI_CIRCLE_LAYER,
      PLANNING_POI_ICON_LAYER,
      PLANNING_POI_LABEL_LAYER,
    ]) {
      map.on('click', layerId, previewPlanningPlace)
      map.on('mouseenter', layerId, showPlanningLabel)
      map.on('mouseleave', layerId, hidePlanningLabel)
    }

    return () => {
      for (const layerId of [
        PLANNING_POI_CIRCLE_LAYER,
        PLANNING_POI_ICON_LAYER,
        PLANNING_POI_LABEL_LAYER,
      ]) {
        map.off('click', layerId, previewPlanningPlace)
        map.off('mouseenter', layerId, showPlanningLabel)
        map.off('mouseleave', layerId, hidePlanningLabel)
      }
      hidePlanningLabel()
      clearPlanningPois()
    }
  }, [
    mapReady,
    workspaceOpen,
    selectedDriver,
    selectedStop,
    planningPlaceOptions,
    pendingPlanningPlace,
  ])

  useEffect(() => {
    if (!driverDays.length) return undefined

    let active = true

    const publishFleetRoute = (day, key, segments) => {
      const result = {
        key,
        driverId: day.driverId,
        segments,
      }
      fleetRouteResultsRef.current = {
        ...fleetRouteResultsRef.current,
        [day.driverId]: result,
      }
      setFleetRouteResults((current) => ({
        ...current,
        [day.driverId]: result,
      }))
    }

    const hydrateFleetRoutes = async () => {
      for (const day of driverDays) {
        if (!active) return

        const key = driverDayRouteKey(day)
        if (!key) continue

        const existing = fleetRouteResultsRef.current[day.driverId]
        if (
          existing?.key === key
          && committedRouteComplete(existing.segments)
        ) {
          continue
        }

        const segmentSpecs = buildDriverRouteSegments(day, locations)
        if (!segmentSpecs.length) {
          publishFleetRoute(day, key, [])
          continue
        }

        let retryAttempt = 0

        while (active) {
          const segments = await hydrateCommittedRouteSegments(segmentSpecs, {
            routeSegment: calculateRoadRoute,
            isActive: () => active,
          })

          if (!active) return

          if (committedRouteComplete(segments)) {
            publishFleetRoute(day, key, segments)
            break
          }

          retryAttempt += 1
          const retryDelayMs = Math.min(12000, 1800 + (retryAttempt * 1200))
          await waitForRouteRetry(retryDelayMs, () => active)
        }
      }
    }

    hydrateFleetRoutes()

    return () => {
      active = false
    }
  }, [driverDays, locations])

  useEffect(() => {
    if (!driverRouteKey || !driverDay || !selectedDriver) return undefined

    const committedDay = driverDays.find((day) => day.driverId === selectedDriver.id)
    const committedRouteKey = driverDayRouteKey(committedDay)
    if (committedRouteKey === driverRouteKey) return undefined

    const segmentSpecs = buildDriverRouteSegments(driverDay, locations)
    let active = true

    const hydrateCompleteRoute = async () => {
      let retryAttempt = 0

      while (active) {
        const segments = await hydrateCommittedRouteSegments(segmentSpecs, {
          routeSegment: calculateRoadRoute,
          isActive: () => active,
        })

        if (!active) return

        if (committedRouteComplete(segments)) {
          setDriverRouteResult({
            key: driverRouteKey,
            driverId: selectedDriver.id,
            segments,
          })
          return
        }

        retryAttempt += 1
        const retryDelayMs = Math.min(12000, 1800 + (retryAttempt * 1200))
        await waitForRouteRetry(retryDelayMs, () => active)
      }
    }

    hydrateCompleteRoute()

    return () => {
      active = false
    }
  }, [driverDay, driverDays, driverRouteKey, locations, selectedDriver])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return undefined

    const clearFleetActiveRoute = () => {
      if (map.getLayer(FLEET_ACTIVE_ROUTE_LAYER)) map.removeLayer(FLEET_ACTIVE_ROUTE_LAYER)
      if (map.getLayer(FLEET_ACTIVE_ROUTE_CASING_LAYER)) map.removeLayer(FLEET_ACTIVE_ROUTE_CASING_LAYER)
      if (map.getSource(FLEET_ACTIVE_ROUTE_SOURCE)) map.removeSource(FLEET_ACTIVE_ROUTE_SOURCE)
    }

    clearFleetActiveRoute()

    map.addSource(FLEET_ACTIVE_ROUTE_SOURCE, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    })

    const beforeId = map.getLayer(COMMITTED_STOP_CIRCLE_LAYER)
      ? COMMITTED_STOP_CIRCLE_LAYER
      : undefined

    map.addLayer({
      id: FLEET_ACTIVE_ROUTE_CASING_LAYER,
      type: 'line',
      source: FLEET_ACTIVE_ROUTE_SOURCE,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#0a1118',
        'line-width': 5,
        'line-opacity': 0.5,
      },
    }, beforeId)

    map.addLayer({
      id: FLEET_ACTIVE_ROUTE_LAYER,
      type: 'line',
      source: FLEET_ACTIVE_ROUTE_SOURCE,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2.25,
        'line-opacity': 0.42,
      },
    }, beforeId)

    return clearFleetActiveRoute
  }, [mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return

    const source = map.getSource(FLEET_ACTIVE_ROUTE_SOURCE)
    if (!source?.setData) return

    source.setData(
      workspaceOpen || freightRoutePreview
        ? { type: 'FeatureCollection', features: [] }
        : fleetActiveRouteData,
    )
  }, [
    fleetActiveRouteData,
    freightRoutePreview,
    mapReady,
    workspaceOpen,
  ])

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

    if (!selectedDriver || !displayDriverRoutes.length) return clearDriverRoute

    const identity = getDriverIdentity(selectedDriver.id)
    const insertion = freightRoutePreview?.evaluation?.insertion ?? null
    const segments = markInsertionAffectedSegment(displayDriverRoutes, insertion)
    const routeData = committedRouteGeoJson(segments)

    if (!routeData.features.length) return clearDriverRoute

    map.addSource(DRIVER_ROUTE_SOURCE, {
      type: 'geojson',
      data: routeData,
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
          ['==', ['get', 'executionPhase'], 'completed'],
          0.14,
          ['==', ['get', 'executionPhase'], 'active'],
          0.96,
          ['==', ['get', 'executionPhase'], 'future'],
          0.34,
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
          ['==', ['get', 'executionPhase'], 'completed'],
          0.2,
          ['==', ['get', 'executionPhase'], 'active'],
          1,
          ['==', ['get', 'executionPhase'], 'future'],
          0.46,
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
          ['==', ['get', 'executionPhase'], 'completed'],
          0.14,
          ['==', ['get', 'executionPhase'], 'active'],
          0.96,
          ['==', ['get', 'executionPhase'], 'future'],
          0.34,
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
          ['==', ['get', 'executionPhase'], 'completed'],
          0.2,
          ['==', ['get', 'executionPhase'], 'active'],
          1,
          ['==', ['get', 'executionPhase'], 'future'],
          0.46,
          freightRoutePreview ? 0.62 : 0.88,
        ],
        'line-dasharray': PICKUP_ROUTE_DASH,
      },
    }, beforeId)



    return clearDriverRoute
  }, [displayDriverRoutes, freightRoutePreview, mapReady, selectedDriver])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !selectedDriver || !displayDriverRoutes.length) return

    const source = map.getSource(DRIVER_ROUTE_SOURCE)
    if (!source?.setData) return

    const insertion = freightRoutePreview?.evaluation?.insertion ?? null
    const segments = markInsertionAffectedSegment(displayDriverRoutes, insertion)
    source.setData(committedRouteGeoJson(segments, liveState))
  }, [displayDriverRoutes, freightRoutePreview, liveState, mapReady, selectedDriver])

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

    const displayPreview = stitchFreightPreviewRoutes(freightRoutePreview)

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
      route: displayPreview.deadheadRoute,
      color: PREVIEW_DEADHEAD,
      width: 3,
      dashed: true,
    })
    addRoute({
      sourceId: LOADED_SOURCE,
      casingLayerId: LOADED_CASING_LAYER,
      layerId: LOADED_LAYER,
      route: displayPreview.loadedRoute,
      color: PREVIEW_ROUTE,
      width: 6,
    })
    addRoute({
      sourceId: REJOIN_SOURCE,
      casingLayerId: REJOIN_CASING_LAYER,
      layerId: REJOIN_LAYER,
      route: displayPreview.rejoinRoute,
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
        new Marker({ element, anchor: 'center' })
          .setLngLat(accessCoordinates ?? location.coordinates)
          .addTo(map),
      )
    }

    const pickupAccess = (
      displayPreview.deadheadRoute?.renderDestinationAccessCoordinates
      ?? displayPreview.deadheadRoute?.destinationAccessCoordinates
      ?? displayPreview.loadedRoute?.renderOriginAccessCoordinates
      ?? displayPreview.loadedRoute?.originAccessCoordinates
      ?? null
    )
    const deliveryAccess = (
      displayPreview.loadedRoute?.renderDestinationAccessCoordinates
      ?? displayPreview.loadedRoute?.destinationAccessCoordinates
      ?? displayPreview.rejoinRoute?.renderOriginAccessCoordinates
      ?? displayPreview.rejoinRoute?.originAccessCoordinates
      ?? null
    )

    addPreviewMarker(freightRoutePreview.pickup, 'pickup', pickupAccess)
    addPreviewMarker(freightRoutePreview.delivery, 'delivery', deliveryAccess)

    const points = []
    for (const route of [
      displayPreview.deadheadRoute,
      displayPreview.loadedRoute,
      displayPreview.rejoinRoute,
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

    const stopCoordinates = Array.isArray(selectedStop?.coordinates)
      ? selectedStop.coordinates
      : null
    const driverCoordinates = Array.isArray(selectedDriverLiveCoordinates)
      ? selectedDriverLiveCoordinates
      : Array.isArray(selectedDriver?.coordinates)
        ? selectedDriver.coordinates
        : null
    const planningSignature = planningPlaceOptions
      .map((option) => (
        `${option.id}@${Array.isArray(option.coordinates) ? option.coordinates.join(',') : ''}`
      ))
      .join('|')

    let frameKey = null
    if (
      selectedStop
      && ['lunch', 'staging'].includes(selectedStop.kind)
      && planningPlaceOptions.length
    ) {
      frameKey = `places:${selectedStop.id}:${planningSignature}`
    } else if (selectedStop && stopCoordinates) {
      frameKey = `stop:${selectedStop.id}@${stopCoordinates.join(',')}`
    } else if (selectedDriver && driverCoordinates) {
      frameKey = `driver:${selectedDriver.id}`
    }

    if (!frameKey) {
      cameraFrameKeyRef.current = null
      return
    }
    if (cameraFrameKeyRef.current === frameKey) return
    cameraFrameKeyRef.current = frameKey

    if (
      selectedStop
      && ['lunch', 'staging'].includes(selectedStop.kind)
      && planningPlaceOptions.length
    ) {
      const points = planningPlaceOptions
        .map((option) => option.coordinates)
        .filter((coordinates) => Array.isArray(coordinates))

      if (stopCoordinates) points.push(stopCoordinates)

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

    if (stopCoordinates) {
      map.easeTo({
        center: stopCoordinates,
        zoom: Math.max(map.getZoom(), 10.7),
        bearing: 0,
        pitch: 0,
        duration: 450,
      })
      return
    }

    if (driverCoordinates) {
      map.easeTo({
        center: driverCoordinates,
        zoom: Math.max(map.getZoom(), 10),
        bearing: 0,
        pitch: 0,
        duration: 500,
      })
    }
  }, [
    freightRoutePreview,
    planningPlaceOptions,
    selectedDriver,
    selectedDriverLiveCoordinates,
    selectedStop,
    workspaceOpen,
  ])

  return (
    <div className="map-stage">
      <div ref={mapContainerRef} className="map-container" />
      <div className="map-vignette" aria-hidden="true" />
      <div className="map-label">
        <span>LIVE MAP</span>
        <strong>New York Metro</strong>
      </div>

      {!workspaceOpen && (
        <div className="fleet-glance" aria-label="Fleet status">
          {drivers.map((driver) => {
            const identity = getDriverIdentity(driver.id)
            const live = liveDriverStates[driver.id] ?? null
            const selected = selectedDriver?.id === driver.id

            return (
              <button
                type="button"
                key={driver.id}
                className={selected ? 'selected' : ''}
                style={{ '--driver-color': identity.color }}
                title={driver.name}
                aria-pressed={selected}
                onClick={() => onSelectSubjectRef.current?.(SELECTION_TYPES.DRIVER, driver.id)}
              >
                <i />
                <b>{driver.initials}</b>
                <span>{fleetStatusLabel(driver, live)}</span>
              </button>
            )
          })}
        </div>
      )}

    </div>
  )
}
