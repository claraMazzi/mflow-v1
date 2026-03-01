/**
 * Jest setup: runs before any test file.
 * Use a dedicated test database so integration tests don't touch dev/prod data.
 */
if (!process.env.MONGO_DB_NAME_TEST) {
	process.env.MONGO_DB_NAME = process.env.MONGO_DB_NAME || "MFLOW_TEST";
} else {
	process.env.MONGO_DB_NAME = process.env.MONGO_DB_NAME_TEST;
}
