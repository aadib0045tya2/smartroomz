import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import AdminApp from './admin/AdminApp.jsx'
import CustomerAccount from './account/CustomerAccount.jsx'
import './styles/index.css'

export const Root = window.location.pathname.startsWith('/admin') ? AdminApp : window.location.pathname.startsWith('/account') ? CustomerAccount : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
