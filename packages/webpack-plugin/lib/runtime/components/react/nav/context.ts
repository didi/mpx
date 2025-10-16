import { createContext } from 'react'
import { PortalContextValue, RouteContextValue } from '../context'

export const NavRouteContext = createContext<RouteContextValue | null>(null)
export const NavPortalContext = createContext<PortalContextValue>(null as any)
