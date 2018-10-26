/**
 * WordPress dependencies
 */

import { Toolbar, Slot } from '@wordpress/components';

/**
 * Internal dependencies
 */
import NavigableToolbar from '../../navigable-toolbar';

const FormatToolbar = ( { controls } ) => {
	return (
		<NavigableToolbar
			scopeId="editor-format-toolbar"
			className="editor-format-toolbar"
		>
			<Toolbar>
				{ controls.map( ( format ) =>
					<Slot name={ `RichText.ToolbarControls.${ format }` } key={ format } />
				) }
			</Toolbar>
		</NavigableToolbar>
	);
};

export default FormatToolbar;
