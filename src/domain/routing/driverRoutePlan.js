function coordinatesForEvent(event, locations = {}) {
  if (Array.isArray(event?.coordinates)) return event.coordinates
  return locations[event?.locationId]?.coordinates ?? null
}

export function buildDriverRouteSegments(driverDay, locations = {}) {
  const timeline = driverDay?.timeline ?? []
  const segments = []

  for (let index = 0; index < timeline.length - 1; index += 1) {
    const from = timeline[index]
    const to = timeline[index + 1]
    const fromCoordinates = coordinatesForEvent(from, locations)
    const toCoordinates = coordinatesForEvent(to, locations)

    if (!fromCoordinates || !toCoordinates) continue

    segments.push({
      id: `${from.id}->${to.id}`,
      driverId: driverDay.driverId,
      fromId: from.id,
      toId: to.id,
      fromKind: from.kind,
      toKind: to.kind,
      fromCoordinates,
      toCoordinates,
    })
  }

  return segments
}

export function markInsertionAffectedSegment(segments = [], insertion = null) {
  return segments.map((segment) => ({
    ...segment,
    affected: Boolean(
      insertion
      && segment.fromId === insertion.afterId
      && segment.toId === insertion.beforeId
    ),
  }))
}
