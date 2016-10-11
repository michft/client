// @flow
import * as I from 'immutable'
import * as Constants from '../constants/route-tree'
import type {RouteTreeState} from '../constants/route-tree'
import {RouteNode, getPath, routeSetProps, routeSetState} from '../route-tree'

import routeTree from '../routes'

// TODO: use setRoutes action instead of static assignment
const initialState = routeTree

export default function routeTreeReducer (state: RouteTreeState = initialState, action: any): RouteTreeState {
  switch (action.type) {
    // TODO: set routes (for init and HMR)
    //case Constants.setRoutes:

    case Constants.switchTo:
      return routeSetProps(action.payload.path, state)

    case Constants.navigateTo:
      return routeSetProps(action.payload.path.concat({selected: true}), state)

    case Constants.navigateAppend: {
      const path = getPath(state)
      return routeSetProps(path.concat(...action.payload.path), state)
    }

    case Constants.navigateUp: {
      // fix for non branch? missing component?
      const path = getPath(state)
      return routeSetProps(path.slice(0, -1).concat({selected: true}), state)
      //TODO: clear out props and state?
    }

    case Constants.setRouteState:
      return routeSetState(action.payload.path, state, action.payload.partialState)

    //TODO: clear the state/props from a subtree
    //case Constants.clear:

    default:
      return state
  }
}
