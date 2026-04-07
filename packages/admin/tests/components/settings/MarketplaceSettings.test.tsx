import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { SiteSettings } from "../../../src/lib/api/settings";

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual("@tanstack/react-router");
	return {
		...actual,
		Link: ({ children, to, ...props }: any) => (
			<a href={to} {...props}>
				{children}
			</a>
		),
		useNavigate: () => vi.fn(),
	};
});

const mockFetchSettings = vi.fn<() => Promise<Partial<SiteSettings>>>();
const mockUpdateSettings = vi.fn<() => Promise<Partial<SiteSettings>>>();

vi.mock("../../../src/lib/api", async () => {
	const actual = await vi.importActual("../../../src/lib/api");
	return {
		...actual,
		fetchSettings: (...args: unknown[]) => mockFetchSettings(...(args as [])),
		updateSettings: (...args: unknown[]) => mockUpdateSettings(...(args as [])),
	};
});

const { MarketplaceSettings } =
	await import("../../../src/components/settings/MarketplaceSettings");

function Wrapper({ children }: { children: React.ReactNode }) {
	const qc = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("MarketplaceSettings", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchSettings.mockResolvedValue({
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
		mockUpdateSettings.mockResolvedValue({});
	});

	it("renders saved registries", async () => {
		const screen = await render(
			<Wrapper>
				<MarketplaceSettings />
			</Wrapper>,
		);
		await expect.element(screen.getByText("Marketplace Settings")).toBeInTheDocument();
		await expect.element(screen.getByText("Official")).toBeInTheDocument();
		await expect.element(screen.getByText("https://marketplace.emdashcms.com")).toBeInTheDocument();
	});

	it("shows validation error for invalid registry URL", async () => {
		mockFetchSettings.mockResolvedValue({
			marketplace: { registries: [], activeRegistryId: undefined },
		});
		const screen = await render(
			<Wrapper>
				<MarketplaceSettings />
			</Wrapper>,
		);

		await expect.element(screen.getByText("Marketplace Settings")).toBeInTheDocument();
		const label = screen.getByLabelText("Label");
		const url = screen.getByLabelText("URL");
		await label.fill("My Registry");
		await url.fill("http://example.com");
		await screen.getByRole("button", { name: "Add" }).click();

		await expect
			.element(screen.getByText("Marketplace URL must use HTTPS or localhost HTTP"))
			.toBeInTheDocument();
	});

	it("saves registries and active selection", async () => {
		const screen = await render(
			<Wrapper>
				<MarketplaceSettings />
			</Wrapper>,
		);
		await expect.element(screen.getByText("Marketplace Settings")).toBeInTheDocument();
		await screen.getByRole("button", { name: "Save Marketplace Settings" }).click();

		await vi.waitFor(() => {
			expect(mockUpdateSettings).toHaveBeenCalledWith({
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
		});
	});
});
