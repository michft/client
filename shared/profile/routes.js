// @flow
import {Routes} from '../route-tree'
import Profile from './container'

const userProfileSubTree = {
  component: Profile,
  recursive: true,
  children: {
    profile: {
      component: Profile,
    },
  },
}

const routeTree = Routes({
  ...userProfileSubTree,
})

export default routeTree
