export const SHELL_CONFIG = Object.freeze({
  referenceWidth: 1920,
  referenceHeight: 1080,
  commandRailWidth: 76,
  browserWidth: 385,
  inspectorWidth: 430,
})

export const WORKSTATION_SECTIONS = Object.freeze([
  { id: 'drivers', label: 'Fleet', shortLabel: 'FL', phase: 'LIVE' },
  { id: 'freightlink', label: 'FreightLink', shortLabel: 'FL', phase: 'LIVE' },
  { id: 'email', label: 'Email', shortLabel: 'EM', phase: 'V2.9' },
  { id: 'documents', label: 'Documents', shortLabel: 'DOC', phase: 'V2.8' },
  { id: 'messages', label: 'Messages', shortLabel: 'MSG', phase: 'V2.9' },
  { id: 'banking', label: 'Banking', shortLabel: '$', phase: 'V2.10' },
  { id: 'carriersource', label: 'CarrierSource', shortLabel: 'CS', phase: 'Later' },
  { id: 'shop', label: 'Shop', shortLabel: 'SHOP', phase: 'V2.10' },
])
