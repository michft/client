// @flow
import {remote, ipcRenderer} from 'electron'

import React, {Component} from 'react'
import {connect} from 'react-redux'
import {globalStyles} from './styles'
import MetaNavigator from './router/meta-navigator'
import RenderRoute from './route-tree/render-route'
import globalRoutes from './router/global-routes'
import Folders from './folders'
import Chat from './chat'
import People from './people'
import Devices from './devices'
import NoTab from './no-tab'
import Profile from './profile/container'
import Search from './search'
import Settings from './settings'
import Login from './login'
import flags from './util/feature-flags'
import {mapValues} from 'lodash'
import type {Tabs} from './constants/tabs'
import GlobalError from './global-errors/container'

import {profileTab, folderTab, chatTab, peopleTab, devicesTab, settingsTab, loginTab} from './constants/tabs'
import {navigateBack, navigateUp, setRouteState} from './actions/route-tree'
import {setActive} from './actions/search'
import TabBar from './tab-bar/index.render'

import type {RouteNodeRecord} from './route-tree'

type Props = {
  menuBadge: boolean,
  routeTree: RouteNodeRecord<*,*>,
  provisioned: boolean,
  username: string,
  navigateBack: () => void,
  navigateUp: () => void,
  folderBadge: number,
  searchActive: boolean,
  setSearchActive: (active: boolean) => void,
}

class Main extends Component<void, Props, void> {
  _lastCheckedTab: ?Tabs;
  _checkingTab: boolean;
  _handleKeyDown: (e: SyntheticKeyboardEvent) => void;

  constructor (props) {
    super(props)
    this._handleKeyDown = this._handleKeyDown.bind(this)

    this._lastCheckedTab = null // the last tab we resized for
  }

  _checkTabChanged () {
    return
    // TODO: replace with store state listener
    if (this._checkingTab) {
      return
    }

    this._checkingTab = true

    setImmediate(() => {
      this._checkingTab = false
      const currentWindow = remote.getCurrentWindow()

      if (!currentWindow) {
        return
      }

      const activeTab = this._activeTab()

      if (this._lastCheckedTab === activeTab) {
        return
      }

      this._lastCheckedTab = activeTab

      ipcRenderer.send('tabChanged', activeTab)
    })
  }

  _handleKeyDown (e: SyntheticKeyboardEvent) {
    const modKey = process.platform === 'darwin' ? e.metaKey : e.ctrlKey
    if (modKey && e.key === 'ArrowLeft') {
      e.preventDefault()
      this.props.navigateBack()
      return
    }
    if (modKey && e.key === 'ArrowUp') {
      e.preventDefault()
      this.props.navigateUp()
      return
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    if (this.props.folderBadge !== nextProps.folderBadge) {
      return true
    }

    if (this.props.menuBadge !== nextProps.menuBadge) {
      ipcRenderer.send(this.props.menuBadge ? 'showTrayRegular' : 'showTrayBadged')
    }

    if (this.props.searchActive !== nextProps.searchActive) {
      return true
    }

    //searchactive root route prop?

    return !this.props.routeTree.equals(nextProps.routeTree)
  }

  componentDidMount () {
    this._checkTabChanged()
    if (flags.admin) window.addEventListener('keydown', this._handleKeyDown)
  }

  componentDidUpdate () {
    this._checkTabChanged()
  }

  componentWillUnmount () {
    if (flags.admin) window.removeEventListener('keydown', this._handleKeyDown)
  }

  render () {
    return <RenderRoute routeTree={this.props.routeTree} setRouteState={this.props.setRouteState} />
  }
}

const stylesTabsContainer = {
  ...globalStyles.flexBoxColumn,
  flex: 1,
  position: 'relative',
}

// $FlowIssue type this connector
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
      navigateBack: () => dispatch(navigateBack()),
      navigateUp: () => dispatch(navigateUp()),
      setRouteState: (path, partialState) => { dispatch(setRouteState(path, partialState)) },
      setSearchActive: (active) => { dispatch(setActive(active)) },
    }
  }
)(Main)
