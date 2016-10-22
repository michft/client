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

type RouteState<P,S> = {
  selected: string | true,  // TODO: way to type check valid name of child? $Keys
  props: P,
  state: S,
}

type RouteNodeShapeBase<P,S> = {
  component: ?ReactClass<RouteComponentProps<P,S>>,
  tags: I.Map<string, any>,
  staticProps: P,
  initialState: S,
  children: I.Map<string, RouteNodeRecord<*,*>>,
}

type RouteNodeShapeSingle<P,S> = RouteNodeShapeBase<P,S> & RouteState<P,S> & {
  wrapComponent: ?ReactClass<RouteComponentProps<P,S>>,
}

type RouteNodeShapeRecursive<P,S> = RouteNodeShapeBase<P,S> & {
  recursive: true,
  selected: I.List<RouteState>,
}

type RouteNodeShape<P,S> = RouteNodeShapeSingle<P,S> | RouteNodeShapeRecursive<P,S>

const routeNodeDefaults: RouteNodeShape<*,*> = {
  selected: null,
  recursive: false,
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

const _RouteStateNode = I.Record({
  selected: null,
  props: I.Map(),
  state: I.Map(),
})

export function Routes({selected, recursive, component, wrapComponent, staticProps, tags, initialState, children}) {
  return _RouteNode({
    selected: selected || true,
    recursive: recursive,
    component,
    wrapComponent,
    tags: I.Map(tags),
    staticProps: I.Map(staticProps),  // TODO: fromJS? due to deep props?
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

  if (routeTree.recursive) {
    const selectedStack = routeTree.selected === true ? I.List() : routeTree.selected
      // FIXME: still a bit buggy, but mostly working
      .mergeWith((prev, next) => (next && {
        selected: next.selected,
        props: next.hasOwnProperty('props') ? next.props : prev && prev.props,
      }), I.Seq(path))
      .takeUntil(n => !n || n.selected === true)
      .map(_RouteStateNode)
    return routeTree.set('selected', selectedStack.isEmpty ? true : selectedStack)
  }

  let pathHead = path[0]
  let newRouteTree = routeTree.set('selected', pathHead.selected)

  if (pathHead.selected !== true) {
    let newChild = _routeSet(path.slice(1), routeTree.children.get(pathHead.selected))
    if (pathHead.hasOwnProperty('props')) {
      newChild = newChild.set('props', I.fromJS(pathHead.props))
    }
    //TODO: reset state?
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
  if (routeTree.recursive) {
    // TODO: check invalid path
    const newSelected = routeTree.get('selected').merge(path.length - 1, partialState)
    return routeTree.set('selected', newSelected)
  } else {
    if (path.length) {
      const newChild = routeSetState(path.slice(1), routeTree.children.get(pathHead), partialState)
      return routeTree.set('children', routeTree.children.set(pathHead, newChild))
    } else {
      return routeTree.set('state', routeTree.state.merge(partialState))
    }
  }
}

export function getPath(routeTree: RouteTreeNode<*,*>) {
  const path = []
  let curNode = routeTree
  while (curNode.selected !== true) {
    if (curNode.recursive) {
      curNode.selected.forEach(n => path.push(n.selected))
      break
    }
    path.push(curNode.selected)
    curNode = curNode.children.get(curNode.selected)
  }
  return path
}
