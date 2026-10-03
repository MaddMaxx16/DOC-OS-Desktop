const DRIVER_IDENTITIES = Object.freeze({
  'marcus-reed': Object.freeze({ color: '#5DA9E9', colorName: 'blue' }),
  'taylor-brooks': Object.freeze({ color: '#D9A441', colorName: 'amber' }),
  'derrick-cole': Object.freeze({ color: '#32B7A2', colorName: 'teal' }),
})

const FALLBACK_PALETTE = Object.freeze([
  Object.freeze({ color: '#9879D5', colorName: 'violet' }),
  Object.freeze({ color: '#D66D73', colorName: 'red' }),
  Object.freeze({ color: '#65B36B', colorName: 'green' }),
  Object.freeze({ color: '#D17DB2', colorName: 'rose' }),
  Object.freeze({ color: '#6F8FE0', colorName: 'indigo' }),
])

function hashDriverId(driverId) {
  let hash = 0
  for (const character of String(driverId)) {
    hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0
  }
  return Math.abs(hash)
}

export function getDriverIdentity(driverId) {
  const known = DRIVER_IDENTITIES[driverId]
  if (known) return known

  const fallback = FALLBACK_PALETTE[hashDriverId(driverId) % FALLBACK_PALETTE.length]
  return Object.freeze({ ...fallback })
}
