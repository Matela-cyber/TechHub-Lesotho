import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
// Removed ReCAPTCHA

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // Registration state and logic removed
  // Removed CAPTCHA state
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.userRole === "Admin") {
          navigate("/");
        } else {
          await signOut(auth);
          setErrorMessage("Access denied. Admins only.");
          toast.error("Access denied. Admins only.");
        }
      } else {
        await signOut(auth);
        setErrorMessage("User role not found.");
        toast.error("User role not found.");
      }
    } catch (error) {
      setErrorMessage("Invalid email or password.");
      toast.error("Invalid email or password.");

      // No CAPTCHA to reset
    }
  };

  // Removed CAPTCHA handler

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-6">Admin Login</h2>
        {errorMessage && (
          <div className="mb-4 text-red-500">{errorMessage}</div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="border p-2 w-full mb-4"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="border p-2 w-full mb-6"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white p-2 w-full rounded hover:bg-blue-600 mb-2"
            type="submit"
          >
            Login
          </button>
          {/* Registration button removed */}
        </form>
      </div>
    </div>
  );
};

export default Login;
