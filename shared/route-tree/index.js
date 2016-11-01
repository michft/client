// @flow
import * as I from 'immutable'
import {Component} from 'react'

import type {ConnectedComponent} from 'react-redux'
import type {ConnectedComponent as TypedConnectedComponent} from '../util/typed-connect'

type LeafTagsParams = {
  modal: boolean,
}

export const LeafTags: (spec?: LeafTagsParams) => LeafTagsParams & I.Record<LeafTagsParams> = I.Record({
  modal: false,
})

const _RouteDefNode = I.Record({
  defaultSelected: null,
  component: null,
  containerComponent: null,
  tags: LeafTags(),
  initialState: I.Map(),
  children: I.Map(),
})

type RouteDefParams<P> = {
  defaultSelected?: string,
  tags?: LeafTags,
  initialState?: {},
  children: {},
} & (
  { component?: Component<*, P, *> | Class<ConnectedComponent<P, *, *, *>> | Class<TypedConnectedComponent<P>> }
  | { containerComponent: Component<*, P, *> }
)

export class RouteDefNode extends _RouteDefNode {
  constructor ({defaultSelected, component, containerComponent, tags, initialState, children}: RouteDefParams<*>) {
    super({
      defaultSelected: defaultSelected || null,
      component,
      containerComponent,
      tags: LeafTags(tags),
      initialState: I.Map(initialState),
      props: I.Map(),
      state: I.Map(),
      children: I.Seq(children)
        .map(params => params instanceof RouteDefNode || typeof params === 'function' ? params : new RouteDefNode(params))
        .toMap(),
    })
  }

  getChild (name: string): ?RouteDefNode {
    const childDef = this.children.get(name)
    if (!childDef) {
      return
    }
    if (typeof childDef === 'function') {
      return childDef()
    }
    return childDef
  }
}

type RouteStateParams = {
  selected: string | null,
  props?: I.Map<string, any>,
  state?: I.Map<string, any>,
}

const _RouteStateNode = I.Record({
  selected: null,
  props: I.Map(),
  state: I.Map(),
  children: I.Map(),
})

export class RouteStateNode extends _RouteStateNode {
  constructor ({selected, props, state}: RouteStateParams) {
    super({selected, props, state})
  }

  getChild (name: string): RouteStateNode {
    return this.children.get(name)
  }

  updateChild (name: string, op: (node: RouteStateNode) => ?RouteStateNode): RouteStateNode {
    return this.updateIn(['children', name], op)
  }
}

export class InvalidRouteError extends Error {}

export type Path = Iterable<string>
type PathLike = Iterable<string | {selected: string | null}>
export type PropsPath = I.IndexedIterable<{selected: string | null, props?: {}}>

function _routeSet (routeDef: RouteDefNode, path: PropsPath, routeState: ?RouteStateNode): RouteStateNode {
  const pathHead = path && path.first()

  let newRouteState
  if (!routeState) {
    newRouteState = new RouteStateNode({selected: routeDef.defaultSelected})
  } else {
    newRouteState = routeState
    if (pathHead) {
      newRouteState = routeState.set('selected', pathHead.selected)
    }
  }

  const selected = newRouteState.selected
  if (selected !== null) {
    const childDef = routeDef.getChild(selected)
    if (!childDef) {
      throw new InvalidRouteError(`Invalid route selected: ${selected}`)
    }

    newRouteState = newRouteState.updateChild(selected, childState => {
      let newChild = _routeSet(childDef, path.skip(1), childState)
      if (pathHead && pathHead.hasOwnProperty('props')) {
        newChild = newChild.set('props', I.fromJS(pathHead.props))
      }
      return newChild
    })
  }

  return newRouteState
}

export function routeSetProps (routeDef: RouteDefNode, pathProps: PathLike, routeState: ?RouteStateNode): RouteStateNode {
  const pathSeq = I.Seq(pathProps).map(item => {
    if (typeof item === 'string') {
      return {selected: item}
    } else {
      const {selected, ...props} = item
      return {selected, props}
    }
  })
  return _routeSet(routeDef, pathSeq, routeState)
}

export function routeNavigate (routeDef: RouteDefNode, pathProps: PathLike, routeState: ?RouteStateNode): RouteStateNode {
  return routeSetProps(routeDef, I.List(pathProps).push({selected: null}), routeState)
}

export function routeSetState (routeDef: RouteDefNode, path: Path, routeState: RouteStateNode, partialState: {}): RouteStateNode {
  const pathSeq = I.Seq(path)
  if (!pathSeq.size) {
    return routeState.update('state', state => state.merge(partialState))
  }
  return routeState.updateChild(pathSeq.first(),
    childState => routeSetState(routeDef, pathSeq.skip(1), childState, partialState)
  )
}

export function routeClear (path: Path, routeState: ?RouteStateNode): ?RouteStateNode {
  if (!routeState) {
    return null
  }
  const pathSeq = I.Seq(path)
  if (!pathSeq.size) {
    return null
  }
  return routeState.updateChild(pathSeq.first(),
    childState => routeClear(pathSeq.skip(1), childState)
  )
}

export function checkRouteState (routeDef: RouteDefNode, routeState: ?RouteStateNode) {
  if (!routeDef) {
    return
  }

  let path = []
  let curDef = routeDef
  let curState = routeState
  while (curState && curState.selected !== null) {
    path.push(curState.selected)
    curDef = curDef.getChild(curState.selected)
    curState = curState.getChild(curState.selected)
    if (!curDef) {
      return `Missing route def: ${pathToString(path)}`
    }
  }
  if (!curState) {
    return `Route missing state: ${pathToString(path)}`
  }
  if (!curDef.component) {
    return `Route missing component: ${pathToString(path)}`
  }
}

export function getPath (routeState: RouteStateNode) {
  const path = []
  let curState = routeState
  while (curState && curState.selected !== null) {
    path.push(curState.selected)
    curState = curState.getChild(curState.selected)
  }
  return I.List(path)
}

export function pathToString (path: Array<string> | I.IndexedIterable<string>) {
  return '/' + path.join('/')
}
