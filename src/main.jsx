import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'maplibre-gl/dist/maplibre-gl.css'
import './styles/global.css'
import App from './app/App.jsx'
import RuntimeErrorBoundary from './app/RuntimeErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RuntimeErrorBoundary>
      <App />
    </RuntimeErrorBoundary>
  </StrictMode>,
)
