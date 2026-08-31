// Legacy helper — not mounted in compose.yml (replica set must be primary before writes).
// Collections and indexes are created by ensureIndexes() on first app request.
db = db.getSiblingDB('chess-club');

db.createCollection('players');
db.createCollection('matches');
db.createCollection('config');
