const UserAuth=require('../models/authModel');
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const register=async(req,res) =>{
    try {
        const { admin_name, phone_number, admin_email, admin_role } = req.body;
        console.log("Admin_name: "+admin_name +"phone_number: "+phone_number+"admin_email: "+admin_email+"admin_role: "+admin_role);
        if (!admin_name || !phone_number || !admin_email || !admin_role) {
          return res.status(400).json({ message: "All fields are required" });
        }
        const existingAdmin = await AdminDetails.findOne({ admin_email });
        if (existingAdmin) {
          return res.status(400).json({ message: "Admin email already registered" });
        }
        const newAdmin = new AdminDetails({
          admin_name,
          phone_number,
          admin_email,
          admin_role,
          status: 'Pending', // Pending status until approval
          children_accounts: [],
        });
        await newAdmin.save();
        // Save login details
        const userAuth = new UserAuth({
          username: admin_email,
          password: null,
          role: admin_role,
          isVerified: false, // Not verified until approved
        });
        await userAuth.save();
        res.status(201).json({ message: "Your form is submitted successfully Response will be sent to your mail soon ", admin: newAdmin });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const login=async(req,res) =>{
    const { username, password } = req.body;
    try {
      // Check if user exists
      const user = await UserAuth.findOne({ username });
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      // Compare the provided password with the stored hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role }, // Payload
        process.env.JWT_SECRET,          // Secret key
        { expiresIn: '1h' }              // Token expiry (1 hour)
      );
      //The server sends the JWT back to the client as an HttpOnly cookie using res.cookie()
      res.cookie("jwt", token, {
        maxAge: 3600000, // 1 hour expiry
      });
      // Send role-based response
      return res.status(200).json({
        message: `Welcome, ${user.role}!`,
        redirectTo: user.role === "admin" ? "/analysis" : "/select-game",
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: 'Server error' });
    }
};

module.exports={
    register,
    login,
};