/**
 * Site Settings Types
 *
 * Global configuration for the site (title, logo, social links, etc.)
 */

/** Media reference for logo/favicon */
export interface MediaReference {
	mediaId: string;
	alt?: string;
}

/** Site-level SEO settings */
export interface SeoSettings {
	/** Separator between page title and site title (e.g., " | ", " — ") */
	titleSeparator?: string;
	/** Default OG image when content has no seo_image */
	defaultOgImage?: MediaReference;
	/** Custom robots.txt content. If unset, a default is generated. */
	robotsTxt?: string;
	/** Google Search Console verification meta tag content */
	googleVerification?: string;
	/** Bing Webmaster Tools verification meta tag content */
	bingVerification?: string;
}

/** Marketplace registry entry */
export interface MarketplaceRegistry {
	/** Stable identifier for selecting this registry as active */
	id: string;
	/** Human-readable label shown in admin UI */
	label: string;
	/** Marketplace base URL (e.g. https://marketplace.emdashcms.com) */
	url: string;
}

/** Marketplace configuration stored in site settings */
export interface MarketplaceSettings {
	/** Available registry entries */
	registries: MarketplaceRegistry[];
	/** Selected active registry ID */
	activeRegistryId?: string;
}

/** Site settings schema */
export interface SiteSettings {
	// Identity
	title: string;
	tagline?: string;
	logo?: MediaReference;
	favicon?: MediaReference;

	// URLs
	url?: string;

	// Display
	postsPerPage: number;
	dateFormat: string;
	timezone: string;

	// Social
	social?: {
		twitter?: string;
		github?: string;
		facebook?: string;
		instagram?: string;
		linkedin?: string;
		youtube?: string;
	};

	// SEO
	seo?: SeoSettings;

	// Marketplace
	marketplace?: MarketplaceSettings;
}

/** Keys that are valid site settings */
export type SiteSettingKey = keyof SiteSettings;
