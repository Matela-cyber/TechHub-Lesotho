import React, { useEffect, useState, useCallback } from "react";
import { auth, db } from "../firebase/config";
// import { uploadImageToStorage } from "../firebase/storageUtils";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
} from "firebase/auth";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import countriesStatesData from "../../src/countriesStates.json";
import { m } from "framer-motion";
import {
  User,
  MapPin,
  Heart,
  Truck,
  ShoppingBag,
  Camera,
  AlertCircle,
  CreditCard,
  Trash2,
  Package,
  ExternalLink,
  CheckCircle,
  FileDown,
  Star,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate, Link, useParams } from "react-router-dom";
import {
  useDispatch,
  // eslint-disable-next-line no-unused-vars
  useSelector,
} from "react-redux";
// eslint-disable-next-line no-unused-vars
import { setWishlistItems } from "../redux/wishlistSlice";
import logger from "../utils/logger";
import useWishlist from "../utils/useWishlist";
import { downloadOrderReceipt } from "../utils/pdfUtils";
import UserReviews from "../components/UserReviews";

/**
 * Order status constants with associated colors for UI display
 */
const ORDER_STATUS = {
  PLACED: { label: "Placed", color: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Approved", color: "bg-blue-100 text-blue-800" },
  PACKED: { label: "Packed", color: "bg-indigo-100 text-indigo-800" },
  SHIPPED: { label: "Shipped", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "Delivered", color: "bg-green-100 text-green-800" },
  DECLINED: { label: "Declined", color: "bg-red-100 text-red-800" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-800" },
};

/**
 * My Account page with multiple sections for profile management,
 * orders, wishlist, shipment tracking, and reviews
 *
 * Now with URL-based navigation for each section:
 * - /my-account/profile (default)
 * - /my-account/payment-methods
 * - /my-account/orders
 * - /my-account/track-shipment
 * - /my-account/wishlist
 * - /my-account/reviews
 */
const STATUS_STEPS = ["Placed", "Approved", "Packed", "Shipped", "Delivered"];

function OrderStatusTimeline({ status }) {
  const isTerminal = status === "Declined" || status === "Cancelled";
  const currentIdx = STATUS_STEPS.indexOf(status);

  if (isTerminal) {
    return (
      <div className="flex items-center gap-2 mt-3 py-2 px-3 bg-red-50 rounded-lg text-red-600 text-sm">
        <AlertCircle size={14} className="flex-shrink-0" />
        <span>
          {status === "Declined"
            ? "Order was declined — contact us for details."
            : "Order cancelled."}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-3 px-1">
      <div className="relative flex items-center justify-between">
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200" />
        <div
          className="absolute top-3 left-0 h-0.5 bg-blue-500 transition-all duration-700"
          style={{
            width:
              currentIdx >= 0
                ? `${(currentIdx / (STATUS_STEPS.length - 1)) * 100}%`
                : "0%",
          }}
        />
        {STATUS_STEPS.map((step, idx) => {
          const done = currentIdx >= idx;
          const active = currentIdx === idx;
          return (
            <div
              key={step}
              className="relative flex flex-col items-center z-10"
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all
                  ${done ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-gray-300 text-gray-400"}
                  ${active ? "ring-2 ring-blue-200 scale-110" : ""}`}
              >
                {done ? "✓" : idx + 1}
              </div>
              <span
                className={`text-xs mt-1 text-center leading-tight max-w-[48px] ${done ? "text-blue-600 font-medium" : "text-gray-400"}`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MyAccount() {
  // Get the current section from URL parameters
  const { section } = useParams();
  const currentSection = section || "profile";

  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    email: "",
    name: "",
    phone: "",
    address: {
      houseNo: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      country: "Lesotho",
      pin: "",
    },
    // profilePic removed
  });
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  // Password change state
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [pwLoading, setPwLoading] = useState(false);
  // Profile picture upload removed
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: "card",
    cardType: "Visa",
    cardNumber: "",
    cardExpiry: "",
    cardCVV: "",
    upiId: "",
  });
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [wishlistLoading, setWishlistLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const dispatch = useDispatch();
  const {
    wishlistItems: hookWishlistItems,
    loading: wishlistHookLoading,
    removeFromWishlist: removeWishlistItem,
  } = useWishlist();

  useEffect(() => {
    /**
     * Fetch user profile data from Firestore
     */
    const fetchProfile = async () => {
      if (user) {
        try {
          setLoading(true);
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfile({
              email: userData.email || "",
              name: userData.name || "",
              phone: userData.phone || "",
              address: {
                houseNo: userData.address?.houseNo || "",
                line1: userData.address?.line1 || "",
                line2: userData.address?.line2 || "",
                city: userData.address?.city || "",
                state: userData.address?.state || "",
                country: userData.address?.country || "India",
                pin: userData.address?.pin || "",
              },
              // profilePic removed
            });

            // Set payment methods
            setPaymentMethods(userData.paymentMethods || []);

            logger.firebase.read(`users/${user.uid}`, {
              name: userData.name,
              email: userData.email,
            });
          } else {
            toast.warn("No profile data found. Please update your profile.");
            logger.warn("No user profile data found", null, "Profile");
          }
        } catch (error) {
          toast.error("Error loading profile: " + error.message);
          logger.firebase.error(`users/${user.uid}`, "getDoc", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user]);

  // Real-time orders listener — auto-updates whenever order status changes in Firestore
  useEffect(() => {
    if (!user) return;
    if (currentSection !== "orders" && currentSection !== "track-shipment")
      return;

    setOrdersLoading(true);
    const ordersQuery = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const toMs = (d) => {
          if (!d) return 0;
          if (typeof d.toDate === "function") return d.toDate().getTime();
          return new Date(d).getTime() || 0;
        };
        const ordersData = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          if (!data.totalAmount && !data.total) {
            const s = data.subtotal || 0;
            const t = data.tax || 0;
            const sh = data.shipping?.cost || 0;
            const d2 = data.discount || 0;
            const imp = data.importDuty || 0;
            data.totalAmount = s + t + sh + imp - d2;
          }
          return { id: docSnap.id, ...data };
        });
        ordersData.sort(
          (a, b) =>
            (toMs(b.createdAt) || toMs(b.orderDate)) -
            (toMs(a.createdAt) || toMs(a.orderDate)),
        );
        setOrders(ordersData);
        setOrdersLoading(false);
      },
      (error) => {
        toast.error("Failed to load orders. Please refresh.");
        setOrdersLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user, currentSection]);

  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    logger.user.action("View Wishlist", { userId: user.uid });
  }, [user]);

  useEffect(() => {
    if (currentSection === "wishlist") {
      fetchWishlist();
    }
  }, [currentSection, fetchWishlist]);

  /**
   * Handle input field changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addrField = name.split(".")[1];
      setProfile((prev) => ({
        ...prev,
        address: { ...prev.address, [addrField]: value },
      }));
    } else {
      setProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  /**
   * Handle form submission to update profile
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user) {
      setSaveLoading(true);
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
        });
        toast.success("Profile updated successfully!");
      } catch (error) {
        toast.error("Error updating profile: " + error.message);
        console.error("Error updating profile:", error);
      } finally {
        // setIsUploadingProfilePic removed
        setSaveLoading(false);
      }
    }
  };

  /**
   * Get card logo based on card type
   */
  const getCardLogo = (cardType) => {
    switch (cardType) {
      case "Visa":
        return "/visa.png";
      case "MasterCard":
        return "/mastercard.png";
      case "RuPay":
        return "/rupay.png";
      case "AMEX":
        return "/amex.png";
      default:
        return null;
    }
  };

  /**
   * Format card number to show only last 4 digits
   */
  const formatCardNumber = (cardNumber) => {
    if (!cardNumber) return "";
    const last4 = cardNumber.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  /**
   * Handle payment method form input change
   */
  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setNewPaymentMethod((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handle adding a new payment method
   */
  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaveLoading(true);
      const userRef = doc(db, "users", user.uid);

      const paymentMethod =
        newPaymentMethod.type === "card"
          ? {
              type: "card",
              cardType: newPaymentMethod.cardType,
              cardNumber: newPaymentMethod.cardNumber,
              cardExpiry: newPaymentMethod.cardExpiry,
              cardCVV: newPaymentMethod.cardCVV,
            }
          : {
              type: "upi",
              upiId: newPaymentMethod.upiId,
            };

      // Add to existing methods
      const updatedMethods = [...paymentMethods, paymentMethod];

      await updateDoc(userRef, { paymentMethods: updatedMethods });
      setPaymentMethods(updatedMethods);

      // Reset form
      setNewPaymentMethod({
        type: "card",
        cardType: "Visa",
        cardNumber: "",
        cardExpiry: "",
        cardCVV: "",
        upiId: "",
      });

      toast.success("Payment method added successfully!");
    } catch (error) {
      toast.error("Error adding payment method: " + error.message);
      console.error("Error adding payment method:", error);
    } finally {
      setSaveLoading(false);
    }
  };

  /**
   * Handle removing a payment method
   */
  const handleRemovePaymentMethod = async (index) => {
    if (!user) return;

    try {
      setSaveLoading(true);
      const userRef = doc(db, "users", user.uid);

      const updatedMethods = [...paymentMethods];
      updatedMethods.splice(index, 1);

      await updateDoc(userRef, { paymentMethods: updatedMethods });
      setPaymentMethods(updatedMethods);

      toast.success("Payment method removed successfully!");
    } catch (error) {
      toast.error("Error removing payment method: " + error.message);
      console.error("Error removing payment method:", error);
    } finally {
      setSaveLoading(false);
    }
  };

  /**
   * Removes a product from the wishlist
   * @param {string} productId - ID of the product to remove
   */
  const handleRemoveFromWishlist = async (productId) => {
    await removeWishlistItem(productId);
  };

  /**
   * Format price as currency
   *
   * @param {number} price - Price to format
   * @returns {string} Formatted price
   *
   * IMPORTANT: There's inconsistency in the database schema where some order records
   * use 'totalAmount' field while others might use 'total' field for the order total.
   * The email service uses 'totalAmount', so we prioritize that field but fall back to 'total'
   * if needed to ensure consistent display across all app sections.
   * This prevents "₹0.00" or "NaN" issues in the UI and PDF generation.
   */
  const formatPrice = (price) => {
    if (price === undefined || price === null) return "M0.00";

    const num = typeof price === "string" ? parseFloat(price) : price;

    // Handle NaN, just in case
    if (isNaN(num)) return "M0.00";

    // Extract integer and decimal parts
    const parts = num.toFixed(2).split(".");
    const integer = parts[0];
    const decimalPart = parts[1];

    // Add thousands separators to integer part
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Return formatted string
    return `M${decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger}`;
  };

  /**
   * Format date in a more readable format
   *
   * @param {string|number|Date} date - The date to format
   * @returns {string} Formatted date
   */
  const formatOrderDate = (date) => {
    if (!date) return "N/A";

    const orderDate = new Date(date);

    // Check if date is valid
    if (isNaN(orderDate.getTime())) return "Invalid date";

    // If the date is in the future (except for a small tolerance of 1 day),
    // it's likely a timestamp error. Use current date instead.
    const now = new Date();
    if (orderDate > new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
      return new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    return orderDate.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /**
   * Handle downloading an order receipt
   * @param {object} order - The order object
   */
  const handleDownloadReceipt = async (order) => {
    try {
      toast.info("Preparing your receipt...");

      // Ensure the order has a valid total amount for the PDF generation
      const orderCopy = { ...order };

      // Check and calculate totalAmount if missing to avoid NaN in the PDF
      if (!orderCopy.totalAmount && !orderCopy.total) {
        const subtotal = orderCopy.subtotal || 0;
        const tax = orderCopy.tax || 0;
        const shipping = orderCopy.shipping?.cost || 0;
        const discount = orderCopy.discount || 0;
        const importDuty = orderCopy.importDuty || 0;

        // Calculate and set the total amount
        orderCopy.totalAmount =
          subtotal + tax + shipping + importDuty - discount;

        console.log("Calculated missing total for PDF receipt:", {
          orderId: orderCopy.orderId,
          calculatedTotal: orderCopy.totalAmount,
        });
      }

      await downloadOrderReceipt(orderCopy);
      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            My Account
          </h1>
          <p className="text-gray-600 mb-8">
            Manage your profile, orders, and more
          </p>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-t-2xl shadow-md overflow-hidden border border-gray-200">
            <div className="flex flex-wrap">
              <Link
                to="/my-account/profile"
                className={`flex items-center py-4 px-6 focus:outline-none transition-colors ${
                  currentSection === "profile"
                    ? "text-blue-600 border-b-2 border-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <User size={18} className="mr-2" />
                <span>Profile</span>
              </Link>

              <Link
                to="/my-account/payment-methods"
                className={`flex items-center py-4 px-6 focus:outline-none transition-colors ${
                  currentSection === "payment-methods"
                    ? "text-blue-600 border-b-2 border-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <CreditCard size={18} className="mr-2" />
                <span>Payment Methods</span>
              </Link>

              <Link
                to="/my-account/orders"
                className={`flex items-center py-4 px-6 focus:outline-none transition-colors ${
                  currentSection === "orders"
                    ? "text-blue-600 border-b-2 border-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <ShoppingBag size={18} className="mr-2" />
                <span>Orders</span>
              </Link>

              <Link
                to="/my-account/track-shipment"
                className={`flex items-center py-4 px-6 focus:outline-none transition-colors ${
                  currentSection === "track-shipment"
                    ? "text-blue-600 border-b-2 border-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Truck size={18} className="mr-2" />
                <span>Track Shipment</span>
              </Link>

              <Link
                to="/my-account/wishlist"
                className={`flex items-center py-4 px-6 focus:outline-none transition-colors ${
                  currentSection === "wishlist"
                    ? "text-blue-600 border-b-2 border-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Heart size={18} className="mr-2" />
                <span>Wishlist</span>
              </Link>

              <Link
                to="/my-account/reviews"
                className={`flex items-center py-4 px-6 focus:outline-none transition-colors ${
                  currentSection === "reviews"
                    ? "text-blue-600 border-b-2 border-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Star size={18} className="mr-2" />
                <span>Reviews</span>
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-b-2xl shadow-md p-6 md:p-8 border-t-0 border border-gray-200">
            {/* Render content based on URL section */}
            {currentSection === "profile" && (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Profile content */}
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Profile image: Use generic User icon */}
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300 shadow-sm mb-2">
                    <User size={56} className="text-gray-400" />
                  </div>

                  <div className="flex-grow">
                    <h2 className="text-2xl font-semibold text-gray-800">
                      {profile.name || "Welcome"}
                    </h2>
                    <p className="text-gray-600">{profile.email}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <User size={18} className="mr-2" />
                      Personal Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={profile.name}
                          onChange={handleChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={profile.email}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                          disabled
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          name="phone"
                          value={profile.phone}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Profile Picture URL input removed */}
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <MapPin size={18} className="mr-2" />
                      Address Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          House/Apartment Number
                        </label>
                        <input
                          type="text"
                          name="address.houseNo"
                          value={profile.address.houseNo}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 1
                        </label>
                        <input
                          type="text"
                          name="address.line1"
                          value={profile.address.line1}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          name="address.line2"
                          value={profile.address.line2}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          name="address.city"
                          value={profile.address.city}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PIN Code
                        </label>
                        <input
                          type="text"
                          name="address.pin"
                          value={profile.address.pin}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <select
                          name="address.country"
                          value={profile.address.country}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Object.keys(countriesStatesData.countries).map(
                            (country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ),
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State / District
                        </label>
                        {countriesStatesData.countries[profile.address.country]
                          ?.length > 0 ? (
                          <select
                            name="address.state"
                            value={profile.address.state}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select State / District</option>
                            {countriesStatesData.countries[
                              profile.address.country
                            ].map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            name="address.state"
                            value={profile.address.state}
                            onChange={handleChange}
                            placeholder="State / District / Region"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
                      disabled={saveLoading}
                    >
                      {saveLoading ? (
                        <span className="flex items-center justify-center">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                          Saving...
                        </span>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>

                {/* Change Password */}
                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Lock size={18} className="mr-2" />
                    Change Password
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Leave blank if you signed up with Google. Only
                    email/password accounts can change their password here.
                  </p>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!pwForm.current) {
                        toast.error("Enter your current password");
                        return;
                      }
                      if (pwForm.next.length < 8) {
                        toast.error(
                          "New password must be at least 8 characters",
                        );
                        return;
                      }
                      if (pwForm.next !== pwForm.confirm) {
                        toast.error("New passwords do not match");
                        return;
                      }
                      setPwLoading(true);
                      try {
                        const credential = EmailAuthProvider.credential(
                          user.email,
                          pwForm.current,
                        );
                        await reauthenticateWithCredential(
                          auth.currentUser,
                          credential,
                        );
                        await updatePassword(auth.currentUser, pwForm.next);
                        toast.success("Password changed successfully!");
                        setPwForm({ current: "", next: "", confirm: "" });
                      } catch (err) {
                        let msg = "Failed to change password.";
                        if (
                          err.code === "auth/wrong-password" ||
                          err.code === "auth/invalid-credential"
                        )
                          msg = "Current password is incorrect.";
                        else if (err.code === "auth/too-many-requests")
                          msg = "Too many attempts. Try again later.";
                        else if (err.code === "auth/requires-recent-login")
                          msg =
                            "Please sign out and sign in again before changing your password.";
                        toast.error(msg);
                      } finally {
                        setPwLoading(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    {[
                      {
                        id: "current",
                        label: "Current Password",
                        key: "current",
                      },
                      { id: "next", label: "New Password", key: "next" },
                      {
                        id: "confirm",
                        label: "Confirm New Password",
                        key: "confirm",
                      },
                    ].map(({ id, label, key }) => (
                      <div key={id}>
                        <label
                          htmlFor={id}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          {label}
                        </label>
                        <div className="relative">
                          <input
                            id={id}
                            type={showPw[key] ? "text" : "password"}
                            value={pwForm[key]}
                            onChange={(e) =>
                              setPwForm((f) => ({
                                ...f,
                                [key]: e.target.value,
                              }))
                            }
                            placeholder={label}
                            className="w-full pr-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={pwLoading}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPw((s) => ({ ...s, [key]: !s[key] }))
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                          >
                            {showPw[key] ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="w-full md:w-auto px-6 py-3 bg-gray-900 text-white font-medium rounded-lg shadow hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-70"
                    >
                      {pwLoading ? (
                        <span className="flex items-center justify-center">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                          Updating...
                        </span>
                      ) : (
                        "Update Password"
                      )}
                    </button>
                  </form>
                </div>
              </m.div>
            )}

            {currentSection === "payment-methods" && (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-medium text-gray-900">
                      Payment Methods
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Manage your saved payment methods
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      document
                        .getElementById("add-payment-form")
                        .scrollIntoView({ behavior: "smooth" })
                    }
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span className="mr-2">+</span> Add Payment Method
                  </button>
                </div>

                {/* Saved Payment Methods */}
                <div className="space-y-4">
                  {paymentMethods.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <CreditCard
                        className="mx-auto text-gray-400 mb-3"
                        size={32}
                      />
                      <p className="text-gray-600">
                        No payment methods saved yet
                      </p>
                    </div>
                  ) : (
                    paymentMethods.map((method, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                      >
                        {method.type === "card" ? (
                          <div className="flex items-center gap-4">
                            {method.cardType && (
                              <div className="w-12 h-8 bg-gray-100 flex items-center justify-center rounded">
                                <img
                                  src={getCardLogo(method.cardType)}
                                  alt={method.cardType}
                                  className="h-5 object-contain"
                                />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {method.cardType} Card
                              </p>
                              <p className="text-gray-600 text-sm">
                                {formatCardNumber(method.cardNumber)}
                              </p>
                              {method.cardExpiry && (
                                <p className="text-gray-500 text-xs">
                                  Expires: {method.cardExpiry}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-8 bg-gray-100 flex items-center justify-center rounded">
                              <span className="text-sm font-medium text-gray-800">
                                UPI
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">UPI ID</p>
                              <p className="text-gray-600 text-sm">
                                {method.upiId}
                              </p>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => handleRemovePaymentMethod(index)}
                          className="self-end md:self-center flex items-center text-red-600 hover:text-red-700 gap-1 text-sm"
                        >
                          <Trash2 size={16} />
                          <span>Remove</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Payment Method Form */}
                <div
                  id="add-payment-form"
                  className="bg-gray-50 rounded-lg p-6 mt-8"
                >
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Add Payment Method
                  </h4>

                  <form onSubmit={handleAddPaymentMethod} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Type
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="type"
                              value="card"
                              checked={newPaymentMethod.type === "card"}
                              onChange={handlePaymentChange}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Card</span>
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="type"
                              value="upi"
                              checked={newPaymentMethod.type === "upi"}
                              onChange={handlePaymentChange}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>UPI</span>
                          </label>
                        </div>
                      </div>

                      {newPaymentMethod.type === "card" ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Card Type
                            </label>
                            <select
                              name="cardType"
                              value={newPaymentMethod.cardType}
                              onChange={handlePaymentChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Visa">Visa</option>
                              <option value="MasterCard">MasterCard</option>
                              <option value="RuPay">RuPay</option>
                              <option value="AMEX">American Express</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Card Number
                            </label>
                            <input
                              type="text"
                              name="cardNumber"
                              value={newPaymentMethod.cardNumber}
                              onChange={handlePaymentChange}
                              placeholder="1234 5678 9012 3456"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              maxLength={19}
                              required={newPaymentMethod.type === "card"}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expiry Date
                              </label>
                              <input
                                type="text"
                                name="cardExpiry"
                                value={newPaymentMethod.cardExpiry}
                                onChange={handlePaymentChange}
                                placeholder="MM/YY"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={5}
                                required={newPaymentMethod.type === "card"}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                CVV
                              </label>
                              <input
                                type="password"
                                name="cardCVV"
                                value={newPaymentMethod.cardCVV}
                                onChange={handlePaymentChange}
                                placeholder="123"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={4}
                                required={newPaymentMethod.type === "card"}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            UPI ID
                          </label>
                          <input
                            type="text"
                            name="upiId"
                            value={newPaymentMethod.upiId}
                            onChange={handlePaymentChange}
                            placeholder="username@upi"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={newPaymentMethod.type === "upi"}
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
                        disabled={saveLoading}
                      >
                        {saveLoading ? (
                          <span className="flex items-center justify-center">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                            Saving...
                          </span>
                        ) : (
                          "Add Payment Method"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </m.div>
            )}

            {currentSection === "orders" && (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    My Orders
                  </h2>
                </div>

                {ordersLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Package size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">
                      No orders yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      You haven't placed any orders yet.
                    </p>
                    <button
                      onClick={() => navigate("/products")}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
                      >
                        {/* Order Header */}
                        <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Order placed on {formatOrderDate(order.orderDate)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Order ID: {order.orderId}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                ORDER_STATUS[order.status?.toUpperCase()]
                                  ?.color || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {order.status}
                            </span>

                            {/* If order is shipped, show tracking option */}
                            {(order.status === "Shipped" ||
                              order.status === "Delivered") &&
                              order.tracking?.code && (
                                <Link
                                  to="/my-account/track-shipment"
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                                >
                                  <Truck size={14} className="mr-1" />
                                  Track Package
                                </Link>
                              )}
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="p-4">
                          <OrderStatusTimeline status={order.status} />
                          <div className="space-y-4 mt-4">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                  <img
                                    src={
                                      item.image ||
                                      "https://via.placeholder.com/80?text=Product"
                                    }
                                    alt={item.name}
                                    className="w-16 h-16 object-contain border border-gray-200 rounded-md"
                                  />
                                </div>
                                <div className="flex-grow">
                                  <h4 className="text-gray-800 font-medium">
                                    {item.name}
                                  </h4>
                                  <p className="text-gray-500 text-sm mt-1">
                                    Qty: {item.quantity} ×{" "}
                                    {formatPrice(item.price || 0)}
                                  </p>
                                </div>
                                <p className="text-gray-800 font-semibold text-sm whitespace-nowrap">
                                  {formatPrice(
                                    (item.price || 0) * item.quantity,
                                  )}
                                </p>
                              </div>
                            ))}

                            {order.items.length > 3 && (
                              <p className="text-sm text-gray-500">
                                + {order.items.length - 3} more items
                              </p>
                            )}
                          </div>

                          {/* Order Footer */}
                          <div className="mt-6 pt-4 border-t border-gray-100">
                            {/* Price breakdown */}
                            <div className="text-sm text-gray-500 space-y-1 mb-3">
                              <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatPrice(order.subtotal || 0)}</span>
                              </div>
                              {order.tax > 0 && (
                                <div className="flex justify-between">
                                  <span>VAT</span>
                                  <span>{formatPrice(order.tax)}</span>
                                </div>
                              )}
                              {order.shipping?.cost > 0 && (
                                <div className="flex justify-between">
                                  <span>Shipping</span>
                                  <span>
                                    {formatPrice(order.shipping.cost)}
                                  </span>
                                </div>
                              )}
                              {order.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>
                                    Discount
                                    {order.coupon?.code
                                      ? ` (${order.coupon.code})`
                                      : ""}
                                  </span>
                                  <span>-{formatPrice(order.discount)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
                              <div>
                                <p className="text-gray-900 font-bold text-lg">
                                  Total:{" "}
                                  {formatPrice(
                                    order.totalAmount || order.total || 0,
                                  )}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDownloadReceipt(order)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 transition rounded text-sm text-gray-700"
                                >
                                  <FileDown size={14} />
                                  Receipt
                                </button>
                                {(order.status === "Shipped" ||
                                  order.status === "Delivered") && (
                                  <Link
                                    to="/my-account/track-shipment"
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 transition rounded text-sm text-blue-700"
                                  >
                                    <Truck size={14} />
                                    Track
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </m.div>
            )}

            {currentSection === "track-shipment" && (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                  Track Your Orders
                </h2>

                <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100 flex items-start gap-3">
                  <Truck
                    className="text-blue-600 mt-0.5 flex-shrink-0"
                    size={20}
                  />
                  <div>
                    <p className="font-medium text-blue-800">
                      Real-time status updates
                    </p>
                    <p className="text-blue-700 text-sm mt-0.5">
                      Your order status updates automatically below. For
                      delivery tracking contact us at{" "}
                      <strong>info@techhub.co.ls</strong> or{" "}
                      <strong>+266 1234 5678</strong>.
                    </p>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-500"></div>
                  </div>
                ) : orders.filter(
                    (o) => o.status !== "Declined" && o.status !== "Cancelled",
                  ).length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Truck size={40} className="mx-auto text-gray-300 mb-3" />
                    <h4 className="text-gray-700 font-medium mb-1">
                      No active orders
                    </h4>
                    <p className="text-gray-500 text-sm">
                      You have no orders in progress right now.
                    </p>
                    <Link
                      to="/my-account/orders"
                      className="mt-4 inline-block text-blue-600 hover:underline text-sm"
                    >
                      View all orders
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {orders
                      .filter(
                        (o) =>
                          o.status !== "Declined" && o.status !== "Cancelled",
                      )
                      .map((order) => (
                        <div
                          key={order.id}
                          className="border border-gray-200 rounded-xl p-5 shadow-sm"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                            <div>
                              <p className="font-semibold text-gray-800">
                                {order.items?.length} item
                                {order.items?.length !== 1 ? "s" : ""}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatOrderDate(order.orderDate)}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                #{order.orderId}
                              </p>
                            </div>
                            <span
                              className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-medium ${
                                ORDER_STATUS[order.status?.toUpperCase()]
                                  ?.color || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <OrderStatusTimeline status={order.status} />

                          {order.statusHistory?.length > 1 && (
                            <div className="mt-4 border-t border-gray-100 pt-4">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                Status History
                              </p>
                              <div className="space-y-2">
                                {[...order.statusHistory]
                                  .reverse()
                                  .map((entry, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-start gap-2 text-sm"
                                    >
                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                                      <div>
                                        <span className="font-medium text-gray-700">
                                          {entry.status}
                                        </span>
                                        {entry.note && (
                                          <span className="text-gray-500">
                                            {" "}
                                            — {entry.note}
                                          </span>
                                        )}
                                        <p className="text-xs text-gray-400">
                                          {formatOrderDate(entry.timestamp)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </m.div>
            )}

            {currentSection === "wishlist" && (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Your Wishlist
                  </h2>

                  <Link
                    to="/wishlist"
                    className="text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium flex items-center"
                  >
                    <ExternalLink size={14} className="mr-1" />
                    View Full Wishlist
                  </Link>
                </div>

                {wishlistHookLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-500"></div>
                  </div>
                ) : (
                  <>
                    {hookWishlistItems.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <Heart
                          size={48}
                          className="mx-auto text-gray-300 mb-4"
                        />
                        <h3 className="text-xl font-medium text-gray-700 mb-2">
                          Your wishlist is empty
                        </h3>
                        <p className="text-gray-500 mb-6">
                          You haven't added any products to your wishlist yet.
                        </p>
                        <Link
                          to="/products"
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                        >
                          Explore Products
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hookWishlistItems.slice(0, 6).map((item) => (
                          <div
                            key={item.id}
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <Link to={`/product/${item.id}`} className="block">
                              <div className="h-36 overflow-hidden">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover transition-transform hover:scale-105"
                                />
                              </div>
                            </Link>

                            <div className="p-4">
                              <Link
                                to={`/product/${item.id}`}
                                className="block mb-2"
                              >
                                <h3 className="font-medium text-gray-800 line-clamp-1">
                                  {item.name}
                                </h3>
                              </Link>

                              <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-gray-900">
                                  {formatPrice(item.price)}
                                </span>
                                {item.originalPrice &&
                                  item.originalPrice > item.price && (
                                    <span className="text-sm text-gray-500 line-through">
                                      {formatPrice(item.originalPrice)}
                                    </span>
                                  )}
                              </div>

                              <div className="flex space-x-2">
                                <Link
                                  to={`/product/${item.id}`}
                                  className="flex-grow py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm"
                                >
                                  View Details
                                </Link>

                                <button
                                  onClick={() =>
                                    handleRemoveFromWishlist(item.id)
                                  }
                                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                  aria-label="Remove from wishlist"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {hookWishlistItems.length > 6 && (
                      <div className="mt-6 text-center">
                        <Link
                          to="/wishlist"
                          className="text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium inline-flex items-center"
                        >
                          View all {hookWishlistItems.length} items in your
                          wishlist
                          <ExternalLink size={14} className="ml-1" />
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </m.div>
            )}

            {currentSection === "reviews" && (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <UserReviews />
              </m.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyAccount;
