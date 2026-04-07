/**
 * Marketplace update check endpoint
 *
 * GET /_emdash/api/admin/plugins/updates - Check for marketplace plugin updates
 */

import type { APIRoute } from "astro";

import { requirePerm } from "#api/authorize.js";
import { apiError, unwrapResult } from "#api/error.js";
import { handleMarketplaceUpdateCheck } from "#api/index.js";
import { resolveMarketplaceUrl } from "#settings/marketplace.js";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
	const { emdash, user } = locals;

	if (!emdash?.db) {
		return apiError("NOT_CONFIGURED", "EmDash is not initialized", 500);
	}

	const denied = requirePerm(user, "plugins:read");
	if (denied) return denied;
	const marketplaceUrl = await resolveMarketplaceUrl(emdash.db, emdash.config.marketplace);

	const result = await handleMarketplaceUpdateCheck(emdash.db, marketplaceUrl);

	return unwrapResult(result);
};
