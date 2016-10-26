// @flow
import {Routes} from '../route-tree'
import profileRoutes from '../profile/routes'
import Search from './'

const routeTree = Routes({
  component: Search,
  children: {
    profile: profileRoutes,
  }
})

export default routeTree
