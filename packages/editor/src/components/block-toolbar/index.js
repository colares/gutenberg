/**
 * WordPress Dependencies
 */
import { withSelect } from '@wordpress/data';
import { Component, createRef, Fragment } from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import BlockSwitcher from '../block-switcher';
import MultiBlocksSwitcher from '../block-switcher/multi-blocks-switcher';
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';
import BlockSettingsMenu from '../block-settings-menu';
import NavigableToolbar from '../navigable-toolbar';

class BlockToolbar extends Component {
	constructor() {
		super( ...arguments );
		this.container = createRef();
	}

	componentDidMount() {
		if ( this.props.blockClientIds.length > 1 ) {
			this.focusContainer();
		}
	}

	componentDidUpdate( prevProps ) {
		if (
			prevProps.blockClientIds.length <= 1 &&
			this.props.blockClientIds.length > 1
		) {
			this.focusContainer();
		}
	}

	focusContainer() {
		const tabbables = focus.tabbable.find( this.container.current );
		if ( tabbables.length ) {
			tabbables[ 0 ].focus();
		}
	}

	render() {
		const { blockClientIds, isValid, mode } = this.props;

		if ( blockClientIds.length === 0 ) {
			return null;
		}

		if ( blockClientIds.length > 1 ) {
			return (
				<div className="editor-block-toolbar" ref={ this.container }>
					<MultiBlocksSwitcher />
					<BlockSettingsMenu clientIds={ blockClientIds } />
				</div>
			);
		}

		return (
			<NavigableToolbar
				className="editor-block-toolbar"
				aria-label={ __( 'Block Toolbar' ) }
				scopeId={ 'block-' + blockClientIds[ 0 ] }
			>
				{ mode === 'visual' && isValid && (
					<Fragment>
						<BlockSwitcher clientIds={ blockClientIds } />
						<BlockControls.Slot />
						<BlockFormatControls.Slot />
					</Fragment>
				) }
				<BlockSettingsMenu clientIds={ blockClientIds } />
			</NavigableToolbar>
		);
	}
}

export default withSelect( ( select ) => {
	const {
		getSelectedBlock,
		getBlockMode,
		getMultiSelectedBlockClientIds,
	} = select( 'core/editor' );
	const block = getSelectedBlock();
	const blockClientIds = block ?
		[ block.clientId ] :
		getMultiSelectedBlockClientIds();

	return {
		blockClientIds,
		isValid: block ? block.isValid : null,
		mode: block ? getBlockMode( block.clientId ) : null,
	};
} )( BlockToolbar );
