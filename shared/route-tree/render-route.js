import React from 'react'

function pathToString(path) {
  return path.join('/') || '/'
}

function renderRouteNode(RouteComponent, routeDef, routeState, path, setRouteState, leafTags, child) {
  if (!RouteComponent) {
    throw new Error(`Route missing component: ${pathToString(path)}`)
  }

  return (
    <RouteComponent
      routeProps={routeDef.staticProps.merge(routeState.props).toJS()}
      routeState={routeDef.initialState.merge(routeState.state).toJS()}
      routeSelected={routeState.selected}
      routePath={path}
      routeLeafTags={leafTags && leafTags.toJS()}
      setRouteState={partialState => setRouteState(path, partialState)}
    >{child}</RouteComponent>
  )
}

function _RenderRoute({routeDef, routeState, setRouteState, path}): React$Element {
  path = path || []

  if (!routeDef) {
    throw new Error(`Undefined route: ${pathToString(path)}`)
  } else if (!routeState) {
    throw new Error(`Missing route state: ${pathToString(path)}`)
  }

  const selected = routeState.selected
  if (selected === null) {
    return {
      component: renderRouteNode(routeDef.component, routeDef, routeState, path, setRouteState),
      leafTags: routeDef.tags,
    }
  } else {
    let childDef = routeDef.children.get(selected)
    if (typeof childDef === 'function') {
      childDef = childDef()
    }
    const childState = routeState.children.get(selected)
    const childPath = path.concat(selected)
    const childRender = _RenderRoute({routeDef: childDef, routeState: childState, path: childPath, setRouteState})

    const nextComponent = routeDef.wrapComponent
      ? renderRouteNode(routeDef.wrapComponent, childDef, childState, path, setRouteState, childRender.leafTags, childRender.component)
      : childRender.component

    return {
      component: nextComponent,
      leafTags: childRender.leafTags,
    }
  }
}

export default function RenderRoute(props): React$Element {
  return _RenderRoute(props).component
}
