// @flow
import {remote, ipcRenderer} from 'electron'

import React, {Component} from 'react'
import {connect} from 'react-redux'
import {globalStyles} from './styles'
import {Box} from './common-adapters'
import GlobalError from './global-errors/container'

import {folderTab} from './constants/tabs'
import {switchTo} from './actions/route-tree'
import {setActive} from './actions/search'
import TabBar from './tab-bar/index.render'

import type {RouteNodeRecord} from './route-tree'

type Props = {
  menuBadge: boolean,
  switchTab: (tab: Tabs) => void,
  routeTree: RouteNodeRecord<*,*>,
  provisioned: boolean,
  username: string,
  navigateBack: () => void,
  navigateUp: () => void,
  folderBadge: number,
  searchActive: boolean,
  setSearchActive: (active: boolean) => void,
}

function Nav (props) {
  return (
    <Box style={stylesTabsContainer}>
      <TabBar
        onTabClick={t => props.switchTab(t)}
        selectedTab={props.routeSelected}
        onSearchClick={() => props.setSearchActive(!this.props.searchActive)}
        searchActive={props.searchActive}
        username={props.username}
        badgeNumbers={{[folderTab]: props.folderBadge}}
        //searchContent={<Search />}
      />
      <GlobalError />
      {props.children}
    </Box>
  )
}

const stylesTabsContainer = {
  ...globalStyles.flexBoxRow,
  flex: 1,
}

export default connect(
  ({
    search: {searchActive},
    routeTree,
    config: {extendedConfig, username},
    favorite: {publicBadge = 0, privateBadge = 0},
    notifications: {menuBadge}}) => ({
      routeTree,
      searchActive,
      provisioned: extendedConfig && !!extendedConfig.defaultDeviceID,
      username,
      menuBadge,
      folderBadge: publicBadge + privateBadge,
    }),
  dispatch => {
    return {
      switchTab: tab => dispatch(switchTo(tab)),
      setSearchActive: (active) => { dispatch(setActive(active)) },
    }
  }
)(Nav)
