const mongoose = require('mongoose');
const ChildAccountSchema=require('./childModel').schema;

const AdminSchema = new mongoose.Schema({
    admin_name: { type: String, required: true },
    phone_number: { type: String, required: true },
    admin_email: { type: String, required: true, unique: true },
    admin_role: { type: String, enum: ["therapist", "game_developer"], required: true },
    //password: { type: String, required: true }, // Make sure to hash this later
    status: { type: String, default: 'Pending' },
    children_accounts: [ChildAccountSchema]
  });

const AdminDetails = mongoose.model('AdminSchema',AdminSchema);

module.exports=AdminDetails;