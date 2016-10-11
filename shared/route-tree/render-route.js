import React from 'react'

function renderRouteNode(RouteComponent, routeTree, path, setRouteState, leafTags, child) {
  return <RouteComponent
    routeProps={routeTree.staticProps.merge(routeTree.props).toJS()}
    routeState={routeTree.initialState.merge(routeTree.state).toJS()}
    routeSelected={routeTree.selected}
    routePath={path}
    routeLeafTags={leafTags && leafTags.toJS()}
    setRouteState={partialState => setRouteState(path, partialState)}
  >{child}</RouteComponent>
}

function _RenderRoute({routeTree, setRouteState, path}): React$Element {
  if (!routeTree) {
    throw new Error(`Undefined route: ${path.join('/')}`)
  }
  if (routeTree.selected === true) {
    if (!routeTree.component) {
      throw new Error(`Route missing component: ${path.join('/')}`)
    }
    return {
      component: renderRouteNode(routeTree.component, routeTree, path, setRouteState),
      leafTags: routeTree.tags,
    }
  } else {
    const childNode = routeTree.children.get(routeTree.selected)
    const childPath = (path || []).concat(routeTree.selected)
    const childRender = _RenderRoute({routeTree: childNode, setRouteState, path: childPath})
    return {
      component: !routeTree.wrapComponent
        ? childRender.component
        : renderRouteNode(routeTree.wrapComponent, routeTree, path, setRouteState, childRender.leafTags, childRender.component),
      leafTags: childRender.leafTags,
    }
  }
}

export default function RenderRoute({routeTree, setRouteState, path}): React$Element {
  return _RenderRoute({routeTree, setRouteState, path}).component
}
