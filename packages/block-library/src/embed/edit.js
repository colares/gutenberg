/**
 * Internal dependencies
 */
import { isFromWordPress, createUpgradedEmbedBlock } from './util';
import { ASPECT_RATIOS } from './constants';
import { EmbedLoading, EmbedControls, EmbedPreview, EmbedEditUrl } from './components';

/**
 * External dependencies
 */
import { kebabCase, toLower } from 'lodash';
import classnames from 'classnames/dedupe';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

export function getEmbedEditComponent( title, icon ) {
	return class extends Component {
		constructor() {
			super( ...arguments );
			this.switchBackToURLInput = this.switchBackToURLInput.bind( this );
			this.setUrl = this.setUrl.bind( this );
			this.getAttributesFromPreview = this.getAttributesFromPreview.bind( this );
			this.setAttributesFromPreview = this.setAttributesFromPreview.bind( this );
			this.getResponsiveHelp = this.getResponsiveHelp.bind( this );
			this.toggleResponsive = this.toggleResponsive.bind( this );
			this.handleIncomingPreview = this.handleIncomingPreview.bind( this );

			this.state = {
				editingURL: false,
				url: this.props.attributes.url,
			};

			if ( this.props.preview ) {
				this.handleIncomingPreview();
			}
		}

		handleIncomingPreview() {
			const { allowResponsive } = this.props.attributes;
			this.setAttributesFromPreview();
			const upgradedBlock = createUpgradedEmbedBlock(
				this.props,
				this.getAttributesFromPreview( this.props.preview, allowResponsive )
			);
			if ( upgradedBlock ) {
				this.props.onReplace( upgradedBlock );
			}
		}

		componentDidUpdate( prevProps ) {
			const hasPreview = undefined !== this.props.preview;
			const hadPreview = undefined !== prevProps.preview;
			const switchedPreview = this.props.preview && this.props.attributes.url !== prevProps.attributes.url;
			const switchedURL = this.props.attributes.url !== prevProps.attributes.url;

			if ( ( hasPreview && ! hadPreview ) || switchedPreview || switchedURL ) {
				if ( this.props.cannotEmbed ) {
					// Can't embed this URL, and we've just received or switched the preview.
					this.setState( { editingURL: true } );
					return;
				}
				this.handleIncomingPreview();
			}
		}

		setUrl( event ) {
			if ( event ) {
				event.preventDefault();
			}
			const { url } = this.state;
			const { setAttributes } = this.props;
			this.setState( { editingURL: false } );
			setAttributes( { url } );
		}

		/**
		 * Gets the appropriate CSS class names to enforce an aspect ratio when the embed is resized
		 * if the HTML has an iframe with width and height set.
		 *
		 * @param {string} html The preview HTML that possibly contains an iframe with width and height set.
		 * @param {boolean} allowResponsive If the classes should be added, or removed.
		 * @return {Object} Object with classnames set for use with `classnames`.
		 */
		getAspectRatioClassNames( html, allowResponsive = true ) {
			const previewDocument = document.implementation.createHTMLDocument( '' );
			previewDocument.body.innerHTML = html;
			const iframe = previewDocument.body.querySelector( 'iframe' );

			if ( iframe && iframe.height && iframe.width ) {
				const aspectRatio = ( iframe.width / iframe.height ).toFixed( 2 );
				// Given the actual aspect ratio, find the widest ratio to support it.
				for ( let ratioIndex = 0; ratioIndex < ASPECT_RATIOS.length; ratioIndex++ ) {
					const potentialRatio = ASPECT_RATIOS[ ratioIndex ];
					if ( aspectRatio >= potentialRatio.ratio ) {
						return {
							[ potentialRatio.className ]: allowResponsive,
							'wp-has-aspect-ratio': allowResponsive,
						};
					}
				}
			}

			return this.props.attributes.className;
		}

		/***
		 * Gets block attributes based on the preview and responsive state.
		 *
		 * @param {string} preview The preview data.
		 * @param {boolean} allowResponsive Apply responsive classes to fixed size content.
		 * @return {Object} Attributes and values.
		 */
		getAttributesFromPreview( preview, allowResponsive = true ) {
			const attributes = {};
			// Some plugins only return HTML with no type info, so default this to 'rich'.
			let { type = 'rich' } = preview;
			// If we got a provider name from the API, use it for the slug, otherwise we use the title,
			// because not all embed code gives us a provider name.
			const { html, provider_name: providerName } = preview;
			const providerNameSlug = kebabCase( toLower( '' !== providerName ? providerName : title ) );

			if ( isFromWordPress( html ) ) {
				type = 'wp-embed';
			}

			if ( html || 'photo' === type ) {
				attributes.type = type;
				attributes.providerNameSlug = providerNameSlug;
			}

			attributes.className = classnames(
				this.props.attributes.className,
				this.getAspectRatioClassNames( html, allowResponsive )
			);

			return attributes;
		}

		/***
		 * Sets block attributes based on the preview data.
		 */
		setAttributesFromPreview() {
			const { setAttributes, preview } = this.props;
			const { allowResponsive } = this.props.attributes;
			setAttributes( this.getAttributesFromPreview( preview, allowResponsive ) );
		}

		switchBackToURLInput() {
			this.setState( { editingURL: true } );
		}

		getResponsiveHelp( checked ) {
			return checked ? __( 'Videos and other content automatically resizes.' ) : __( 'Content is fixed size.' );
		}

		toggleResponsive() {
			const { allowResponsive, className } = this.props.attributes;
			const { html } = this.props.preview;
			const responsiveClassNames = this.getAspectRatioClassNames( html, ! allowResponsive );

			this.props.setAttributes(
				{
					allowResponsive: ! allowResponsive,
					className: classnames( className, responsiveClassNames ),
				}
			);
		}

		render() {
			const { url, editingURL } = this.state;
			const { caption, type, allowResponsive } = this.props.attributes;
			const { fetching, setAttributes, isSelected, className, preview, cannotEmbed, supportsResponsive } = this.props;

			if ( fetching ) {
				return (
					<EmbedLoading />
				);
			}

			// translators: %s: type of embed e.g: "YouTube", "Twitter", etc. "Embed" is used when no specific type exists
			const label = sprintf( __( '%s URL' ), title );

			// No preview, or we can't embed the current URL, or we've clicked the edit button.
			if ( ! preview || cannotEmbed || editingURL ) {
				return (
					<EmbedEditUrl
						icon={ icon }
						label={ label }
						onSubmit={ this.setUrl }
						value={ url }
						cannotEmbed={ cannotEmbed }
						onChange={ ( event ) => this.setState( { url: event.target.value } ) }
					/>
				);
			}

			return (
				<Fragment>
					<EmbedControls
						showEditButton={ preview && ! cannotEmbed }
						supportsResponsive={ supportsResponsive }
						allowResponsive={ allowResponsive }
						getResponsiveHelp={ this.getResponsiveHelp }
						toggleResponsive={ this.toggleResponsive }
						switchBackToURLInput={ this.switchBackToURLInput }
					/>
					<EmbedPreview
						preview={ preview }
						className={ className }
						url={ url }
						type={ type }
						caption={ caption }
						onCaptionChange={ ( value ) => setAttributes( { caption: value } ) }
						isSelected={ isSelected }
						icon={ icon }
						label={ label }
					/>
				</Fragment>
			);
		}
	};
}
