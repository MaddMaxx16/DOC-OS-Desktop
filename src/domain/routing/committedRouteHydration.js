const RETRY_WAVES = 2
const BETWEEN_SEGMENTS_MS = 140
const BETWEEN_WAVES_MS = 1200

function wait(milliseconds) {
  if (!milliseconds) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function hydrateCommittedRouteSegments(
  segmentSpecs = [],
  {
    routeSegment,
    isActive = () => true,
    waitFn = wait,
  } = {},
) {
  if (typeof routeSegment !== 'function') {
    throw new Error('routeSegment is required')
  }

  const segments = segmentSpecs.map((segment) => ({
    ...segment,
    route: null,
  }))

  for (let wave = 0; wave < RETRY_WAVES; wave += 1) {
    let unresolved = 0

    for (let index = 0; index < segments.length; index += 1) {
      if (!isActive()) return segments

      if (segments[index].route?.source === 'road') continue

      const segment = segments[index]
      const route = await routeSegment(
        segment.fromCoordinates,
        segment.toCoordinates,
      )

      if (!isActive()) return segments

      segments[index] = {
        ...segment,
        route,
      }

      if (route?.source !== 'road') unresolved += 1

      if (index < segments.length - 1) {
        await waitFn(BETWEEN_SEGMENTS_MS)
      }
    }

    if (!unresolved) break

    if (wave < RETRY_WAVES - 1) {
      await waitFn(BETWEEN_WAVES_MS)
    }
  }

  return segments
}
