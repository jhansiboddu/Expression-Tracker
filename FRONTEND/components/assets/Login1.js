import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import './Login1.css';
import email_icon from '../components/assets/email.png'
import password_icon from '../components/assets/password.png'

function Login1() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to handle login success
  const handleLoginSuccess = () => {
    console.log("Login success. Setting isAuthenticated to true.");
    setIsAuthenticated(true);
    if (!isAuthenticated) {
        console.log("hi");
        //navigate("/analysis"); // Navigate to /analysis upon successful logi
        return <p>You need to log in to view this page.</p>;
      }
    //navigate("/analysis"); // Navigate to /analysis upon successful login
  };

  async function submit(e) {
    e.preventDefault();
    console.log("Attempting login...");
    try {
      const res = await axios.post("http://localhost:5000/adminlogin", {
        email,
        password,
      });
      console.log("Response from server:", res.data);
      if (res.data === "exist") {
        console.log("Login successful. Executing onLoginSuccess callback...");
        navigate("/analysis");
        //handleLoginSuccess(); // Call function to set isAuthenticated and navigate
      } else if (res.data === "not exists") {
        alert("User has not signed up");
      } else if (res.data === "wrong password") {
        alert("Incorrect password");
      } else {
        console.log("Unexpected response:", res.data);
        alert("Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred while logging in. Please check the console for details.");
    }
  }
  

  return (
    <div className="background">
      <div className="login">
        <div className="header">
          <h1>Login</h1>
          <div className="underline"></div>
        </div>
        <form onSubmit={submit}>
          <div className="inputs">
            <div className="input">
              <img src={email_icon} alt="Email Icon"/>
              <input
                 type="email"
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="Email"
              />
            </div>
            <div className="input">
              <img src={password_icon} alt="Password Icon"/>
              <input
                 type="password"
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="Password"
              />
            </div>
            <div className="submit-container">
               <input className="submit" type="submit" value="Login" />
            </div> 
      </div>
    </form>
    </div>
  </div>
  );
}

export default Login1;
