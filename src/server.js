const express = require("express");
const app = express();
const path = require("path");
const connectToDB = require("./config/db_connection"); // Import the db connection
const Session = require("./models/sessionModel");
const Game=require("./models/gameModel");
const AdminDetails=require("./models/adminModel");
const ChildDetails=require("./models/childModel");
const UserAuth=require("./models/authModel");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const childRouter = require("./routes/child");
const adminRouter = require("./routes/admin");
const authRoutes=require("./routes/authRoutes");
const userRoutes=require("./routes/userRoutes");

const nodemailer=require('nodemailer');
require("dotenv").config(); // Load environment variables
app.use(bodyParser.json());

// Allow requests from localhost:3000
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, // Allow cookies to be sent with cross-origin requests
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
  })
);

app.use("/child", childRouter);
app.use("/admin", adminRouter);

// Get the next available child name based on the current highest ChildXXX
app.get("/next-child", async (req, res) => {
  try {
    // Query the database for all session names that match the pattern 'ChildXXX'
    const sessions = await Session.find({ sessionName: /^Child\d{3}$/ }).select(
      "sessionName -_id"
    );

    let nextChildNum = 1; // Default to 'Child001' if no sessions exist

    if (sessions.length > 0) {
      // Extract the numeric part from each 'ChildXXX' session name
      const childNumbers = sessions.map((session) =>
        parseInt(session.sessionName.replace("Child", ""), 10)
      );

      // Get the maximum number found
      const maxChildNum = Math.max(...childNumbers);

      // Increment the max number by 1 for the next available child name
      nextChildNum = maxChildNum + 1;
    }

    const nextChildName = `Child${nextChildNum.toString().padStart(3, "0")}`;
    res.status(200).json({ nextChildName });
  } catch (error) {
    console.error("Error fetching next child name:", error);
    res.status(500).json({ error: "Failed to fetch next child name" });
  }
});
// admin
// where did we use this ???????????????????//

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve uploaded screenshots
app.use("/screenshots", express.static(path.join(__dirname, "screenshots")));

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Start the server
(async () => {
  try {
    await connectToDB(); // Establish the MongoDB connection
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
  }
})();

// Backend Route to Fetch Sessions with Search
app.get("/sessions", async (req, res) => {
  const { searchTerm } = req.query; // Get search term from query parameter

  try {
    // Search for sessions where sessionName or gameName contains the search term
    const sessions = await Session.find({
      $or: [
        { sessionName: { $regex: searchTerm, $options: "i" } }, // Case-insensitive search
        { gameName: { $regex: searchTerm, $options: "i" } },
      ],
    });

    res.json(sessions); // Return matching sessions
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// where did we use this endpoint in frontend??????????????

// Sample user insertion (commented out for production)
// async function insertSampleUsers() {
//     const users = [
//         { username: 'admin', password: 'adminpass', role: 'admin' },
//         { username: 'child1', password: 'childpass1', role: 'child' },
//         { username: 'child2', password: 'childpass2', role: 'child' },
//         { username: 'child3', password: 'childpass4', role: 'child' }
//     ];
//     for (const user of users) {
//         const hashedPassword = await bcrypt.hash(user.password, 10);
//         const newUser = new UserAuth({ username: user.username, password: hashedPassword, role: user.role });
//         await newUser.save();
//       }
//       console.log('Sample users inserted');
// }

// Password update function (commented out for production)
// const saltRounds = 10;
// async function updatePassword(username, newPassword) {
//   const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
//   await UserAuth.updateOne({ username: username }, { $set: { password: hashedPassword } });
//   console.log(`Password for ${username} updated successfully`);
// }
// updatePassword("child2", "childpa2");



// CSRF Protection middleware setup



// Get all pending requests
app.get('/admin/requests', async (req, res) => {
  try {
    const requests = await User.find({ status: 'Pending' });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests', error });
  }
});
app.post('/admin/update-status',async(req,res)=>{
  const { adminId ,action} = req.body;

  try {
    const admin = await AdminDetails.findById(adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // Update verification status
    admin.status = action;
    await admin.save();
    if(action==='Approved'){
        // Generate password and update UserAuth
       const password = Math.random().toString(36).slice(-8);

       let userAuth = await UserAuth.findOne({ username: admin.admin_email });
       if (!userAuth) {
        userAuth = new UserAuth({
          username: admin.admin_email,
          role: admin.admin_role,
          password: await bcrypt.hash(password, 10),
          isVerified: true
        });
       }
       else {
        userAuth.password = await bcrypt.hash(password, 10);
        userAuth.isVerified = true;
      }
       await userAuth.save();
      // Send confirmation email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER, // Set this in your .env file
           pass: process.env.EMAIL_PASS // Set this in your .env file
        }
      });
    
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Registration Approved',
        text: `Hello ${admin.admin_name},\n\nYour registration as a ${admin.admin_role} has been approved. Your login credentials are:\n\nEmail: ${admin.admin_email}\nPassword: ${password}\n\nPlease log in and change your password after logging in.\n\nRegards,\nTeam`
      };
      await transporter.sendMail(mailOptions);
    }
    res.status(200).json({ message: `Admin ${action.toLowerCase()} successfully.` });
  } catch (error) {
    res.status(500).json({ message: 'Error updating admin status.', error });
  }
});


