
// COMMON IMPORTS
import T                      from '../../node_modules/devapt-core-common/dist/js/utils/types'
import DefaultRenderingPlugin from '../../node_modules/devapt-core-common/dist/js/default_plugins/rendering_default_plugin'
import RenderingPlugin        from '../../node_modules/devapt-core-common/dist/js/plugins/rendering_plugin'

// BROWSER IMPORTS
import runtime          from './runtime/client_runtime'
import Component        from './base/component'
import Container        from './base/container'


/**
 * Main public part of Devapt library on client side
 * @name index.js
 * 
 * @license Apache-2.0
 * @auhtor Luc BORIES
 */

export default { T, runtime, Component, Container, RenderingPlugin, DefaultRenderingPlugin }
