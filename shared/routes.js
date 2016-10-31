import * as I from 'immutable'

import {RouteDef} from './route-tree'
import devicesRoutes from './devices/routes'
import foldersRoutes from './folders/routes'
import profileRoutes from './profile/routes'
import searchRoutes from './search/routes'
import settingsRoutes from './settings/routes'
import Nav from './nav'
import {
  profileTab,
  peopleTab,
  folderTab,
  devicesTab,
  searchTab,
  settingsTab,
} from './constants/tabs'

const routeTree = new RouteDef({
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

//TODO: hot reloading

// pass route data / state as props to components
// navigate up for popup steps
//
//
// reducer contains state tree of existing pages, routes
// routes file contains information about routes; templates
//
// routes are data + contexts for state
// components render routes
// route table defines templates for state in routes
//
// global routes?
