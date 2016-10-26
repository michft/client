// @flow
import * as I from 'immutable'
import * as Constants from '../constants/route-tree'
import type {RouteTreeState} from '../constants/route-tree'
import {RouteStateNode, getPath, routeSetProps, routeSetState, routeClear} from '../route-tree'

import routeDef from '../routes'

const StateRecord = I.Record({
  routeDef: null,
  routeState: null,
})

// TODO: use setRoutes action instead of static assignment
const initialState = StateRecord({
  routeDef,
  routeState: routeSetProps(routeDef, ['tabs:devicesTab']),
})

function routeStateReducer(routeDef, routeState, action) {
  switch (action.type) {
    case Constants.switchTo:
      return routeSetProps(routeDef, action.payload.path, routeState)

    case Constants.navigateTo:
      return routeSetProps(routeDef, action.payload.path.concat({selected: null}), routeState)

    case Constants.navigateAppend: {
      const path = getPath(routeState)
      return routeSetProps(routeDef, path.concat(...action.payload.path), routeState)
    }

    case Constants.navigateUp: {
      // fix for non branch? missing component?
      const path = getPath(routeState)
      const newRouteState = routeSetProps(routeDef, path.slice(0, -1).concat({selected: null}), routeState)
      return routeClear(path, newRouteState)
    }

    case Constants.setRouteState:
      return routeSetState(routeDef, action.payload.path, routeState, action.payload.partialState)

    case Constants.resetRoute:
      return routeClear(action.payload.path, routeState)

    default:
      return routeState
  }
}

export default function routeTreeReducer (state: RouteTreeState = initialState, action: any): RouteTreeState {
  let {routeDef, routeState} = state
  return state.merge({
    routeDef: routeDef,
    routeState: routeStateReducer(routeDef, routeState, action),
  })
}
