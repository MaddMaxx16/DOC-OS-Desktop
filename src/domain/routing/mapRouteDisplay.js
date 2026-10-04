const EARTH_RADIUS_MILES = 3958.8
const CLOSE_ANCHOR_MILES = 1.35

function toRadians(value) {
  return Number(value) * (Math.PI / 180)
}

export function distanceMilesBetween(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return Number.POSITIVE_INFINITY

  const [lng1, lat1] = left
  const [lng2, lat2] = right
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a = (
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1))
      * Math.cos(toRadians(lat2))
      * Math.sin(dLng / 2) ** 2
  )

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a))
}

export function nextOperationalEventId(driverDay) {
  return driverDay?.timeline?.find((event) => event.kind !== 'shift-start')?.id ?? null
}

export function buildRouteAnchorDisplayPlan(
  anchors = [],
  {
    selectedEventId = null,
    nextEventId = null,
    closeMiles = CLOSE_ANCHOR_MILES,
  } = {},
) {
  const placements = ['label-right', 'label-left', 'label-above', 'label-below']
  const neighbors = new Map(anchors.map((anchor) => [anchor.id, []]))

  for (let leftIndex = 0; leftIndex < anchors.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < anchors.length; rightIndex += 1) {
      const left = anchors[leftIndex]
      const right = anchors[rightIndex]
      if (distanceMilesBetween(left.coordinates, right.coordinates) > closeMiles) continue
      neighbors.get(left.id)?.push(right.id)
      neighbors.get(right.id)?.push(left.id)
    }
  }

  let placementIndex = 0

  return anchors.map((anchor) => {
    const selected = Boolean(
      selectedEventId
      && anchor.eventIds?.includes(selectedEventId),
    )
    const next = Boolean(
      !selected
      && nextEventId
      && anchor.eventIds?.includes(nextEventId),
    )
    const crowded = (neighbors.get(anchor.id)?.length ?? 0) > 0
    const labelPlacement = crowded
      ? placements[placementIndex++ % placements.length]
      : 'label-center'

    return {
      ...anchor,
      selected,
      next,
      crowded,
      labelPriority: selected ? 'selected' : next ? 'next' : 'compact',
      labelPlacement,
    }
  })
}
