// Runs once when the MongoDB data volume is first created (docker-entrypoint-initdb.d).
db = db.getSiblingDB('chess-club');

db.createCollection('players');
db.createCollection('matches');
db.createCollection('config');
