const app = require('../src/app');
const { connectDB } = require('../src/config/db');

let dbConnection;

module.exports = async (req, res) => {
  try {
    if (!dbConnection) {
      dbConnection = connectDB();
    }

    await dbConnection;
    return app(req, res);
  } catch (error) {
    console.error('Backend error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};