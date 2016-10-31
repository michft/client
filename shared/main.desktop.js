// @flow
import {remote, ipcRenderer} from 'electron'

import React, {Component} from 'react'
import {connect} from 'react-redux'
import {globalStyles} from './styles'
import MetaNavigator from './router/meta-navigator'
import RenderRoute from './route-tree/render-route'
import globalRoutes from './router/global-routes'
import flags from './util/feature-flags'
import {mapValues} from 'lodash'

import {profileTab, folderTab, chatTab, peopleTab, devicesTab, settingsTab, loginTab} from './constants/tabs'
import {navigateUp, resetRoute, setRouteState} from './actions/route-tree'
import TabBar from './tab-bar/index.render'

import type {RouteDefNode, RouteStateNode, Path} from './route-tree'
import type {Tabs} from './constants/tabs'

type Props = {
  menuBadge: boolean,
  provisioned: boolean,
  username: string,
  navigateUp: () => void,
  folderBadge: number,
  routeDef: RouteDefNode,
  routeState: RouteStateNode,
  setRouteState: (path: Path, partialState: {}) => void,
}

class Main extends Component<void, Props, void> {
  _handleKeyDown: (e: SyntheticKeyboardEvent) => void;

  constructor (props) {
    super(props)
    this._handleKeyDown = this._handleKeyDown.bind(this)
  }

  //_checkTabChanged () {
  //  return
  //  // TODO: replace with store state listener
  //  if (this._checkingTab) {
  //    return
  //  }

  //  this._checkingTab = true

  //  setImmediate(() => {
  //    this._checkingTab = false
  //    const currentWindow = remote.getCurrentWindow()

  //    if (!currentWindow) {
  //      return
  //    }

  //    const activeTab = this._activeTab()

  //    if (this._lastCheckedTab === activeTab) {
  //      return
  //    }

  //    this._lastCheckedTab = activeTab

  //    ipcRenderer.send('tabChanged', activeTab)
  //  })
  //}

  _handleKeyDown (e: SyntheticKeyboardEvent) {
    const modKey = process.platform === 'darwin' ? e.metaKey : e.ctrlKey
    //if (modKey && e.key === 'ArrowLeft') {
    //  e.preventDefault()
    //  this.props.navigateBack()
    //  return
    //}
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

    return !this.props.routeState.equals(nextProps.routeState) || !this.props.routeDef.equals(nextProps.routeDef)
  }

  componentDidMount () {
    if (flags.admin) window.addEventListener('keydown', this._handleKeyDown)
  }

  componentWillUnmount () {
    if (flags.admin) window.removeEventListener('keydown', this._handleKeyDown)
  }

  render () {
    return (
      <RenderRoute
        routeDef={this.props.routeDef}
        routeState={this.props.routeState}
        setRouteState={this.props.setRouteState}
      />
    )
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
    routeTree: {routeDef, routeState},
    config: {extendedConfig, username},
    favorite: {publicBadge = 0, privateBadge = 0},
    notifications: {menuBadge}}) => ({
      routeDef,
      routeState,
      provisioned: extendedConfig && !!extendedConfig.defaultDeviceID,
      username,
      menuBadge,
      folderBadge: publicBadge + privateBadge,
    }),
  dispatch => {
    return {
      navigateUp: () => dispatch(navigateUp()),
      setRouteState: (path, partialState) => { dispatch(setRouteState(path, partialState)) },
    }
  }
)(Main)