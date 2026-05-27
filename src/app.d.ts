// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
	namespace App {
		interface Locals {
			user: {
				_id: string;
				username: string;
				name: string;
				icon: string;
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
