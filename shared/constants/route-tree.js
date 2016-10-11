// @flow
import type {RouteNodeRecord} from '../route-tree'
export type RouteTreeState = ?RouteNodeRecord<*,*>
export const setRoutes = 'routeTree:setRoutes'
export const switchTo = 'routeTree:switchTo'
export const navigateTo = 'routeTree:navigateTo'
export const navigateAppend = 'routeTree:navigateAppend'
export const navigateUp = 'routeTree:navigateUp'
export const setRouteState = 'routeTree:setRouteState'
export const clear = 'routeTree:clear'
