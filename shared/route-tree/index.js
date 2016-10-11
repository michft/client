// @flow
import * as I from 'immutable'

export type RouteComponentProps<P,SP,S> = {
  routeProps: P & SP,
  routeState: S,
  routeSelected: string,
  routePath: Array<string>,
  routeLeafTags: ?any,
  setRouteState: (partialState: $Shape<S>) => void,
}

type RouteNodeShape<P,S> = {
  selected: string | true,  // TODO: way to type check valid name of child? $Keys
  component: ReactClass<RouteComponentProps<P,S>>,
  wrapComponent: ?ReactClass<RouteComponentProps<P,S>>,
  tags: I.Map<string, any>,
  staticProps: P,
  initialState: S,
  props: P,
  state: S,
  children: I.Map<string, RouteNodeRecord<*,*>>,
}

const routeNodeDefaults: RouteNodeShape<*,*> = {
  selected: null,
  component: null,
  wrapComponent: null,
  tags: I.Map(),
  staticProps: I.Map(),
  initialState: I.Map(),
  props: I.Map(),
  state: I.Map(),
  children: I.Map(),
}

export type RouteTreeNode<P,S> = I.Record<RouteNodeShape<P,S>>
const _RouteNode = I.Record(routeNodeDefaults)

export function Routes({selected, component, wrapComponent, staticProps, tags, initialState, children}) {
  return _RouteNode({
    selected: selected || true,
    component,
    wrapComponent,
    tags: I.Map(tags),
    staticProps: I.Map(staticProps),
    initialState: I.Map(initialState),
    props: I.Map(),
    state: I.Map(),
    children: I.Seq(children)
      .map(params => params instanceof _RouteNode ? params : Routes(params))
      .toMap(),
  })
}

function _routeSet(path, routeTree) {
  if (!path.length) {
    return routeTree
  }

  let pathHead = path[0]
  let newRouteTree = routeTree.set('selected', pathHead.selected)

  if (pathHead.selected !== true) {
    let newChild = _routeSet(path.slice(1), routeTree.children.get(pathHead.selected))
    if (pathHead.hasOwnProperty('props')) {
      newChild = newChild.set('props', I.fromJS(pathHead.props))
    }
    newRouteTree = newRouteTree.setIn(['children', pathHead.selected], newChild)
  }

  return newRouteTree
}

export function routeSetProps(pathProps, routeTree) {
  const path = pathProps.map(item => {
    if (typeof item === 'string') {
      return {selected: item}
    } else {
      const {selected, ...props} = item
      return {selected, props}
    }
  })
  return _routeSet(path, routeTree)
}

export function routeSetState(path, routeTree, partialState) {
  let pathHead = path[0]
  if (path.length) {
    const newChild = routeSetState(path.slice(1), routeTree.children.get(pathHead), partialState)
    return routeTree.set('children', routeTree.children.set(pathHead, newChild))
  } else {
    return routeTree.set('state', routeTree.state.merge(partialState))
  }
}

export function getPath(routeTree: RouteTreeNode<*,*>) {
  const path = []
  let curNode = routeTree
  while (curNode.selected !== true) {
    path.push(curNode.selected)
    curNode = curNode.children.get(curNode.selected)
  }
  return path
}
