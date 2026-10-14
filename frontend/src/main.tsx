import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

async function bootstrap() {
  // En modo demostración (sin backend) activamos la API simulada antes de
  // montar la app, para que la comprobación inicial de sesión ya use los datos.
  if (__DEMO_MODE__) {
    const { installDemoApi } = await import('./services/demoApi')
    installDemoApi()
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

void bootstrap()
