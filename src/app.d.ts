// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
	namespace App {
		interface Locals {
			user: {
				_id: string;
				slackId: string;
				name: string;
				avatarUrl: string;
				rating: number;
				isAdmin: boolean;
				stats: { wins: number; losses: number; draws: number };
			} | null;
		}
		interface PageData {
			user?: App.Locals['user'];
		}
	}
}

export {};
