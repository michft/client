// @flow
import {Routes} from '../route-tree'
import Profile from './container'

const routeTree = Routes({
  component: Profile,
  children: {
    profile: () => routeTree,
  },
})

export default routeTree
