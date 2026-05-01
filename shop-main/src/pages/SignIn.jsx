import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/userSlice";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { m } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [recaptchaChecking, setRecaptchaChecking] = useState(false);
  const [captchaUnavailable, setCaptchaUnavailable] = useState(false);

  const { executeRecaptcha } = useGoogleReCaptcha();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const from = location.state?.from?.pathname || "/";

  const verifyRecaptchaToken = async () => {
    if (captchaUnavailable) return true;
    if (!executeRecaptcha) { setCaptchaUnavailable(true); return true; }
    setRecaptchaChecking(true);
    try {
      const token = await executeRecaptcha("signin");
      return !!token;
    } catch {
      setCaptchaUnavailable(true);
      return true;
    } finally {
      setRecaptchaChecking(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please enter your email and password"); return; }
    if (!(await verifyRecaptchaToken())) return;
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      dispatch(setUser({ uid: result.user.uid, email: result.user.email }));
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (error) {
      let msg = "Invalid email or password.";
      if (error.code === "auth/user-not-found") msg = "No account found with this email.";
      else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") msg = "Incorrect password.";
      else if (error.code === "auth/too-many-requests") msg = "Too many attempts. Please try again later.";
      else if (error.code === "auth/invalid-email") msg = "Invalid email address.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!(await verifyRecaptchaToken())) return;
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, { uid: user.uid, name: user.displayName || "", email: user.email, profilePic: "", cart: [], createdAt: new Date().toISOString() });
      } else {
        await setDoc(userRef, { uid: user.uid, name: user.displayName || "", email: user.email }, { merge: true });
      }
      dispatch(setUser(user));
      toast.success("Sign in successful!");
      navigate(from, { replace: true });
    } catch (error) {
      if (error.code !== "auth/popup-closed-by-user") toast.error(error.message || "An error occurred.");
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!executeRecaptcha) {
      const t = setTimeout(() => setCaptchaUnavailable(true), 5000);
      return () => clearTimeout(t);
    }
  }, [executeRecaptcha]);

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your TechHub Lesotho account</p>
        </div>
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
        >
          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition duration-200 placeholder-gray-400"
                  required disabled={loading} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <Link to="/password-reset" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password"
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition duration-200 placeholder-gray-400"
                  required disabled={loading} />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading || recaptchaChecking}
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition duration-200 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed">
              {loading || recaptchaChecking ? (
                <><Loader2 className="animate-spin h-5 w-5 mr-2" />Signing in...</>
              ) : (
                <>Sign In<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading || recaptchaChecking}
            className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {googleLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {googleLoading ? "Processing..." : "Continue with Google"}
          </button>
        </m.div>
        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-gray-900 hover:text-gray-700 transition-colors">Sign up</Link>
        </p>
        <p className="mt-4 text-xs text-center text-gray-500">
          Subject to the TechHub Lesotho{" "}
          <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>
        </p>
      </div>
    </m.div>
  );
}

export default SignIn;
