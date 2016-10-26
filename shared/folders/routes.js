// @flow
import {Routes} from '../route-tree'
import Folders from './'
import Files from './files'
import PaperKey from './files/paperkey'

const filesSubTree = {
  files: {
    component: Files,
    children: {
      paperkey: {
        component: PaperKey,
      },
    },
  },
}

const routeTree = Routes({
  defaultSelected: 'private',
  children: {
    private: {
      component: Folders,
      staticProps: {showingPrivate: true},
      initialState: {showingIgnored: false},
      children: filesSubTree,
    },
    public: {
      component: Folders,
      staticProps: {showingPrivate: false},
      initialState: {showingIgnored: false},
      children: filesSubTree,
    },
  }
})

export default routeTree
