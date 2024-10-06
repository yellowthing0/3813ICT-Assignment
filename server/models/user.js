// server/models/user.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  email: String,
  password: String,
  roles: [String],  // 'Super Admin', 'Group Admin', 'User'
  groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }]
});

module.exports = mongoose.model('User', userSchema);
