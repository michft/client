// @flow
import {Routes} from '../route-tree'
import Folders from './'

const routeTree = Routes({
  selected: 'private',
  children: {
    private: {
      component: Folders,
      staticProps: {showingPrivate: true},
      initialState: {showingIgnored: false},
    },
    public: {
      component: Folders,
      staticProps: {showingPrivate: false},
      initialState: {showingIgnored: false},
    },
  }
})

export default routeTree
