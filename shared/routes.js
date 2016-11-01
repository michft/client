// @flow
import {RouteDefNode} from './route-tree'
import devicesRoutes from './devices/routes'
import foldersRoutes from './folders/routes'
import profileRoutes from './profile/routes'
import searchRoutes from './search/routes'
import settingsRoutes from './settings/routes'
import Nav from './nav'
import {
  profileTab,
  folderTab,
  devicesTab,
  searchTab,
  settingsTab,
} from './constants/tabs'

const routeTree = new RouteDefNode({
  defaultSelected: devicesTab,
  containerComponent: Nav,
  children: {
    [folderTab]: foldersRoutes,
    [devicesTab]: devicesRoutes,
    [profileTab]: profileRoutes,
    [searchTab]: searchRoutes,
    [settingsTab]: settingsRoutes,
  },
})

export default routeTree
