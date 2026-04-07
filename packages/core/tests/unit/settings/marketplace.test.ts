import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MarketplaceSettings } from "../../../src/settings/types.js";

const mockGetSiteSettingWithDb = vi.fn();

vi.mock("../../../src/settings/index.js", () => ({
	getSiteSettingWithDb: (...args: unknown[]) => mockGetSiteSettingWithDb(...args),
}));

const { isValidMarketplaceUrl, resolveMarketplaceUrl, resolveMarketplaceUrlFromSettings } =
	await import("../../../src/settings/marketplace.js");

describe("marketplace settings resolution", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("isValidMarketplaceUrl", () => {
		it("accepts https URLs", () => {
			expect(isValidMarketplaceUrl("https://marketplace.emdashcms.com")).toBe(true);
		});

		it("accepts localhost http URLs", () => {
			expect(isValidMarketplaceUrl("http://localhost:8787")).toBe(true);
			expect(isValidMarketplaceUrl("http://127.0.0.1:8787")).toBe(true);
		});

		it("rejects non-localhost http URLs", () => {
			expect(isValidMarketplaceUrl("http://example.com")).toBe(false);
		});
	});

	describe("resolveMarketplaceUrlFromSettings", () => {
		it("uses active registry URL when present", () => {
			const settings: MarketplaceSettings = {
				registries: [
					{ id: "a", label: "A", url: "https://a.example.com" },
					{ id: "b", label: "B", url: "https://b.example.com" },
				],
				activeRegistryId: "b",
			};

			expect(resolveMarketplaceUrlFromSettings(settings)).toBe("https://b.example.com");
		});

		it("falls back to first valid registry when active id is missing", () => {
			const settings: MarketplaceSettings = {
				registries: [
					{ id: "a", label: "A", url: "https://a.example.com" },
					{ id: "b", label: "B", url: "https://b.example.com" },
				],
			};

			expect(resolveMarketplaceUrlFromSettings(settings)).toBe("https://a.example.com");
		});
	});

	describe("resolveMarketplaceUrl", () => {
		it("prefers admin settings over config fallback", async () => {
			mockGetSiteSettingWithDb.mockResolvedValue({
				registries: [{ id: "custom", label: "Custom", url: "https://custom.example.com" }],
				activeRegistryId: "custom",
			});

			const url = await resolveMarketplaceUrl({} as never, "https://marketplace.emdashcms.com");
			expect(url).toBe("https://custom.example.com");
		});

		it("falls back to config URL when admin settings are absent", async () => {
			mockGetSiteSettingWithDb.mockResolvedValue(undefined);

			const url = await resolveMarketplaceUrl({} as never, "https://marketplace.emdashcms.com");
			expect(url).toBe("https://marketplace.emdashcms.com");
		});

		it("returns undefined when neither settings nor fallback are valid", async () => {
			mockGetSiteSettingWithDb.mockResolvedValue(undefined);

			const url = await resolveMarketplaceUrl({} as never, "http://example.com");
			expect(url).toBeUndefined();
		});
	});
});
