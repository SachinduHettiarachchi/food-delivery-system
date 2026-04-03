/**
 * Loaded as a Jest setupFile (before each test file's module registry is populated).
 * Sets .env.test variables so that database.js picks up the test DB when first required.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.test"), override: true });
