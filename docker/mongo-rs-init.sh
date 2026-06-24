#!/bin/bash
# Waits for mongod, then initiates a single-node replica set (required for transactions).
set -euo pipefail

connect_host="${MONGO_CONNECT_HOST:-${MONGO_HOST:-mongo:27017}}"
rs_host="${MONGO_RS_HOST:-$connect_host}"

until mongosh --host "$connect_host" --quiet --eval 'db.adminCommand({ ping: 1 }).ok' | grep -q 1; do
	sleep 1
done

mongosh --host "$connect_host" --quiet --eval "
try {
	if (rs.status().ok) {
		print('Replica set already initiated');
		quit(0);
	}
} catch (e) {}

rs.initiate({
	_id: 'rs0',
	members: [{ _id: 0, host: '$rs_host' }]
});
"

until mongosh --host "$connect_host" --quiet --eval 'rs.isMaster().ismaster' | grep -q true; do
	sleep 1
done

echo 'Replica set primary ready'
