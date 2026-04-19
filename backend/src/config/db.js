const mongoose = require('mongoose');
const dns = require('dns');

// Node.js v17+ on Windows may use an IPv6 link-local DNS server that fails
// SRV record lookups required by mongodb+srv:// URIs. Force IPv4 DNS servers.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
