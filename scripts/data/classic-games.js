/** Famous public-domain games for local dev seeding. `result` is from White's perspective. */
export const CLASSIC_GAMES = [
	{
		title: 'Opera Game (Morphy, 1858)',
		result: 'white',
		timeFormat: '600+5',
		pgn: `[Event "Paris it"]
[Site "Paris"]
[Date "1858.??.??"]
[Round "?"]
[White "Morphy, Paul "]
[Black "Duke Karl Count Isouard"]
[Result "1-0"]
[WhiteElo ""]
[BlackElo ""]
[ECO "C41"]

1.e4 e5 2.Nf3 d6 3.d4 Bg4 4.dxe5 Bxf3 5.Qxf3 dxe5 6.Bc4 Nf6 7.Qb3 Qe7 8.Nc3 c6
9.Bg5 b5 10.Nxb5 cxb5 11.Bxb5+ Nbd7 12.O-O-O Rd8 13.Rxd7 Rxd7 14.Rd1 Qe6
15.Bxd7+ Nxd7 16.Qb8+ Nxb8 17.Rd8+  1-0`,
	},
	{
		title: 'The Immortal Game (Anderssen, 1851)',
		result: 'white',
		timeFormat: '900+10',
		pgn: `[Event "London 'Immortal game'"]
[Site "London"]
[Date "1851.??.??"]
[Round "?"]
[White "Anderssen, Adolf"]
[Black "Kieseritzky, Lionel"]
[Result "1-0"]
[WhiteElo ""]
[BlackElo ""]
[ECO "C33"]

1.e4 e5 2.f4 exf4 3.Bc4 Qh4+ 4.Kf1 b5 5.Bxb5 Nf6 6.Nf3 Qh6 7.d3 Nh5 8.Nh4 Qg5
9.Nf5 c6 10.g4 Nf6 11.Rg1 cxb5 12.h4 Qg6 13.h5 Qg5 14.Qf3 Ng8 15.Bxf4 Qf6
16.Nc3 Bc5 17.Nd5 Qxb2 18.Bd6 Bxg1 19.e5 Qxa1+ 20.Ke2 Na6 21.Nxg7+ Kd8 22.Qf6+ Nxf6
23.Be7+  1-0`,
	},
	{
		title: 'Evergreen Game (Anderssen, 1852)',
		result: 'white',
		timeFormat: '600+5',
		pgn: `[Event "Berlin 'Evergreen'"]
[Site "Berlin"]
[Date "1852.??.??"]
[Round "?"]
[White "Anderssen, Adolf"]
[Black "Dufresne, Jean"]
[Result "1-0"]
[WhiteElo ""]
[BlackElo ""]
[ECO "C52"]

1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4 Bxb4 5.c3 Ba5 6.d4 exd4 7.O-O d3 8.Qb3 Qf6
9.e5 Qg6 10.Re1 Nge7 11.Ba3 b5 12.Qxb5 Rb8 13.Qa4 Bb6 14.Nbd2 Bb7 15.Ne4 Qf5
16.Bxd3 Qh5 17.Nf6+ gxf6 18.exf6 Rg8 19.Rad1 Qxf3 20.Rxe7+ Nxe7 21.Qxd7+ Kxd7
22.Bf5+ Ke8 23.Bd7+ Kf8 24.Bxe7+  1-0`,
	},
	{
		title: 'Steinitz–Bardeleben (Hastings, 1895)',
		result: 'white',
		timeFormat: '900+10',
		pgn: `[Event "Hastings"]
[Site "Hastings"]
[Date "1895.??.??"]
[Round "?"]
[White "Steinitz, William"]
[Black "Von Bardeleben, Curt"]
[Result "1-0"]
[WhiteElo ""]
[BlackElo ""]
[ECO "C54"]

1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d4 exd4 6.cxd4 Bb4+ 7.Nc3 d5 8.exd5 Nxd5
9.O-O Be6 10.Bg5 Be7 11.Bxd5 Bxd5 12.Nxd5 Qxd5 13.Bxe7 Nxe7 14.Re1 f6 15.Qe2 Qd7
16.Rac1 c6 17.d5 cxd5 18.Nd4 Kf7 19.Ne6 Rhc8 20.Qg4 g6 21.Ng5+ Ke8 22.Rxe7+ Kf8
23.Rf7+ Kg8 24.Rg7+ Kh8 25.Rxh7+  1-0`,
	},
	{
		title: 'Game of the Century (Fischer, 1956)',
		result: 'black',
		timeFormat: '1800+0',
		pgn: `[Event "New York Rosenwald"]
[Site "New York"]
[Date "1956.??.??"]
[Round "?"]
[White "Byrne, Donald"]
[Black "Fischer, Robert James"]
[Result "0-1"]
[WhiteElo ""]
[BlackElo ""]
[ECO "D97"]

1.Nf3 Nf6 2.c4 g6 3.Nc3 Bg7 4.d4 O-O 5.Bf4 d5 6.Qb3 dxc4 7.Qxc4 c6 8.e4 Nbd7
9.Rd1 Nb6 10.Qc5 Bg4 11.Bg5 Na4 12.Qa3 Nxc3 13.bxc3 Nxe4 14.Bxe7 Qb6 15.Bc4 Nxc3
16.Bc5 Rfe8+ 17.Kf1 Be6 18.Bxb6 Bxc4+ 19.Kg1 Ne2+ 20.Kf1 Nxd4+ 21.Kg1 Ne2+
22.Kf1 Nc3+ 23.Kg1 axb6 24.Qb4 Ra4 25.Qxb6 Nxd1 26.h3 Rxa2 27.Kh2 Nxf2 28.Re1 Rxe1
29.Qd8+ Bf8 30.Nxe1 Bd5 31.Nf3 Ne4 32.Qb8 b5 33.h4 h5 34.Ne5 Kg7 35.Kg1 Bc5+
36.Kf1 Ng3+ 37.Ke1 Bb4+ 38.Kd1 Bb3+ 39.Kc1 Ne2+ 40.Kb1 Nc3+ 41.Kc1 Rc2+  0-1`,
	},
	{
		title: 'Capablanca–Tartakower (New York, 1924)',
		result: 'white',
		timeFormat: '600+0',
		pgn: `[Event "New York"]
[Site "New York"]
[Date "1924.??.??"]
[Round "?"]
[White "Tartakower, Saviely"]
[Black "Capablanca, Jose Raul"]
[Result "0-1"]
[WhiteElo ""]
[BlackElo ""]
[ECO "C33"]

1.e4 e5 2.f4 exf4 3.Be2 d5 4.exd5 Nf6 5.c4 c6 6.d4 Bb4+ 7.Kf1 cxd5 8.Bxf4 dxc4
9.Bxb8 Nd5 10.Kf2 Rxb8 11.Bxc4 O-O 12.Nf3 Nf6 13.Nc3 b5 14.Bd3 Ng4+ 15.Kg1 Bb7
16.Bf5 Bxf3 17.gxf3 Ne3 18.Bxh7+ Kh8 19.Qd3 Bxc3 20.bxc3 Nd5 21.Be4 Nf4 22.Qd2 Qh4
23.Kf1 f5 24.Bc6 Rf6 25.d5 Rd8 26.Rd1 Rxc6 27.dxc6 Rxd2 28.Rxd2 Ne6 29.Rd6 Qc4+
30.Kg2 Qe2+  0-1`,
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
		pgn: `[Event "Berlin m2"]
[Site "Berlin"]
[Date "1851.??.??"]
[Round "?"]
[White "Anderssen, Adolf"]
[Black "Dufresne, Jean"]
[Result "1/2-1/2"]
[WhiteElo ""]
[BlackElo ""]
[ECO "B44"]

1.e4 c5 2.d4 cxd4 3.Nf3 Nc6 4.Nxd4 e6 5.Nf3 Nge7 6.Bd3 Ng6 7.O-O Bc5 8.Nc3 a6
9.Ne2 O-O 10.Ng3 d6 11.Kh1 Kh8 12.Ng5 h6 13.Qh5 Kg8 14.Nf3 Qf6 15.Rb1 Nce5
16.Nxe5 Qxe5 17.Qg4 Qf6 18.f4 Qh4 19.Qe2 Bd7 20.f5 exf5 21.exf5 Rae8 22.Qd1 Ne5
23.Rf4 Nxd3 24.cxd3 Qd8 25.d4 Bb4 26.Bd2 Qa5 27.Bxb4 Qxb4 28.Nh5 f6 29.a3 Qc4
30.h3 Qe2 31.Qb3+ Rf7 32.Rg4 Kf8 33.Qg3 Re3 34.Qxd6+ Kg8 35.Nxf6+ Rxf6 36.Qxf6 Rxh3+
37.gxh3 Bc6+ 38.Qxc6 bxc6 39.Rbg1 Qf3+ 40.Kh2 Qxf5 41.Rxg7+ Kf8 42.Rg8+ Ke7
43.R1g7+ Ke6 44.Re8+ Kd6 45.Rd8+ Ke6  1/2-1/2`,
	},
];
