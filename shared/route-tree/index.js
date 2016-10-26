// @flow
import * as I from 'immutable'

/*
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
*/

const routeNodeDefaults: RouteNodeShape<*,*> = {
  defaultSelected: null,
  component: null,
  wrapComponent: null,
  tags: I.Map(),
  staticProps: I.Map(),
  initialState: I.Map(),
  children: I.Map(),
}

export type RouteTreeNode<P,S> = I.Record<RouteNodeShape<P,S>>
const _RouteDefNode = I.Record(routeNodeDefaults)

export function Routes({defaultSelected, component, wrapComponent, staticProps, tags, initialState, children}) {
  return _RouteDefNode({
    defaultSelected: defaultSelected || null,
    component,
    wrapComponent,
    tags: I.Map(tags),
    staticProps: I.Map(staticProps),  // TODO: fromJS? due to deep props?
    initialState: I.Map(initialState),
    props: I.Map(),
    state: I.Map(),
    children: I.Seq(children)
      .map(params => params instanceof _RouteDefNode || typeof params === 'function' ? params : Routes(params))
      .toMap(),
  })
}

export const RouteStateNode = I.Record({
  selected: null,
  props: I.Map(),
  state: I.Map(),
  children: I.Map(),
})

function _routeSet(routeDef, path, routeState) {
  const pathHead = path && path[0]

  let newRouteState
  if (!routeState) {
    newRouteState = RouteStateNode({selected: routeDef.defaultSelected})
  } else {
    newRouteState = routeState
    if (pathHead) {
      newRouteState = routeState.set('selected', pathHead.selected)
    }
  }

  const selected = newRouteState.selected
  if (selected !== null) {
    let childDef = routeDef.children.get(selected)
    if (!childDef) {
      throw new Error(`Invalid route selected: ${selected}`)
    }
    if (typeof childDef === 'function') {
      childDef = childDef()
    }

    newRouteState = newRouteState.updateIn(['children', selected], childState => {
      let newChild = _routeSet(childDef, path.slice(1), childState)
      if (pathHead && pathHead.hasOwnProperty('props')) {
        newChild = newChild.set('props', I.fromJS(pathHead.props))
      }
      return newChild
    })
  }

  return newRouteState
}

export function routeSetProps(routeDef, pathProps, routeState) {
  const path = pathProps.map(item => {
    if (typeof item === 'string') {
      return {selected: item}
    } else {
      const {selected, ...props} = item
      return {selected, props}
    }
  })
  return _routeSet(routeDef, path, routeState)
}

export function routeSetState(routeDef, path, routeState, partialState) {
  if (!path.length) {
    return routeState.update('state', state => state.merge(partialState))
  }
  return routeState.updateIn(['children', path[0]],
    childState => routeSetState(routeDef, path.slice(1), childState, partialState)
  )
}

export function routeClear(path, routeState) {
  if (!path.length) {
    return null
  }
  return routeState.updateIn(['children', path[0]],
    childState => routeClear(path.slice(1), childState)
  )
}

export function getPath(routeState: RouteTreeNode<*,*>) {
  const path = []
  let curNode = routeState
  while (curNode.selected !== null) {
    path.push(curNode.selected)
    curNode = curNode.children.get(curNode.selected)
  }
  return path
}
