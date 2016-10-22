import React from 'react'

function renderRouteNode(RouteComponent, routeTree, routeData, path, setRouteState, leafTags, child) {
  if (!RouteComponent) {
    throw new Error(`Route missing component: ${path.join('/')}`)
  }
  return <RouteComponent
    routeProps={routeTree.staticProps.merge(routeData.props).toJS()}
    routeState={routeTree.initialState.merge(routeData.state).toJS()}
    routeSelected={routeTree.selected}  // FIXME: accurate for recursive routes?
    routePath={path}
    routeLeafTags={leafTags && leafTags.toJS()}
    setRouteState={partialState => setRouteState(path, partialState)}
  >{child}</RouteComponent>
}

function _RenderRoute({routeTree, setRouteState, path}): React$Element {
  path = path || []
  if (!routeTree) {
    throw new Error(`Undefined route: ${path.join('/')}`)
  }
  if (routeTree.selected === true) {
    return {
      component: renderRouteNode(routeTree.component, routeTree, routeTree, path, setRouteState),
      leafTags: routeTree.tags,
    }
  } else if (routeTree.recursive) {
    const lastRoute = routeTree.selected.last()
    const lastRouteChild = routeTree.children.get(lastRoute.selected)
    const lastComponent = lastRouteChild.component
    const recursivePath = path.concat(routeTree.selected.map(n => n.selected).toArray())
    return {
      component: renderRouteNode(lastComponent, routeTree, lastRoute, path, setRouteState),
      leafTags: lastRouteChild.tags,
    }
  } else {
    const childNode = routeTree.children.get(routeTree.selected)
    const childPath = path.concat(routeTree.selected)
    const childRender = _RenderRoute({routeTree: childNode, setRouteState, path: childPath})
    return {
      component: !routeTree.wrapComponent
        ? childRender.component
        : renderRouteNode(routeTree.wrapComponent, routeTree, routeTree, path, setRouteState, childRender.leafTags, childRender.component),
      leafTags: childRender.leafTags,
    }
  }
}

export default function RenderRoute({routeTree, setRouteState, path}): React$Element {
  return _RenderRoute({routeTree, setRouteState, path}).component
}
