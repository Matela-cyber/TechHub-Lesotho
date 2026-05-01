import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Save,
  AlertCircle,
  CheckCircle,
} from "react-feather";

const InputField = ({ label, icon: Icon, error, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <input
        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm ${
          error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
        }`}
        {...props}
      />
    </div>
    {error && (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {error}
      </p>
    )}
  </div>
);

const PasswordField = ({
  label,
  icon: Icon,
  show,
  onToggle,
  error,
  ...props
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <input
        type={show ? "text" : "password"}
        className={`w-full pl-10 pr-10 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm ${
          error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
        }`}
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
    {error && (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {error}
      </p>
    )}
  </div>
);

const AdminAccount = () => {
  const { user } = useAuth();

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwErrors, setPwErrors] = useState({});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load profile from Firestore
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setName(d.name || "");
          setPhone(d.phone || "");
        }
        setEmail(user.email || "");
      } catch (err) {
        toast.error("Failed to load profile data.");
      } finally {
        setProfileLoading(false);
      }
    };
    load();
  }, [user]);

  // Save profile (name, phone, email)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!name.trim()) errors.name = "Name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    if (Object.keys(errors).length) {
      setProfileErrors(errors);
      return;
    }
    setProfileErrors({});
    setSavingProfile(true);
    try {
      // Update email in Firebase Auth if changed (requires re-auth — prompt for current password)
      if (email !== user.email) {
        const cred = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, cred);
        await updateEmail(user, email);
      }
      // Update Firestore profile
      await updateDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        toast.error("Current password is incorrect. Required to change email.");
      } else if (err.code === "auth/email-already-in-use") {
        setProfileErrors({ email: "This email is already in use." });
      } else if (err.code === "auth/requires-recent-login") {
        toast.error(
          "Please enter your current password below to verify your identity before changing email.",
        );
      } else {
        toast.error(err.message || "Failed to update profile.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!currentPassword)
      errors.currentPassword = "Current password is required.";
    if (!newPassword) errors.newPassword = "New password is required.";
    else if (newPassword.length < 6)
      errors.newPassword = "Password must be at least 6 characters.";
    if (!confirmPassword)
      errors.confirmPassword = "Please confirm your new password.";
    else if (newPassword !== confirmPassword)
      errors.confirmPassword = "Passwords do not match.";
    if (Object.keys(errors).length) {
      setPwErrors(errors);
      return;
    }
    setPwErrors({});
    setChangingPassword(true);
    try {
      // Re-authenticate first
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      // Now change password
      await updatePassword(user, newPassword);
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setPwErrors({ currentPassword: "Current password is incorrect." });
      } else {
        toast.error(err.message || "Failed to change password.");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user || profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-b-4"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto space-y-6 pb-12"
    >
      {/* Header */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{name || "Admin"}</h1>
          <p className="text-blue-100 text-sm">{user.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
            Administrator
          </span>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-gray-800 text-base">
            Profile Information
          </h2>
        </div>
        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
          <InputField
            label="Full Name"
            icon={User}
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={profileErrors.name}
          />
          <InputField
            label="Email Address"
            icon={Mail}
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={profileErrors.email}
          />
          <InputField
            label="Phone Number (optional)"
            icon={User}
            type="tel"
            placeholder="+266 1234 5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {/* Show current password field if email is changing */}
          {email !== user.email && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                Changing your email requires your{" "}
                <strong>current password</strong> for verification. Enter it in
                the "Change Password" section's{" "}
                <strong>Current Password</strong> field, then save your profile.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-60"
          >
            {savingProfile ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-gray-800 text-base">Change Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
          <PasswordField
            label="Current Password"
            icon={Lock}
            placeholder="Enter your current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            error={pwErrors.currentPassword}
          />
          <PasswordField
            label="New Password"
            icon={Lock}
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            error={pwErrors.newPassword}
          />
          <PasswordField
            label="Confirm New Password"
            icon={Lock}
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            error={pwErrors.confirmPassword}
          />

          {/* Password strength hint */}
          {newPassword.length > 0 && (
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => {
                const strength = Math.min(
                  4,
                  (newPassword.length >= 6 ? 1 : 0) +
                    (/[A-Z]/.test(newPassword) ? 1 : 0) +
                    (/[0-9]/.test(newPassword) ? 1 : 0) +
                    (/[^A-Za-z0-9]/.test(newPassword) ? 1 : 0),
                );
                const colors = [
                  "bg-red-400",
                  "bg-orange-400",
                  "bg-yellow-400",
                  "bg-green-500",
                ];
                return (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      level <= strength ? colors[strength - 1] : "bg-gray-200"
                    }`}
                  />
                );
              })}
            </div>
          )}

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-60"
          >
            {changingPassword ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Changing Password...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Change Password
              </>
            )}
          </button>
        </form>
      </div>

      {/* Account Info (read-only) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
          <Shield className="w-5 h-5 text-gray-500" />
          <h2 className="font-bold text-gray-800 text-base">Account Details</h2>
        </div>
        <div className="p-6 space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500 font-medium">User ID</span>
            <span className="font-mono text-gray-700 text-xs">{user.uid}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500 font-medium">Role</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
              Administrator
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500 font-medium">Email Verified</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.emailVerified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {user.emailVerified ? "Verified" : "Not Verified"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminAccount;
