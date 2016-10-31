// @flow
import {RouteDefNode} from '../route-tree'
import profileRoutes from '../profile/routes'
import Search from './'

const routeTree = new RouteDefNode({
  component: Search,
  children: {
    profile: profileRoutes,
  }
})

export default routeTree
