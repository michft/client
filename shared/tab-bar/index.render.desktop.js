// @flow

import React, {Component} from 'react'
import {Box, Avatar} from '../common-adapters'
import {TabBarButton, TabBarItem} from '../common-adapters/tab-bar'
import {globalStyles, globalColors} from '../styles'
import flags from '../util/feature-flags'
import {
  profileTab,
  peopleTab,
  folderTab,
  devicesTab,
  searchTab,
  settingsTab,
} from '../constants/tabs'

import type {VisibleTab} from '../constants/tabs'
import type {IconType} from '../common-adapters/icon'
import type {Props} from './index.render'

export type SearchButton = 'TabBar:searchButton'
export const searchButton = 'TabBar:searchButton'

function ProfileTabBarButton ({selected, username, badgeNumber, onClick}: {selected: boolean, username: string, badgeNumber: number, onClick: () => void}) {
  // $FlowIssue
  const avatar: Avatar = (
    <Avatar
      size={32}
      onClick={onClick}
      username={username}
      borderColor={selected ? globalColors.white : globalColors.blue3_40}
    />
  )

  return (
    <TabBarButton
      label={username}
      selected={selected}
      badgeNumber={badgeNumber}
      source={{type: 'avatar', avatar}}
      style={{flex: 1}}
      styleContainer={{flex: 1, ...globalStyles.flexBoxColumn, justifyContent: 'flex-end'}}
    />
  )
}

export default function TabBar ({selectedTab, onTabClick, username, badgeNumbers}) {
  return (
    <Box style={stylesTabBar}>
      <TabBarButton
        label='Search'
        selected={selectedTab === searchTab}
        onClick={() => onTabClick(searchTab)}
        source={{type: 'nav', icon: 'iconfont-nav-search'}}
        style={stylesTabButton}
      />
      <TabBarButton
        label='Folders'
        selected={selectedTab === folderTab}
        onClick={() => onTabClick(folderTab)}
        badgeNumber={badgeNumbers[folderTab]}
        source={{type: 'nav', icon: 'iconfont-folder'}}
        style={stylesTabButton}
      />
      <TabBarButton
        label='Devices'
        selected={selectedTab === devicesTab}
        onClick={() => onTabClick(devicesTab)}
        badgeNumber={badgeNumbers[devicesTab]}
        source={{type: 'nav', icon: 'iconfont-device'}}
        style={stylesTabButton}
      />
      <TabBarButton
        label='Settings'
        selected={selectedTab === settingsTab}
        onClick={() => onTabClick(settingsTab)}
        badgeNumber={badgeNumbers[settingsTab]}
        source={{type: 'nav', icon: 'iconfont-settings'}}
        style={stylesTabButton}
      />
      <ProfileTabBarButton
        username={username}
        selected={selectedTab === profileTab}
        onClick={() => onTabClick(profileTab)}
        badgeNumber={badgeNumbers[profileTab]}
      />
      {flags.tabPeopleEnabled &&
        <TabBarButton
          label='People'
          selected={selectedTab === peopleTab}
          onClick={() => onTabClick(peopleTab)}
          badgeNumber={badgeNumbers[peopleTab]}
          source={{type: 'nav', icon: 'iconfont-people'}}
          style={stylesTabButton}
        />
      }
    </Box>
  )
}

const stylesTabBar = {
  ...globalStyles.flexBoxColumn,
  justifyContent: 'flex-start',
  backgroundColor: globalColors.midnightBlue,
  paddingTop: 10,
  width: 80,
}

const stylesTabButton = {
  height: 56,
}
