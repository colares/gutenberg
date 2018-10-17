/**
 * External dependencies
 */
import Mousetrap from 'mousetrap';
import 'mousetrap/plugins/global-bind/mousetrap-global-bind';
import { forEach, overEvery, over } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Children } from '@wordpress/element';

class KeyboardShortcuts extends Component {
	constructor() {
		super( ...arguments );

		this.bindKeyTarget = this.bindKeyTarget.bind( this );
	}

	componentDidMount() {
		const { keyTarget = document } = this;

		this.mousetrap = new Mousetrap( keyTarget );
		forEach( this.props.shortcuts, ( callback, key ) => {
			const { bindGlobal, eventName, ignoreChildHandled } = this.props;
			const bindFn = bindGlobal ? 'bindGlobal' : 'bind';

			if ( ignoreChildHandled ) {
				// Use short-circuit evaluation of `overEvery` (inherited by
				// `Array#every`) to avoid calling the original callback if
				// handled by a child.
				//
				// "every calls callbackfn once for each element present in the
				// array, in ascending order, until it finds one where
				// callbackfn returns false. If such an element is found, every
				// immediately returns false."
				//
				// See: https://www.ecma-international.org/ecma-262/5.1/#sec-15.4.4.16
				callback = overEvery( [
					( event ) => ! event._keyboardShortcutsHandled,
					callback,
				] );
			}

			// Assign handled flag for consideration of ancestor; importantly
			// only after considering flag presence to stop execution.
			callback = over( [
				callback,
				( event ) => event._keyboardShortcutsHandled = true,
			] );

			this.mousetrap[ bindFn ]( key, callback, eventName );
		} );
	}

	componentWillUnmount() {
		this.mousetrap.reset();
	}

	/**
	 * When rendering with children, binds the wrapper node on which events
	 * will be bound.
	 *
	 * @param {Element} node Key event target.
	 */
	bindKeyTarget( node ) {
		this.keyTarget = node;
	}

	render() {
		// Render as non-visual if there are no children pressed. Keyboard
		// events will be bound to the document instead.
		const { children } = this.props;
		if ( ! Children.count( children ) ) {
			return null;
		}

		return <div ref={ this.bindKeyTarget }>{ children }</div>;
	}
}

export default KeyboardShortcuts;
