import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export const GET = async ({ url }) => {
	const openApi = {
		openapi: '3.1.0',
		info: {
			title: 'Office Chess Club API',
			version: '1.0.0',
			description:
				'Administrative and integration endpoints for automated match submission and player lookup.',
		},
		servers: [{ url: url.origin }],
		components: {
			securitySchemes: {
				BearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'API Key',
					description: 'Use the same API key from Admin > HTTP Match Submission.',
				},
			},
		},
		paths: {
			'/api/matches': {
				post: {
					tags: ['Integrations'],
					summary: 'Submit a match result',
					security: [{ BearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: {
									type: 'object',
									required: ['whitePlayerId', 'blackPlayerId', 'result', 'notation'],
									properties: {
										whitePlayerId: {
											type: 'string',
											description: 'Mongo ObjectId string of white player',
										},
										blackPlayerId: {
											type: 'string',
											description: 'Mongo ObjectId string of black player',
										},
										result: { type: 'string', enum: ['white', 'black', 'draw'] },
										notation: { type: 'string', description: 'PGN or FEN string' },
										timeFormat: {
											type: 'string',
											description: 'Optional, defaults to 600+5 when omitted',
											example: '600+0',
										},
									},
								},
							},
						},
					},
					responses: {
						201: {
							description: 'Match accepted',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										properties: {
											ok: { type: 'boolean' },
											matchId: { type: 'string' },
											status: { type: 'string', enum: ['approved', 'pending'] },
										},
									},
								},
							},
						},
						400: { description: 'Validation error' },
						401: { description: 'Invalid API key' },
						503: { description: 'HTTP submission API is disabled or not configured' },
					},
				},
			},
			'/api/players': {
				get: {
					tags: ['Integrations'],
					summary: 'List registered users/players',
					security: [{ BearerAuth: [] }],
					responses: {
						200: {
							description: 'List of registered players',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										properties: {
											ok: { type: 'boolean' },
											players: {
												type: 'array',
												items: {
													type: 'object',
													properties: {
														_id: { type: 'string' },
														name: { type: 'string' },
														username: { type: 'string' },
														rating: { type: 'number' },
														status: { type: 'string', enum: ['pending', 'member'] },
														isAdmin: { type: 'boolean' },
														createdAt: { type: ['string', 'null'], format: 'date-time' },
													},
												},
											},
										},
									},
								},
							},
						},
						401: { description: 'Invalid API key' },
						503: { description: 'HTTP submission API is disabled or not configured' },
					},
				},
			},
			'/api/theme': {
				post: {
					tags: ['User Settings'],
					summary: 'Update current user theme',
					description: 'Requires a logged-in browser session (cookie auth), not API key auth.',
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										theme: {
											type: 'string',
											enum: ['dark', 'light', 'auto'],
										},
									},
								},
							},
						},
					},
					responses: {
						200: { description: 'Theme saved' },
						401: { description: 'Not authenticated' },
					},
				},
			},
		},
	};

	return json(openApi);
};
