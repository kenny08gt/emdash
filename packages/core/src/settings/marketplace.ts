import type { Kysely } from "kysely";

import type { Database } from "../database/types.js";
import { getSiteSettingWithDb } from "./index.js";
import type { MarketplaceRegistry, MarketplaceSettings } from "./types.js";

function isLocalMarketplaceHost(hostname: string): boolean {
	return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * Validate a marketplace URL using the same policy as integration config:
 * - HTTPS required in general
 * - HTTP allowed only for localhost/127.0.0.1 during development
 */
export function isValidMarketplaceUrl(url: string, allowLocalhost = import.meta.env.DEV): boolean {
	try {
		const parsed = new URL(url);
		if (parsed.protocol === "https:") return true;
		return allowLocalhost && parsed.protocol === "http:" && isLocalMarketplaceHost(parsed.hostname);
	} catch {
		return false;
	}
}

function findRegistryById(
	settings: MarketplaceSettings | undefined,
	id: string | undefined,
): MarketplaceRegistry | undefined {
	if (!settings?.registries?.length || !id) return undefined;
	return settings.registries.find((registry) => registry.id === id);
}

/**
 * Resolve the active marketplace URL from marketplace settings.
 *
 * Resolution strategy:
 * 1) activeRegistryId match
 * 2) first configured registry
 */
export function resolveMarketplaceUrlFromSettings(
	settings: MarketplaceSettings | undefined,
): string | undefined {
	if (!settings?.registries?.length) return undefined;

	const byId = findRegistryById(settings, settings.activeRegistryId);
	if (byId?.url && isValidMarketplaceUrl(byId.url)) {
		return byId.url;
	}

	for (const registry of settings.registries) {
		if (registry.url && isValidMarketplaceUrl(registry.url)) {
			return registry.url;
		}
	}

	return undefined;
}

/**
 * Resolve the effective marketplace URL with precedence:
 * admin site setting > integration config fallback.
 */
export async function resolveMarketplaceUrl(
	db: Kysely<Database>,
	configMarketplaceUrl?: string,
): Promise<string | undefined> {
	try {
		const marketplaceSettings = await getSiteSettingWithDb("marketplace", db);
		const settingsUrl = resolveMarketplaceUrlFromSettings(marketplaceSettings);
		if (settingsUrl) return settingsUrl;
	} catch {
		// Fallback to integration config if settings cannot be read.
	}

	if (configMarketplaceUrl && isValidMarketplaceUrl(configMarketplaceUrl)) {
		return configMarketplaceUrl;
	}

	return undefined;
}
