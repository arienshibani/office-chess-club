import { randomBytes } from "crypto";
import { SLACK_CLIENT_ID, SLACK_REDIRECT_URI } from "$env/static/private";
import { createPkcePair } from "$lib/pkce.js";

export const oauthCookieOpts = {
	path: "/",
	httpOnly: true,
	maxAge: 300,
	sameSite: /** @type {'lax'} */ ("lax"),
	secure: import.meta.env.PROD,
};

/** @param {import('@sveltejs/kit').Cookies} cookies */
export const beginSlackOAuth = (cookies) => {
	const state = randomBytes(16).toString("hex");
	const nonce = randomBytes(16).toString("hex");
	const { codeVerifier, codeChallenge } = createPkcePair();

	cookies.set("oauth_state", state, oauthCookieOpts);
	cookies.set("oauth_nonce", nonce, oauthCookieOpts);
	cookies.set("oauth_code_verifier", codeVerifier, oauthCookieOpts);

	// PKCE is required for this app (Slack marks it a public client; cannot be turned off).
	// Use oauth/v2/authorize directly — openid/connect/authorize redirects and drops code_challenge.
	const params = new URLSearchParams({
		client_id: SLACK_CLIENT_ID,
		user_scope: "openid profile",
		redirect_uri: SLACK_REDIRECT_URI,
		response_type: "code",
		openid_connect: "1",
		state,
		nonce,
		code_challenge: codeChallenge,
		code_challenge_method: "S256",
	});

	return `https://slack.com/oauth/v2/authorize?${params}`;
};
