// @flow
import React, {Component} from 'react'
import SettingsContainer from './render'
import flags from '../util/feature-flags'
import {connect} from 'react-redux'
import {switchTo} from '../actions/route-tree'
import Routable from '../util/routable'

// $FlowIssue type this connector
export default connect(
  (state, {routeSelected, routeLeafTags}) => ({
    showComingSoon: !flags.tabSettingsEnabled,
    selectedTab: routeSelected,
    isModal: routeLeafTags.modal,
  }),
  (dispatch, {routePath}) => ({
    onTabChange: tab => { dispatch(switchTo(...routePath, tab)) },
  })
)(SettingsContainer)
