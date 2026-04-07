/**
 * Plugin management single plugin endpoint
 *
 * GET /_emdash/api/admin/plugins/:id - Get plugin details
 */

import type { APIRoute } from "astro";

import { requirePerm } from "#api/authorize.js";
import { apiError, unwrapResult } from "#api/error.js";
import { handlePluginGet } from "#api/index.js";
import { resolveMarketplaceUrl } from "#settings/marketplace.js";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
	const { emdash, user } = locals;
	const { id } = params;

	if (!emdash?.db) {
		return apiError("NOT_CONFIGURED", "EmDash is not initialized", 500);
	}

	const denied = requirePerm(user, "plugins:read");
	if (denied) return denied;

	if (!id) {
		return apiError("INVALID_REQUEST", "Plugin ID required", 400);
	}
	const marketplaceUrl = await resolveMarketplaceUrl(emdash.db, emdash.config.marketplace);

	const result = await handlePluginGet(emdash.db, emdash.configuredPlugins, id, marketplaceUrl);

	return unwrapResult(result);
};
