// @flow
import * as I from 'immutable'
import * as Constants from '../constants/route-tree'
import type {RouteTreeState} from '../constants/route-tree'
import {
  InvalidRouteError,
  getPath,
  routeSetProps,
  routeNavigate,
  routeSetState,
  routeClear
} from '../route-tree'

const StateRecord = I.Record({
  routeDef: null,
  routeState: null,
})

const initialState = StateRecord()

function routeDefReducer(routeDef, action) {
  switch (action.type) {
    case Constants.setRouteDef:
      return action.payload.routeDef

    default:
      return routeDef
  }
}

function routeStateReducer(routeDef, routeState, action) {
  switch (action.type) {
    case Constants.setRouteDef:
      let newRouteState
      try {
        newRouteState = routeNavigate(action.payload.routeDef, getPath(routeState), routeState)
      } catch (err) {
        if (err instanceof InvalidRouteError) {
          console.warn('New route tree mismatches current state. Resetting route state.')
          newRouteState = routeNavigate(action.payload.routeDef, [], null)
        } else {
          throw err
        }
      }
      return newRouteState

    case Constants.switchTo:
      return routeSetProps(routeDef, action.payload.path, routeState)

    case Constants.navigateTo:
      return routeNavigate(routeDef, action.payload.path, routeState)

    case Constants.navigateAppend: {
      const path = getPath(routeState)
      return routeNavigate(routeDef, path.concat(...action.payload.path), routeState)
    }

    case Constants.navigateUp: {
      const path = getPath(routeState)
      const newRouteState = routeNavigate(routeDef, path.slice(0, -1), routeState)
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
    routeDef: routeDefReducer(routeDef, action),
    routeState: routeStateReducer(routeDef, routeState, action),
  })
}
