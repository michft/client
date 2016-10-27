// @flow
import * as I from 'immutable'

const routeNodeDefaults = {
  defaultSelected: null,
  component: null,
  containerComponent: null,
  tags: I.Map(),
  initialState: I.Map(),
  children: I.Map(),
}

const _RouteDefNode = I.Record(routeNodeDefaults)

export class Routes extends _RouteDefNode {
  constructor({defaultSelected, component, containerComponent, tags, initialState, children}) {
    super({
      defaultSelected: defaultSelected || null,
      component,
      containerComponent,
      tags: I.Map(tags),
      initialState: I.Map(initialState),
      props: I.Map(),
      state: I.Map(),
      children: I.Seq(children)
        .map(params => params instanceof Routes || typeof params === 'function' ? params : new Routes(params))
        .toMap(),
    })
  }

  getChild(name) {
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

const _RouteStateNode = I.Record({
  selected: null,
  props: I.Map(),
  state: I.Map(),
  children: I.Map(),
})

export class RouteStateNode extends _RouteStateNode {
  getChild(name) {
    return this.children.get(name)
  }

  updateChild(name, op) {
    return this.updateIn(['children', name], op)
  }
}

export class InvalidRouteError extends Error {}

function _routeSet(routeDef, path, routeState) {
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
    let childDef = routeDef.getChild(selected)
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
  return routeState.updateChild(pathSeq.first(),
    childState => routeSetState(routeDef, pathSeq.skip(1), childState, partialState)
  )
}

export function routeClear(path, routeState) {
  const pathSeq = I.Seq(path)
  if (!pathSeq.size) {
    return null
  }
  return routeState.updateChild(pathSeq.first(),
    childState => routeClear(pathSeq.skip(1), childState)
  )
}

export function checkRouteState(routeDef, routeState) {
  if (!routeDef) {
    return
  }

  const path = []
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

export function getPath(routeState) {
  const path = []
  let curState = routeState
  while (curState && curState.selected !== null) {
    path.push(curState.selected)
    curState = curState.getChild(curState.selected)
  }
  return I.List(path)
}

export function pathToString(path) {
  return '/' + path.join('/')
}
