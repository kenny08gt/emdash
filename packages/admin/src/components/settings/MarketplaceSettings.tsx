import { Button, Input } from "@cloudflare/kumo";
import { ArrowLeft, CheckCircle, Plus, Storefront, Trash } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import * as React from "react";

import { fetchSettings, updateSettings, type SiteSettings } from "../../lib/api";
import { DialogError, getMutationError } from "../DialogError.js";

function createRegistryId(): string {
	return `registry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isLocalEnvironment(): boolean {
	if (typeof window === "undefined") return false;
	return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

interface MarketplaceRegistryForm {
	id: string;
	label: string;
	url: string;
}

function isValidMarketplaceUrl(url: string, allowLocalhost = isLocalEnvironment()): boolean {
	try {
		const parsed = new URL(url);
		if (parsed.protocol === "https:") return true;
		const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
		return allowLocalhost && parsed.protocol === "http:" && isLocalhost;
	} catch {
		return false;
	}
}

export function MarketplaceSettings() {
	const queryClient = useQueryClient();
	const [saveStatus, setSaveStatus] = React.useState<string | null>(null);
	const [localError, setLocalError] = React.useState<string | null>(null);
	const [newLabel, setNewLabel] = React.useState("");
	const [newUrl, setNewUrl] = React.useState("");
	const [registries, setRegistries] = React.useState<MarketplaceRegistryForm[]>([]);
	const [activeRegistryId, setActiveRegistryId] = React.useState<string | undefined>(undefined);

	const { data: settings, isLoading } = useQuery({
		queryKey: ["settings"],
		queryFn: fetchSettings,
		staleTime: Infinity,
	});

	React.useEffect(() => {
		if (!settings?.marketplace) return;
		setRegistries(settings.marketplace.registries ?? []);
		setActiveRegistryId(settings.marketplace.activeRegistryId);
	}, [settings]);

	const saveMutation = useMutation({
		mutationFn: (data: Partial<SiteSettings>) => updateSettings(data),
		onSuccess: () => {
			setSaveStatus("Marketplace settings saved");
			setLocalError(null);
			void queryClient.invalidateQueries({ queryKey: ["settings"] });
			void queryClient.invalidateQueries({ queryKey: ["manifest"] });
		},
	});

	React.useEffect(() => {
		if (!saveStatus) return;
		const timer = setTimeout(setSaveStatus, 3000, null);
		return () => clearTimeout(timer);
	}, [saveStatus]);

	const addRegistry = () => {
		setLocalError(null);
		const label = newLabel.trim();
		const url = newUrl.trim();
		if (!label) {
			setLocalError("Registry label is required");
			return;
		}
		if (!url) {
			setLocalError("Registry URL is required");
			return;
		}
		if (!isValidMarketplaceUrl(url)) {
			setLocalError("Marketplace URL must use HTTPS, or localhost HTTP during local development");
			return;
		}
		const id = createRegistryId();
		setRegistries((prev) => [...prev, { id, label, url }]);
		if (!activeRegistryId) setActiveRegistryId(id);
		setNewLabel("");
		setNewUrl("");
	};

	const removeRegistry = (id: string) => {
		setRegistries((prev) => {
			const nextRegistries = prev.filter((registry) => registry.id !== id);
			if (activeRegistryId === id) {
				setActiveRegistryId(nextRegistries[0]?.id);
			}
			return nextRegistries;
		});
	};

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		setLocalError(null);
		for (const registry of registries) {
			if (!registry.label.trim()) {
				setLocalError("Registry label cannot be empty");
				return;
			}
			if (!isValidMarketplaceUrl(registry.url)) {
				setLocalError(`Invalid registry URL: ${registry.url}`);
				return;
			}
		}
		if (registries.length > 0 && !activeRegistryId) {
			setLocalError("Select an active registry");
			return;
		}
		if (activeRegistryId && !registries.some((registry) => registry.id === activeRegistryId)) {
			setLocalError("Active registry must match an existing entry");
			return;
		}

		saveMutation.mutate({
			marketplace: {
				registries,
				activeRegistryId,
			},
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Link to="/settings">
					<Button variant="ghost" shape="square" aria-label="Back to settings">
						<ArrowLeft className="h-4 w-4" />
					</Button>
				</Link>
				<h1 className="text-2xl font-bold">Marketplace Settings</h1>
			</div>

			<p className="text-kumo-subtle text-sm">
				Configure one or more marketplace registries and choose which one is active for plugin and
				theme browsing.
			</p>

			<div className="rounded-lg border border-kumo-border bg-kumo-base p-4 text-sm text-kumo-foreground">
				<p className="font-medium">How registry selection works</p>
				<p className="mt-1 text-kumo-subtle">
					Only one marketplace is active at a time. EmDash fetches plugin and theme listings from
					the selected registry only, and does not merge results across multiple registries.
				</p>
			</div>

			<div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
				<p className="font-medium">Security notice</p>
				<p className="mt-1">
					Only use the official EmDash marketplace URL or registries you fully trust. Marketplace
					requests are made by your server, so an untrusted registry can control metadata, downloads,
					and update responses.
				</p>
				<p className="mt-2">
					Use HTTPS for production registries. Localhost HTTP URLs are intended only for local
					development.
				</p>
			</div>

			{saveStatus && (
				<div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
					<CheckCircle className="h-4 w-4 flex-shrink-0" />
					{saveStatus}
				</div>
			)}

			<DialogError message={localError || getMutationError(saveMutation.error)} />

			{isLoading ? (
				<div className="rounded-lg border bg-kumo-base p-6 text-kumo-subtle">
					Loading settings...
				</div>
			) : (
				<form onSubmit={submit} className="space-y-6">
					<div className="rounded-lg border bg-kumo-base p-6 space-y-4">
						<h2 className="text-lg font-semibold flex items-center gap-2">
							<Storefront className="h-5 w-5" />
							Registries
						</h2>

						<div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
							<Input
								label="Label"
								placeholder="Official Marketplace"
								value={newLabel}
								onChange={(event) => setNewLabel(event.target.value)}
							/>
							<Input
								label="URL"
								type="url"
								placeholder="https://marketplace.emdashcms.com"
								value={newUrl}
								onChange={(event) => setNewUrl(event.target.value)}
							/>
							<div className="flex items-end">
								<Button type="button" variant="outline" icon={<Plus />} onClick={addRegistry}>
									Add
								</Button>
							</div>
						</div>

						<div className="space-y-3">
							{registries.length === 0 && (
								<p className="text-sm text-kumo-subtle">
									No registries configured yet. Add one to enable marketplace browsing.
								</p>
							)}
							{registries.length > 0 && (
								<div className="space-y-1">
									<p className="text-sm font-medium">Select the active marketplace</p>
									<p className="text-sm text-kumo-subtle">
										The selected registry is the only one used for plugin and theme browsing.
									</p>
								</div>
							)}
							{registries.map((registry) => (
								<div
									key={registry.id}
									className="rounded-md border border-kumo-border p-3 flex items-start justify-between gap-3"
								>
									<label className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer">
										<input
											type="radio"
											name="activeMarketplaceRegistry"
											checked={activeRegistryId === registry.id}
											onChange={() => setActiveRegistryId(registry.id)}
											className="mt-1"
										/>
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<p className="font-medium">{registry.label}</p>
												{activeRegistryId === registry.id && (
													<span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
														Active
													</span>
												)}
											</div>
											<p className="text-sm text-kumo-subtle break-all">{registry.url}</p>
										</div>
									</label>
									<Button
										type="button"
										variant="ghost"
										shape="square"
										aria-label={`Remove ${registry.label}`}
										onClick={() => removeRegistry(registry.id)}
									>
										<Trash className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					</div>

					<div className="flex justify-end">
						<Button type="submit" disabled={saveMutation.isPending}>
							{saveMutation.isPending ? "Saving..." : "Save Marketplace Settings"}
						</Button>
					</div>
				</form>
			)}
		</div>
	);
}

export default MarketplaceSettings;
