import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import {
  createUserWithEmailAndPassword,
  updateProfile,
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
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, User, UserPlus } from "lucide-react";

function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
      const token = await executeRecaptcha("signup");
      return !!token;
    } catch {
      setCaptchaUnavailable(true);
      return true;
    } finally {
      setRecaptchaChecking(false);
    }
  };

  const getStrength = (p) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];
  const strength = password ? getStrength(password) : 0;

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (!(await verifyRecaptchaToken())) return;
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name.trim() });
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        name: name.trim(),
        profilePic: "",
        cart: [],
        createdAt: new Date().toISOString(),
      });
      dispatch(setUser({ uid: result.user.uid, email: result.user.email }));
      toast.success("Welcome to TechHub Lesotho!");
      navigate(from, { replace: true });
    } catch (error) {
      let msg = error.message;
      if (error.code === "auth/email-already-in-use") msg = "An account with this email already exists.";
      else if (error.code === "auth/weak-password") msg = "Password is too weak.";
      else if (error.code === "auth/invalid-email") msg = "Invalid email address.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async (e) => {
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
        await setDoc(userRef, { uid: user.uid, email: user.email, name: user.displayName || "", profilePic: "", cart: [], createdAt: new Date().toISOString() });
        toast.success("Welcome to TechHub Lesotho!");
      } else {
        await setDoc(userRef, { uid: user.uid, email: user.email, name: user.displayName || userDoc.data().name }, { merge: true });
        toast.success("Welcome back!");
      }
      dispatch(setUser(user));
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join TechHub Lesotho — computers, ICT products &amp; web hosting</p>
        </div>
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
        >
          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition duration-200 placeholder-gray-400"
                  required disabled={loading} />
              </div>
            </div>
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters"
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition duration-200 placeholder-gray-400"
                  required disabled={loading} />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div key={lvl} className={`flex-1 rounded-full transition-colors duration-300 ${strength >= lvl ? strengthColors[strength] : "bg-gray-200"}`} />
                    ))}
                  </div>
                  <p className="text-xs mt-1 text-gray-500">Strength: <span className="font-medium">{strengthLabels[strength]}</span></p>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input id="confirmPassword" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password"
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition duration-200 placeholder-gray-400 ${confirmPassword && confirmPassword !== password ? "border-red-400" : "border-gray-300"}`}
                  required disabled={loading} />
                <button type="button" onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs mt-1 text-red-500">Passwords do not match</p>
              )}
            </div>
            <button type="submit" disabled={loading || recaptchaChecking}
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition duration-200 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed">
              {loading || recaptchaChecking ? (
                <><Loader2 className="animate-spin h-5 w-5 mr-2" />Creating account...</>
              ) : (
                <>Create Account<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>
          <button type="button" onClick={handleGoogleSignUp} disabled={googleLoading || recaptchaChecking}
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
          <p className="mt-6 text-xs text-center text-gray-500">
            By signing up, you agree to our{" "}
            <a href="/terms" className="underline hover:text-gray-700">Terms of Service</a>{" "}and{" "}
            <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>
          </p>
        </m.div>
        <p className="mt-6 text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/signin" className="font-medium text-gray-900 hover:text-gray-700 transition-colors">Sign in</Link>
        </p>
      </div>
    </m.div>
  );
}

export default SignUp;
