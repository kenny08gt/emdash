import { describe, it, expect } from "vitest";

import { contentUpdateBody, httpUrl, settingsUpdateBody } from "../../../src/api/schemas/index.js";

describe("contentUpdateBody schema", () => {
	it("should pass through skipRevision when present", () => {
		const input = {
			data: { title: "Hello" },
			skipRevision: true,
		};
		const result = contentUpdateBody.parse(input);
		expect(result.skipRevision).toBe(true);
	});

	it("should accept updates without skipRevision", () => {
		const input = {
			data: { title: "Hello" },
		};
		const result = contentUpdateBody.parse(input);
		expect(result.skipRevision).toBeUndefined();
	});
});

describe("httpUrl validator", () => {
	it("accepts http URLs", () => {
		expect(httpUrl.parse("http://example.com")).toBe("http://example.com");
	});

	it("accepts https URLs", () => {
		expect(httpUrl.parse("https://example.com/path?q=1")).toBe("https://example.com/path?q=1");
	});

	it("rejects javascript: URIs", () => {
		expect(() => httpUrl.parse("javascript:alert(1)")).toThrow();
	});

	it("rejects data: URIs", () => {
		expect(() => httpUrl.parse("data:text/html,<script>alert(1)</script>")).toThrow();
	});

	it("rejects ftp: URIs", () => {
		expect(() => httpUrl.parse("ftp://example.com")).toThrow();
	});

	it("rejects empty string", () => {
		expect(() => httpUrl.parse("")).toThrow();
	});

	it("rejects non-URL strings", () => {
		expect(() => httpUrl.parse("not a url")).toThrow();
	});

	it("is case-insensitive for scheme", () => {
		expect(httpUrl.parse("HTTPS://EXAMPLE.COM")).toBe("HTTPS://EXAMPLE.COM");
	});
});

describe("settingsUpdateBody marketplace validation", () => {
	it("accepts marketplace registries with https URLs", () => {
		const parsed = settingsUpdateBody.parse({
			marketplace: {
				registries: [
					{
						id: "official",
						label: "Official",
						url: "https://marketplace.emdashcms.com",
					},
				],
				activeRegistryId: "official",
			},
		});
		expect(parsed.marketplace?.registries[0]?.url).toBe("https://marketplace.emdashcms.com");
	});

	it("accepts localhost http URLs for development", () => {
		const parsed = settingsUpdateBody.parse({
			marketplace: {
				registries: [{ id: "local", label: "Local", url: "http://localhost:8787" }],
			},
		});
		expect(parsed.marketplace?.registries[0]?.url).toBe("http://localhost:8787");
	});

	it("rejects non-localhost http URLs", () => {
		expect(() =>
			settingsUpdateBody.parse({
				marketplace: {
					registries: [{ id: "bad", label: "Bad", url: "http://example.com" }],
				},
			}),
		).toThrow();
	});

	it("rejects activeRegistryId that does not exist in registries", () => {
		expect(() =>
			settingsUpdateBody.parse({
				marketplace: {
					registries: [{ id: "official", label: "Official", url: "https://example.com" }],
					activeRegistryId: "missing",
				},
			}),
		).toThrow();
	});
});
