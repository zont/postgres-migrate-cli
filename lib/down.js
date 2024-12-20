const path = require('path');
const db = require('./db');

module.exports = async options => {
  try {
    const connection = db(options.config);
    const dir = process.cwd();

    await connection.query(`CREATE TABLE IF NOT EXISTS ${options.table} (file varchar(255) NOT NULL UNIQUE)`);

    const appliedMigrations = (await connection.query(`SELECT file FROM ${options.table} ORDER BY 1 DESC`)).map(row => row.file);

    if (appliedMigrations.length === 0) {
      console.log('[MIGRATIONS]: no migrations found.');
    } else {
      if (options.count) {
        appliedMigrations.length = options.count;
      }

      for (const migration of appliedMigrations) {
        const file = require.main.require(path.join(dir, options.path, migration));
        const down = file.down || file.default?.down;

        await connection.transaction(`
          ${down};
          DELETE FROM ${options.table} WHERE file = '${migration}';
        `);

        console.log('[MIGRATIONS][reverted]:', migration);
      };
    }

    connection.end();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
