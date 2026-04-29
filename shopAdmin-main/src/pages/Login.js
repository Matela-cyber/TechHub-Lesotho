import { useState, useRef } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import ReCAPTCHA from "react-google-recaptcha";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  // Temporary admin registration handler
  const handleRegister = async () => {
    setRegisterLoading(true);
    setErrorMessage("");
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerEmail,
        registerPassword,
      );
      const user = userCredential.user;
      // Set user role to Admin in Firestore (v9 syntax)
      const { setDoc, doc, serverTimestamp } =
        await import("firebase/firestore");
      await setDoc(doc(db, "users", user.uid), {
        userRole: "Admin",
        email: registerEmail,
        createdAt: serverTimestamp(),
      });
      toast.success("Admin account created. You can now log in.");
      setShowRegister(false);
      setRegisterEmail("");
      setRegisterPassword("");
    } catch (error) {
      setErrorMessage(error.message || "Registration failed.");
    }
    setRegisterLoading(false);
  };
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const recaptchaRef = useRef();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!captchaVerified) {
      toast.error("Please verify the CAPTCHA.");
      return;
    }

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

      setCaptchaVerified(false);
      recaptchaRef.current.reset();
    }
  };

  const handleCaptchaVerification = (value) => {
    setCaptchaVerified(!!value);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-6">Admin Login</h2>
        {errorMessage && (
          <div className="mb-4 text-red-500">{errorMessage}</div>
        )}
        {showRegister ? (
          <>
            <input
              className="border p-2 w-full mb-4"
              type="email"
              placeholder="Admin Email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
            />
            <input
              className="border p-2 w-full mb-6"
              type="password"
              placeholder="Password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
            />
            <button
              className="bg-green-500 text-white p-2 w-full rounded hover:bg-green-600 mb-2"
              onClick={handleRegister}
              disabled={registerLoading}
            >
              {registerLoading ? "Registering..." : "Register Admin"}
            </button>
            <button
              className="text-blue-500 underline w-full"
              onClick={() => setShowRegister(false)}
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
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
            <ReCAPTCHA
              sitekey="6LddLgYrAAAAAHVincfRV9vd1Qy_cyez6HHBmMuv"
              onChange={handleCaptchaVerification}
              ref={recaptchaRef}
              className="mb-4"
            />
            <button
              className="bg-blue-500 text-white p-2 w-full rounded hover:bg-blue-600 mb-2"
              onClick={handleLogin}
              disabled={!captchaVerified}
            >
              Login
            </button>
            <button
              className="text-green-500 underline w-full"
              onClick={() => setShowRegister(true)}
            >
              Register Admin
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
