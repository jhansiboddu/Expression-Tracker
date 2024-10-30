import React,{useState} from 'react';
import './loginSignUp.css';
import user_icon from './assets/person.png'
import email_icon from './assets/email.png'
import password_icon from './assets/password.png'
const LoginSignUp=({ onLoginSuccess}) =>{
    const [action, setAction]=useState("Sign Up");
    async function handleSignup(email, password) {
        try {
          const response = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await response.json();
          alert(data.message);
          if (response.ok) {
            onLoginSuccess();
          }
        } catch (error) {
          console.error('Signup error:', error);
          alert('Error during signup');
        }
      }
      
      async function handleLogin(email, password) {
        try {
          const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await response.json();
          alert(data.message);
          if (response.ok) {
            onLoginSuccess();
          }
        } catch (error) {
          console.error('Login error:', error);
          alert('Error during login');
        }
      }
      const handleButtonClick = (e) => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        action === "Sign Up" ? handleSignup(email, password) : handleLogin(email, password);
      };
      // Example of attaching these functions to form buttons
      // document.getElementById('signupButton').addEventListener('click', () => {
      //   const email = document.getElementById('email').value;
      //   const password = document.getElementById('password').value;
      //   handleSignup(email, password);
      // });
      
      // document.getElementById('loginButton').addEventListener('click', () => {
      //   const email = document.getElementById('email').value;
      //   const password = document.getElementById('password').value;
      //   handleLogin(email, password);
      // });
      
    return (<div className="container">
        <div className="header">
            <div className="text">{action}</div>
            <div className="underline"></div>
            <div className="inputs">
                {action === "Login" ? <div></div> :  <div className="input">
                <img src={user_icon} alt=" "/>
                <input type="text" placeholder="Name" />
            </div> }
           
            <div className="input">
                <img src={email_icon} alt=" "/>
                <input type="email" placeholder="Email Id" />
            </div>
            <div className="input">
                <img src={password_icon} alt=" "/>
                <input type="password"placeholder="Password"/>
            </div>
            </div> 
            {action=== "Sign Up"? <div></div>:<div className="forgot-password">Forgot Password?    <span>Click here</span></div>
            }
            
            <div className="submit-container">
                <div className={action === "Login"?"submit gray" : "submit"} onClick={()=>{setAction("Sign Up")}}>Sign Up</div>
                <div className={action === "Sign Up" ? "submit gray" : "submit"} onClick={()=>{setAction("Login")}}>Login</div>
            </div>
            <button onClick={handleButtonClick}>
            {action}
          </button>
        </div>
        
    </div>)
}
export default LoginSignUp;