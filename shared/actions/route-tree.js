// @flow
import * as I from 'immutable'
import * as Constants from '../constants/route-tree'
import {RouteNode} from '../route-tree'
import type {Action} from '../constants/types/flux'

// Set the route tree
export function setRouteDef (routeDef): Action {
  return {
    type: Constants.setRouteDef,
    payload: {routeDef},
  }
}

// Switch to a new parent path, keeping the subpath. E.g.:
// switchTo('settings') will navigate to settings tab and whatever subpath was
// previously selected
export function switchTo (...path): Action {
  return {
    type: Constants.switchTo,
    payload: {path},
  }
}

//TODO: check type of path objects to ensure selected key

// Navigate to a new absolute path.
// You can specify paths as either strings:
//   navigateTo('foo', 'bar')
// Or objects with route props:
//   navigateTo({selected: 'foo', prop1: 'hello'}, {selected: 'bar', prop2: 'world'})
export function navigateTo (...path): Action {
  return {
    type: Constants.navigateTo,
    payload: {path},
  }
}

// Navigate to a path relative to the current path.
export function navigateAppend (...path): Action {
  return {
    type: Constants.navigateAppend,
    payload: {path},
  }
}

// Navigate one step up from the current path.
export function navigateUp (): Action {
  return {
    type: Constants.navigateUp,
    payload: null,
  }
}

// Update the state object of a route at a specified path.
export function setRouteState (path: Array<string>, partialState: any): Action {
  return {
    type: Constants.setRouteState,
    payload: {path, partialState},
  }
}

// Reset the props and state for a subtree.
export function clear (path: Array<string>): Action {
  return {
    type: Constants.clear,
    payload: {path},
  }
}
