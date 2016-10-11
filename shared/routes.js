import * as I from 'immutable'

import {Routes} from './route-tree'
import devicesRoutes from './devices/routes'
import foldersRoutes from './folders/routes'
import settingsRoutes from './settings/routes'
import Nav from './nav'
import {profileTab, peopleTab, folderTab, devicesTab, settingsTab} from './constants/tabs'

const routeTree = Routes({
  selected: devicesTab,
  wrapComponent: Nav,
  children: {
    [folderTab]: foldersRoutes,
    [devicesTab]: devicesRoutes,
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
