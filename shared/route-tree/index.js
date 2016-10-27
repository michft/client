// @flow
import * as I from 'immutable'

const routeNodeDefaults = {
  defaultSelected: null,
  component: null,
  containerComponent: null,
  tags: I.Map(),
  staticProps: I.Map(),
  initialState: I.Map(),
  children: I.Map(),
}

const _RouteDefNode = I.Record(routeNodeDefaults)

export function Routes({defaultSelected, component, containerComponent, staticProps, tags, initialState, children}) {
  return _RouteDefNode({
    defaultSelected: defaultSelected || null,
    component,
    containerComponent,
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

export class InvalidRouteError extends Error {}

function _routeSet(routeDef, path, routeState) {
  const pathHead = path && path.first()

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
      throw new InvalidRouteError(`Invalid route selected: ${selected}`)
    }
    if (typeof childDef === 'function') {
      childDef = childDef()
    }

    newRouteState = newRouteState.updateIn(['children', selected], childState => {
      let newChild = _routeSet(childDef, path.skip(1), childState)
      if (pathHead && pathHead.hasOwnProperty('props')) {
        newChild = newChild.set('props', I.fromJS(pathHead.props))
      }
      return newChild
    })
  }

  return newRouteState
}

export function routeSetProps(routeDef, pathProps, routeState) {
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

export function routeNavigate(routeDef, pathProps, routeState) {
  return routeSetProps(routeDef, pathProps.concat({selected: null}), routeState)
}

export function routeSetState(routeDef, path, routeState, partialState) {
  const pathSeq = I.Seq(path)
  if (!pathSeq.size) {
    return routeState.update('state', state => state.merge(partialState))
  }
  return routeState.updateIn(['children', pathSeq.first()],
    childState => routeSetState(routeDef, pathSeq.skip(1), childState, partialState)
  )
}

export function routeClear(path, routeState) {
  const pathSeq = I.Seq(path)
  if (!pathSeq.size) {
    return null
  }
  return routeState.updateIn(['children', pathSeq.first()],
    childState => routeClear(pathSeq.skip(1), childState)
  )
}

export function getPath(routeState) {
  const path = []
  let curNode = routeState
  while (curNode && curNode.selected !== null) {
    path.push(curNode.selected)
    curNode = curNode.children.get(curNode.selected)
  }
  return I.List(path)
}
