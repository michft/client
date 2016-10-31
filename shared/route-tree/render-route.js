// @flow
import * as I from 'immutable'
import React, {PureComponent} from 'react'
import {pathToString} from './'
import {LeafTags} from './'

import type {RouteDefNode, RouteStateNode} from './'

export type RouteProps<P, S> = {
  routeProps: P,
  routeState: S,
  routeSelected: string,
  routePath: I.List<string>,
  routeLeafTags: LeafTags,
  setRouteState: (partialState: {}) => void,
}

type RenderRouteNodeProps = {
  isContainer: boolean,
  routeDef: RouteDefNode,
  routeState: RouteStateNode,
  setRouteState: (partialState: {}) => void,
  path: I.List<string>,
  leafTags?: LeafTags,
  children?: React$Element<*>,
}

class RenderRouteNode extends PureComponent<*, RenderRouteNodeProps, *> {
  render() {
    const {isContainer, routeDef, routeState, setRouteState, path, leafTags, children} = this.props
    const RouteComponent = isContainer ? routeDef.containerComponent : routeDef.component
    return (
      <RouteComponent
        routeProps={routeState.props.toJS()}
        routeState={routeDef.initialState.merge(routeState.state).toJS()}
        routeSelected={routeState.selected}
        routePath={path}
        routeLeafTags={leafTags || LeafTags()}
        setRouteState={partialState => setRouteState(path, partialState)}
      >{children}</RouteComponent>
    )
  }
}

type _RenderRouteProps = {
  routeDef: RouteDefNode,
  routeState: RouteStateNode,
  setRouteState: (partialState: {}) => void,
  path: I.List<string>,
}

function _RenderRoute({routeDef, routeState, setRouteState, path}: _RenderRouteProps): {leafTags: LeafTags, component: React$Element<any>} {
  path = path || I.List()

  if (!routeDef) {
    throw new Error(`Undefined route: ${pathToString(path)}`)
  } else if (!routeState) {
    throw new Error(`Missing route state: ${pathToString(path)}`)
  }

  const selected = routeState.selected
  if (selected === null) {
    if (!routeDef.component) {
      throw new Error(`Attempt to render route without component: ${pathToString(path)}`)
    }
    return {
      component: (
        <RenderRouteNode
          isContainer={false}
          routeDef={routeDef}
          routeState={routeState}
          path={path}
          setRouteState={setRouteState}
        />
      ),
      leafTags: routeDef.tags,
    }
  } else {
    let childDef = routeDef.children.get(selected)
    if (typeof childDef === 'function') {
      childDef = childDef()
    }
    const childState = routeState.children.get(selected)
    const childPath = path.push(selected)
    const childRender = _RenderRoute({routeDef: childDef, routeState: childState, path: childPath, setRouteState})

    let nextComponent
    if (!routeDef.containerComponent) {
      nextComponent = childRender.component
    } else {
      nextComponent = (
        <RenderRouteNode
          isContainer={true}
          routeDef={routeDef}
          routeState={routeState}
          path={path}
          setRouteState={setRouteState}
          leafTags={childRender.leafTags}
        >
          {childRender.component}
        </RenderRouteNode>
      )
    }

    return {
      component: nextComponent,
      leafTags: childRender.leafTags,
    }
  }
}

export default class RenderRoute extends PureComponent<*, _RenderRouteProps, *> {
  render() {
    return _RenderRoute(this.props).component
  }
}
