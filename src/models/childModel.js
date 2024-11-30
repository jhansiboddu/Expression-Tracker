const mongoose = require('mongoose');

// Define the schema for the admin
const ChildAccountSchema = new mongoose.Schema({
    child_name: { type: String, required: true },
    child_age: { type: Number, required: true },
    child_password: { type: String, required: true } // Make sure to hash this later
  });

const ChildDetails = mongoose.model('ChildAccountsSchema',ChildAccountSchema);

model.exports=ChildDetails;