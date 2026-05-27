import EloRank from 'elo-rank';

const elo = new EloRank(32);

/**
 * @typedef {{ before: number, after: number }} RatingChange
 * @typedef {{ white: RatingChange, black: RatingChange }} EloResult
 */

/**
 * Compute Elo rating changes.
 * @param {number} whiteRating
 * @param {number} blackRating
 * @param {'white' | 'black' | 'draw'} result
 * @returns {EloResult}
 */
export function computeElo(whiteRating, blackRating, result) {
	const expectedWhite = elo.getExpected(whiteRating, blackRating);
	const expectedBlack = elo.getExpected(blackRating, whiteRating);

	let scoreWhite, scoreBlack;
	if (result === 'white') {
		scoreWhite = 1;
		scoreBlack = 0;
	} else if (result === 'black') {
		scoreWhite = 0;
		scoreBlack = 1;
	} else {
		scoreWhite = 0.5;
		scoreBlack = 0.5;
	}

	const newWhite = elo.updateRating(expectedWhite, scoreWhite, whiteRating);
	const newBlack = elo.updateRating(expectedBlack, scoreBlack, blackRating);

	return {
		white: { before: whiteRating, after: newWhite },
		black: { before: blackRating, after: newBlack }
	};
}
