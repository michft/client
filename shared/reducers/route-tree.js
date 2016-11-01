// @flow
import * as I from 'immutable'
import * as Constants from '../constants/route-tree'
import {
  InvalidRouteError,
  getPath,
  routeSetProps,
  routeNavigate,
  routeSetState,
  routeClear,
  checkRouteState,
} from '../route-tree'

export const State = I.Record({
  routeDef: null,
  routeState: null,
})

const initialState = State()

function routeDefReducer (routeDef, action) {
  switch (action.type) {
    case Constants.setRouteDef:
      return action.payload.routeDef

    default:
      return routeDef
  }
}

function routeStateReducer (routeDef, routeState, action) {
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
      const newRouteState = routeClear(path, routeState)
      return routeNavigate(routeDef, path.skipLast(1), newRouteState)
    }

    case Constants.setRouteState:
      return routeSetState(routeDef, action.payload.path, routeState, action.payload.partialState)

    case Constants.resetRoute:
      return routeClear(action.payload.path, routeState)

    default:
      return routeState
  }
}

export default function routeTreeReducer (state: State = initialState, action: any): State {
  let {routeDef, routeState} = state

  const newRouteDef = routeDefReducer(routeDef, action)
  const newRouteState = routeStateReducer(routeDef, routeState, action)

  const routeError = checkRouteState(newRouteDef, newRouteState)
  if (routeError) {
    console.error(`Attempt to perform ${action.type} would result in invalid routeTree state: "${routeError}". Aborting.`)
    return state
  }

  return state.merge({
    routeDef: newRouteDef,
    routeState: newRouteState,
  })
}
