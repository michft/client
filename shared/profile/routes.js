// @flow
import {RouteDefNode} from '../route-tree'
import Profile from './container'

const routeTree = new RouteDefNode({
  component: Profile,
  initialState: {currentFriendshipsTab: 'Followers'},
  children: {
    profile: () => routeTree,
  },
})

export default routeTree
