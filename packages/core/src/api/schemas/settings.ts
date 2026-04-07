import { z } from "zod";

import { isValidMarketplaceUrl } from "../../settings/marketplace.js";
import { httpUrl } from "./common.js";

// ---------------------------------------------------------------------------
// Settings: Input schemas
// ---------------------------------------------------------------------------

const mediaReference = z.object({
	mediaId: z.string(),
	alt: z.string().optional(),
});

const socialSettings = z.object({
	twitter: z.string().optional(),
	github: z.string().optional(),
	facebook: z.string().optional(),
	instagram: z.string().optional(),
	linkedin: z.string().optional(),
	youtube: z.string().optional(),
});

const seoSettings = z.object({
	titleSeparator: z.string().max(10).optional(),
	defaultOgImage: mediaReference.optional(),
	robotsTxt: z.string().max(5000).optional(),
	googleVerification: z.string().max(100).optional(),
	bingVerification: z.string().max(100).optional(),
});

const marketplaceRegistry = z.object({
	id: z.string().min(1),
	label: z.string().min(1),
	url: z
		.string()
		.url()
		.refine((url) => isValidMarketplaceUrl(url), {
			message: "Marketplace URL must use HTTPS or localhost HTTP",
		}),
});

const marketplaceSettings = z
	.object({
		registries: z.array(marketplaceRegistry).max(20),
		activeRegistryId: z.string().optional(),
	})
	.refine(
		(data) =>
			!data.activeRegistryId ||
			data.registries.some((registry) => registry.id === data.activeRegistryId),
		{
			message: "activeRegistryId must match a registry id",
			path: ["activeRegistryId"],
		},
	);

export const settingsUpdateBody = z
	.object({
		title: z.string().optional(),
		tagline: z.string().optional(),
		logo: mediaReference.optional(),
		favicon: mediaReference.optional(),
		url: z.union([httpUrl, z.literal("")]).optional(),
		postsPerPage: z.number().int().min(1).max(100).optional(),
		dateFormat: z.string().optional(),
		timezone: z.string().optional(),
		social: socialSettings.optional(),
		seo: seoSettings.optional(),
		marketplace: marketplaceSettings.optional(),
	})
	.meta({ id: "SettingsUpdateBody" });

// ---------------------------------------------------------------------------
// Settings: Response schemas
// ---------------------------------------------------------------------------

export const siteSettingsSchema = z
	.object({
		title: z.string().optional(),
		tagline: z.string().optional(),
		logo: mediaReference.optional(),
		favicon: mediaReference.optional(),
		url: z.string().optional(),
		postsPerPage: z.number().int().optional(),
		dateFormat: z.string().optional(),
		timezone: z.string().optional(),
		social: socialSettings.optional(),
		seo: seoSettings.optional(),
		marketplace: marketplaceSettings.optional(),
	})
	.meta({ id: "SiteSettings" });
