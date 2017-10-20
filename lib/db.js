const path = require('path');
const { Pool } = require('pg');

module.exports = configPath => {
  const dir = process.cwd();
  const config = require.main.require(path.join(dir, configPath))[process.env.NODE_ENV || 'development'];
  const pool = new Pool(config);

  return {
    transaction: async query => await pool.query(`
      BEGIN;
      ${query}
      COMMIT;
    `),
    query: async query => (await pool.query(query)).rows,
    end() {
      pool.end();
    }
  };
};
