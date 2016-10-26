// @flow
import {Routes} from '../route-tree'
import Profile from './container'

const routeTree = Routes({
  component: Profile,
  initialState: {currentFriendshipsTab: 'Followers'},
  children: {
    profile: () => routeTree,
  },
})

export default routeTree
