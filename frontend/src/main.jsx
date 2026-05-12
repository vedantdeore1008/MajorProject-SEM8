import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store from './redux/store.js'

window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root && !root.hasChildNodes()) {
    root.innerHTML = `<div style="padding:40px;font-family:sans-serif;text-align:center"><h2 style="color:#ef4444">App failed to load</h2><p style="color:#64748b">${event.message || 'Unknown error'}</p><button onclick="window.location.reload()" style="margin-top:16px;padding:10px 24px;background:#4361ee;color:#fff;border:none;border-radius:8px;cursor:pointer">Reload</button></div>`;
  }
});

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
)
