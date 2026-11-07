// Keep the HTTP listener closed until the database and startup work are ready.
async function startWhenReady({ connect, initialize, listen, disconnect }) {
  try {
    await connect();
    await initialize();
    return await listen();
  } catch (error) {
    await disconnect().catch(() => {});
    throw error;
  }
}

function databaseHealth(connection) {
  return async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      if (connection.readyState !== 1 || !connection.db) throw new Error('Database disconnected');
      await connection.db.admin().command({ ping: 1 }, { timeoutMS: 2000 });
      if (connection.readyState !== 1) throw new Error('Database disconnected');
      res.json({ status: 'ok', database: 'connected', message: 'Language LMS API is running!' });
    } catch {
      res.status(503).json({ status: 'unavailable', database: 'unavailable', message: 'Database is unavailable' });
    }
  };
}

function requireDatabase(connection) {
  return (req, res, next) => {
    if (connection.readyState === 1) return next();
    res.set('Retry-After', '5');
    res.status(503).json({ error: 'Database is temporarily unavailable. Please try again shortly.' });
  };
}

module.exports = { startWhenReady, databaseHealth, requireDatabase };
