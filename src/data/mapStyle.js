export const mapStyle = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#071019' },
    },
    {
      id: 'osm-dark',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
      paint: {
        'raster-saturation': -0.95,
        'raster-contrast': 0.08,
        'raster-brightness-min': 0.05,
        'raster-brightness-max': 0.30,
      },
    },
  ],
}
