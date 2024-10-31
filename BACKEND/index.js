const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const connectToDB = require('./db_connection');  // Import the db connection
const {Session,AdminInfo} = require('./schema');  // Import the session schema
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');

require('dotenv').config();  // Load environment variables
const app = express();

// Allow requests from localhost:3000
app.use(cors({
    origin: 'http://localhost:3000',
}));

// Endpoint to fetch all data related to a session by ID in overallAnalysis.js 
app.get('/sessions/:sessionId', async (req, res) => {
    console.log("Fetching session data for overall analysis");
    const { sessionId } = req.params;
    console.log(sessionId);
  
    try {
      // Fetch session data by sessionId from MongoDB
      const sessionData = await Session.findOne({ sessionId }, 'modelResponse'); // Only fetch the modelResponse field
      console.log(sessionData);
  
      if (!sessionData) {
        return res.status(404).json({ message: 'Session not found' });
      }
  
      // Return only the modelResponse array
      res.status(200).json(sessionData.modelResponse);
    } catch (error) {
      console.error('Error fetching session data:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  

// Get all session IDs, session names, and timestamps
app.get('/sessions', async (req, res) => {
    try {
        // Fetch all sessions with sessionId, sessionName, and timestamp fields
        const sessions = await Session.find({}, 'sessionId sessionName timestamp');

        // Map to create an array of objects with sessionId, sessionName, and formatted timestamp
        const sessionData = sessions.map(session => {
            const date = new Date(session.timestamp);
            return {
                sessionId: session.sessionId,
                sessionName: session.sessionName,
                timestamp: [
                    date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
                ]
            };
        });

        res.status(200).json(sessionData);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// Get the next available child name based on the current highest ChildXXX
app.get('/next-child', async (req, res) => {
    try {
        // Query the database for all session names that match the pattern 'ChildXXX'
        const sessions = await Session.find({ sessionName: /^Child\d{3}$/ }).select('sessionName -_id');

        let nextChildNum = 1; // Default to 'Child001' if no sessions exist

        if (sessions.length > 0) {
            // Extract the numeric part from each 'ChildXXX' session name
            const childNumbers = sessions.map(session => parseInt(session.sessionName.replace('Child', ''), 10));

            // Get the maximum number found
            const maxChildNum = Math.max(...childNumbers);

            // Increment the max number by 1 for the next available child name
            nextChildNum = maxChildNum + 1;
        }

        const nextChildName = `Child${nextChildNum.toString().padStart(3, '0')}`;
        res.status(200).json({ nextChildName });
    } catch (error) {
        console.error('Error fetching next child name:', error);
        res.status(500).json({ error: 'Failed to fetch next child name' });
    }
});



// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve uploaded screenshots
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');  // Path to the uploads folder
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

const screenshotStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const screenshotDir = './screenshots';  // Path to the screenshots folder
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
        cb(null, screenshotDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const uploadScreenshot = multer({ storage: screenshotStorage });

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint to handle image uploads
app.post('/uploads', upload.single('image'), async (req, res) => {
    try {
        console.log('Uploaded file:', req.file);

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const { newSessionId, sessionName } = req.body;
        const imagePath = req.file.path;  // Use the path from multer

        await saveAnalysisResult(imagePath, newSessionId, sessionName, 'image'); // Save the result to MongoDB
        res.status(200).json({ message: 'Image uploaded and data saved to DB' });
    } catch (error) {
        console.error('Error saving to DB:', error);
        res.status(500).json({ error: 'Failed to save image or session data' });
    }
});

// Endpoint to handle screenshot uploads (stored in 'screenshots' folder)
app.post('/screenshots', uploadScreenshot.single('screenshot'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No screenshot uploaded' });
        }

        const { newSessionId, sessionName } = req.body;
        const screenshotPath = req.file.path;  // Use the path from multer (screenshots/)

        // Save screenshot path to MongoDB
        await saveAnalysisResult(screenshotPath, newSessionId, sessionName, 'screenshot');  // Indicate it's a screenshot
        res.status(200).json({ message: 'Screenshot uploaded and path saved to DB' });
    } catch (error) {
        console.error('Error saving screenshot to DB:', error);
        res.status(500).json({ error: 'Failed to save screenshot or session data' });
    }
});

async function saveAnalysisResult(filePath, sessionId, sessionName, fileType) {
    try {
        console.log("Session Name : ", sessionName);
        const update = {
            sessionName: sessionName || 'Unnamed Session',  // Set default sessionName if not provided
            timestamp: new Date()  // Add this line to update the timestamp
        };
        // Store the correct path depending on file type (image or screenshot)
        if (fileType === 'image') {
            update.$push = { imagePaths: filePath };  // Use $push to append to the imagePaths array
        } else if (fileType === 'screenshot') {
            update.$push = { screenshotPaths: filePath };  // Use $push to append to the screenshotPaths array
        }

        // Find the session by sessionId and update with the file path and sessionName
        await Session.findOneAndUpdate(
            { sessionId: sessionId },
            update,
            { upsert: true, new: true }
        );

        console.log(`${fileType} path and sessionName saved to MongoDB`);
    } catch (error) {
        console.error('Error saving file path or sessionName to MongoDB:', error);
        throw error;
    }
}
// full code for getting analysis 

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const MODEL_URL = "https://api-inference.huggingface.co/models/trpakov/vit-face-expression";

// Endpoint to check if analysis exists for a session
app.get('/sessions/analysis/:sessionId', async (req, res) => {
    console.log("hi hi");
    const { sessionId } = req.params;
    try {
        // Find the session by sessionId
        const session = await Session.findOne({ sessionId });
        console.log(session);
        if(!(session.modelResponse.length === session.imagePaths.length))
        {
            console.log("not equal");
        }
        // Check if session or modelResponse exist
        if (!session || !session.modelResponse || session.modelResponse.length === 0 || !(session.modelResponse.length === session.imagePaths.length)) {
            // Return 404 if no analysis data is available or the array is empty
            console.log("not found ");
            return res.status(404).json({ message: 'No analysis found for this session' });
        }

        // Send back the existing analysis results
        res.status(200).json({ analysisResults: session.modelResponse });
    } catch (error) {
        console.error('Error checking for analysis:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
// Get images for a specific session ID
app.get('/sessions/media/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    try {
      // Fetch the session by sessionId from MongoDB
      const session = await Session.findOne({ sessionId: sessionId });
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
  
      // Return imagePaths and screenshotPaths
      res.status(200).json({
        imagePaths: session.imagePaths,
        //screenshotPaths: session.screenshotPaths
      });
      console.log("images sent");
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
});

// Endpoint to send images to the model for analysis
app.post('/sessions/analyze/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ message: 'No images provided for analysis' });
    }

    try {
        const analysisResults = [];

        for (const imagePath of images) {
            try {
                console.log(`Processing image: ${imagePath}`);
                
                // Read the image as a buffer
                const imageBuffer = fs.readFileSync(imagePath);

                // Call the helper function to send the image to the Hugging Face model
                const modelResult = await sendImageToModel(imageBuffer);
                console.log(modelResult);
                analysisResults.push(modelResult);
                // Push the model result to the analysis results array
                
            } catch (error) {
                console.error(`Failed to process image ${imagePath}:`, error.message);
                // Optionally, continue processing other images or return an error immediately
                continue;
            }
        }
        console.log(analysisResults);
        saveAnalysisResults(sessionId, analysisResults)
        .then(response => {
            if (response.success) {
                console.log('Results saved:', response.session);
            } else {
                console.log('Failed to save results:', response.message);
            }
        })
        .catch(error => {
            console.error('Unexpected error:', error);
        });
        // Return the collected analysis results
        return res.status(200).json({ analysisResults });

    } catch (error) {
        console.error('Error analyzing images:', error);
        res.status(500).json({ message: 'Error analyzing images' });
    }
});
// Endpoint to save analysis results in MongoDB
const saveAnalysisResults = async (sessionId, analysisResults) => {
    // Check if analysisResults is an array
    console.log("SaveAna.......... function called");
    if (!Array.isArray(analysisResults)) {
        console.error('Analysis results must be provided as an array');
        return { success: false, message: 'Analysis results must be an array' };
    }

    try {
        // Find the session by sessionId and update the modelResponse field
        const updatedSession = await Session.findOneAndUpdate(
            { sessionId },
            { $set: { modelResponse: analysisResults } },
            { new: true }
        );

        if (!updatedSession) {
            console.error('Session not found');
            return { success: false, message: 'Session not found' };
        }

        console.log('Analysis results saved successfully:', updatedSession);
        return { success: true, session: updatedSession };
    } catch (error) {
        console.error('Error saving analysis results:', error);
        return { success: false, message: 'Error saving analysis results' };
    }
};


// Helper function to send the image to Hugging Face model
async function sendImageToModel(imageBuffer, retries = 5, delay = 5000) {
    // Convert the image buffer to base64 encoding
    console.log("SendImageToModel function called ");
    const base64Image = imageBuffer.toString('base64');
  
    for (let i = 0; i < retries; i++) {
      try {
        // Send the image to the Hugging Face model as base64
        const response = await axios.post(
          MODEL_URL,
          { image: base64Image }, // Adjust the payload according to model requirements
          {
            headers: {
              Authorization: process.env.HUGGING_FACE_API_KEY,
              'Content-Type': 'application/json', // Set content type to JSON
            },
          }
        );
  
        // If we get a successful response, return it
        return response.data;
      } catch (error) {
        if (error.response && error.response.status === 503 && error.response.data.error.includes('currently loading')) {
          const estimatedTime = error.response.data.estimated_time || 5000;
          console.log(`Model is still loading, retrying in ${estimatedTime} milliseconds...`);
  
          // Wait for the estimated time before retrying
          await new Promise((resolve) => setTimeout(resolve, estimatedTime));
        } else if (error.response && error.response.status === 400) {
          console.error("Bad request: Ensure you're sending the image in the correct format.");
          throw new Error('Failed to process the image with Hugging Face: Bad Request');
        } else {
          console.error('Error sending image to Hugging Face model:', error.message);
          throw new Error('Failed to process the image with Hugging Face');
        }
      }
    }
  
    throw new Error('Exceeded retry limit, unable to process the image.');
  }
  // API to get all sessions
  app.get('/detailed_sessions/:sessionId', async (req, res) => {
    console.log("detailed analysis ");
    const { sessionId } = req.params;
    try {
      const sessionData = await Session.findOne({ sessionId }); // Adjust based on your schema
      if (!sessionData) {
        return res.status(404).json({ message: 'Session not found' });
      }
      res.json(sessionData);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching session data' });
    }
  });
  

(async () => {
    try {
        await connectToDB(); // Establish the MongoDB connection
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start the server:', error);
    }
})();

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await AdminInfo.findOne({ email});
    if (!admin) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
});

// Signup Route
app.post('/signup', async (req, res) => {
  const { name,email, password } = req.body;
  const existingAdmin = await AdminInfo.findOne({ username });
  try {
    if (existingAdmin) {
      res.status(409).json({ message: 'Username already taken' });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = new AdminInfo({name,email, password: hashedPassword});
      await newAdmin.save();
      res.status(201).json({ message: 'Signup successful', admin: newAdmin });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});