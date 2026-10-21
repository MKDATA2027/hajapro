import type { NextConfig } from "next";

function getServerActionAllowedOrigins() {
	const allowedOrigins = new Set<string>();
	const appUrl = process.env.NEXT_PUBLIC_APP_URL;

	if (appUrl) {
		try {
			allowedOrigins.add(new URL(appUrl).host);
		} catch {
			// Ignore an invalid optional app URL; development origins still apply.
		}
	}

	if (process.env.NODE_ENV === "development") {
		allowedOrigins.add("localhost:3000");
		allowedOrigins.add("localhost:3001");
		// GitHub Codespaces forwards development requests through this host pattern.
		allowedOrigins.add("*.app.github.dev");
	}

	return [...allowedOrigins];
}

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			allowedOrigins: getServerActionAllowedOrigins(),
		},
	},
};

export default nextConfig;
