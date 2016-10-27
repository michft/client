// @flow
import React, {Component} from 'react'
import Render from './render'
import {connect} from 'react-redux'
import {favoriteList, switchTab, toggleShowIgnored as onToggleShowIgnored} from '../actions/favorite'
import {openInKBFS} from '../actions/kbfs'
import {switchTo, navigateAppend} from '../actions/route-tree'

import type {TypedState} from '../constants/reducer'
import type {FolderState} from '../constants/favorite'

export type Props = {
  favoriteList: () => void,
  folderState: ?FolderState,
  openInKBFS: (path: string) => void,
  showingPrivate: boolean,
  username: ?string,
  navigateAppend: (path: any) => void,
  switchTab: (showingPrivate: boolean) => void,
  onToggleShowIgnored: (isPrivate: boolean) => void,
  showingIgnored: boolean,
}

class Folders extends Component<void, Props, void> {
  componentDidMount () {
    this.props.favoriteList()
  }

  render () {
    return (
      <Render
        {...this.props.folderState}
        onClick={path => this.props.navigateAppend(path)}  //FIXME
        onRekey={path => this.props.navigateAppend(path)}
        onOpen={path => this.props.openInKBFS(path)}
        onSwitchTab={showingPrivate => this.props.switchTab(showingPrivate)}
        showingPrivate={this.props.showingPrivate}
        username={this.props.username}
        onToggleShowIgnored={this.props.onToggleShowIgnored}
        showingIgnored={this.props.showingIgnored}
      />
    )
  }

  static parseRoute () {
    return {
      componentAtTop: {title: 'Folders'},
      // $FlowIssue
      parseNextRoute: Files.parseRoute,
    }
  }
}

export default connect(
  (state: TypedState, {routeProps, routeState}) => ({
    username: state.config.username,
    folderState: state.favorite ? state.favorite.folderState : null,
    showingPrivate: !!state.favorite && routeProps.showingPrivate,
    showingIgnored: !!state.favorite && routeState.showingIgnored,
  }),
  (dispatch: any, {routePath, routeState, setRouteState}) => ({
    favoriteList: () => { dispatch(favoriteList()) },
    navigateAppend: path => { dispatch(navigateAppend({selected: 'files', path})) },
    openInKBFS: path => { dispatch(openInKBFS(path)) },
    switchTab: showingPrivate => { dispatch(switchTo(...routePath.pop(), showingPrivate ? 'private' : 'public')) },
    onToggleShowIgnored: () => { setRouteState({showingIgnored: !routeState.showingIgnored}) }
  })
)(Folders)
