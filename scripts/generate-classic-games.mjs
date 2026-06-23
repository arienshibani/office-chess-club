#!/usr/bin/env node
/**
 * Regenerates scripts/data/classic-games.js from PGN Mentor archives (public-domain game records).
 * Requires: curl, unzip, and downloaded zips in /tmp (script fetches them).
 *
 *   node scripts/generate-classic-games.mjs
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';

const ZIP_URLS = {
	anderssen: 'https://www.pgnmentor.com/players/Anderssen.zip',
	morphy: 'https://www.pgnmentor.com/players/Morphy.zip',
	fischer: 'https://www.pgnmentor.com/players/Fischer.zip',
	steinitz: 'https://www.pgnmentor.com/players/Steinitz.zip',
	capa: 'https://www.pgnmentor.com/players/Capablanca.zip',
};

/** @param {string} url @param {string} dest */
const fetchZip = (url, dest) => {
	execSync(`curl -fsSL "${url}" -o "${dest}"`);
};

const parseGames = (text) =>
	text.split(/\r?\n\r?\n(?=\[Event)/).filter((b) => b.trim().startsWith('[Event'));

/** @param {string} path */
const loadZip = (path) =>
	execSync(`unzip -p "${path}"`, { maxBuffer: 50 * 1024 * 1024 }).toString();

for (const [name, url] of Object.entries(ZIP_URLS)) {
	fetchZip(url, `/tmp/${name}-pgn.zip`);
}

const allGames = Object.keys(ZIP_URLS).flatMap((name) =>
	parseGames(loadZip(`/tmp/${name}-pgn.zip`)),
);

/** @param {(pgn: string) => boolean} pred */
const pick = (pred) => allGames.find(pred);

/** @type {Array<{ title: string, result: string, timeFormat: string, pgn?: string }>} */
const specs = [
	{
		title: 'Opera Game (Morphy, 1858)',
		result: 'white',
		timeFormat: '600+5',
		pgn: pick(
			(p) =>
				/\[Event "Paris it"\]/.test(p) &&
				/Duke Karl Count Isouard/.test(p) &&
				/Morphy, Paul/.test(p),
		),
	},
	{
		title: 'The Immortal Game (Anderssen, 1851)',
		result: 'white',
		timeFormat: '900+10',
		pgn: pick((p) => /Immortal game/.test(p)),
	},
	{
		title: 'Evergreen Game (Anderssen, 1852)',
		result: 'white',
		timeFormat: '600+5',
		pgn: pick((p) => /Evergreen/.test(p)),
	},
	{
		title: 'Steinitz–Bardeleben (Hastings, 1895)',
		result: 'white',
		timeFormat: '900+10',
		pgn: pick((p) => /Steinitz/.test(p) && /Bardeleben/.test(p) && /Hastings/.test(p)),
	},
	{
		title: 'Game of the Century (Fischer, 1956)',
		result: 'black',
		timeFormat: '1800+0',
		pgn: pick(
			(p) =>
				/Byrne, Donald/.test(p) &&
				/Fischer, Robert James/.test(p) &&
				p.replace(/\s+/g, '').includes('1.Nf3Nf62.c4g6') &&
				/\[Result "0-1"\]/.test(p),
		),
	},
	{
		title: 'Capablanca–Tartakower (New York, 1924)',
		result: 'white',
		timeFormat: '600+0',
		pgn: pick((p) => /Capablanca/.test(p) && /Tartakower/.test(p) && /1924/.test(p)),
	},
	{
		title: "Legal's Mate (Paris, 1750)",
		result: 'white',
		timeFormat: '300+0',
		pgn: `[Event "Paris"]
[Site "Paris FRA"]
[Date "1750"]
[White "de Legal"]
[Black "Saint Brie"]
[Result "1-0"]

1.e4 e5 2.Nf3 d6 3.Bc4 Bg4 4.Nc3 g6 5.Nxe5 Bxd1 6.Bxf7+ Ke7 7.Nd5# 1-0`,
	},
	{
		title: 'Anderssen–Dufresne draw (Berlin, 1851)',
		result: 'draw',
		timeFormat: '300+3',
		pgn: pick(
			(p) =>
				/\[Event "Berlin m2"\]/.test(p) &&
				/Anderssen, Adolf/.test(p) &&
				/Dufresne, Jean/.test(p) &&
				/\[Result "1\/2-1\/2"\]/.test(p),
		),
	},
];

/** @type {Array<{ title: string, result: string, timeFormat: string, pgn: string }>} */
const games = [];

for (const spec of specs) {
	if (!spec.pgn) throw new Error(`Missing PGN for ${spec.title}`);
	const chess = new Chess();
	chess.loadPgn(spec.pgn);
	games.push({
		title: spec.title,
		result: spec.result,
		timeFormat: spec.timeFormat,
		pgn: spec.pgn.trim(),
	});
	console.log(`validated: ${spec.title} (${chess.history().length} moves)`);
}

let out =
	"/** Famous public-domain games for local dev seeding. `result` is from White's perspective. */\nexport const CLASSIC_GAMES = [\n";
for (const game of games) {
	const escaped = game.pgn.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
	out += `\t{\n\t\ttitle: ${JSON.stringify(game.title)},\n\t\tresult: '${game.result}',\n\t\ttimeFormat: '${game.timeFormat}',\n\t\tpgn: \`${escaped}\`,\n\t},\n`;
}
out += '];\n';

writeFileSync(new URL('./data/classic-games.js', import.meta.url), out);
console.log('Wrote scripts/data/classic-games.js');
