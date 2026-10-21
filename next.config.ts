import type { NextConfig } from "next";

function getServerActionAllowedOrigins() {
	const appUrl = process.env.NEXT_PUBLIC_APP_URL;
	if (!appUrl) return [];

	try {
		const allowedOrigins = new Set([new URL(appUrl).host]);
		if (process.env.NODE_ENV === "development") {
			allowedOrigins.add("localhost:3000");
			allowedOrigins.add("localhost:3001");
			// GitHub Codespaces forwards the dev server through this host pattern.
			allowedOrigins.add("*.app.github.dev");
		}
		return [...allowedOrigins];
	} catch {
		return [];
	}
}

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			allowedOrigins: getServerActionAllowedOrigins(),
		},
	},
};

export default nextConfig;