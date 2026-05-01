import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { toast } from "react-toastify";
import {
  Truck, ShieldCheck, ArrowLeft, ShoppingCart, ChevronDown, ChevronUp,
  Star, Globe, Award, Minus, Plus, Loader2, CheckCircle, ExternalLink,
  Key, Clock, Users, RefreshCw, Wifi, Cloud, BookOpen, Zap,
} from "lucide-react";
import { m } from "framer-motion";
import WishlistButton from "../components/WishlistButton";
import { Helmet } from "react-helmet-async";
import ProductReviews from "../components/ProductReviews";
import ProductReviewForm from "../components/ProductReviewForm";
import ProductCard from "../components/ProductCard";

const formatPrice = (price) => {
  if (!price) return "M0";
  const num = Number(price) || 0;
  return `M${num.toLocaleString("en-LS", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const calculateDiscount = (mrp, price) => {
  if (!mrp || !price || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};

const billingLabel = (cycle, custom) => {
  if (!cycle) return "";
  if (cycle === "custom") return custom || "period";
  return cycle;
};

// Category icon mapping
const categoryIcon = (type) => {
  const map = {
    "Laptops & Notebooks": "💻", "Desktops & All-in-Ones": "🖥️",
    "Servers & Infrastructure": "🗄️", "Computer Components & Parts": "🔧",
    "Monitors & Displays": "🖥", "Networking & Connectivity": "📡",
    "Printers & Scanners": "🖨️", "Storage Devices": "💾",
    "Accessories & Peripherals": "🖱️", "Smartphones & Tablets": "📱",
    "Software & Licenses": "📦", "Cloud Services & SaaS": "☁️",
    "Web Hosting & Domains": "🌐", "VPS & Dedicated Servers": "🗄️",
    "Managed IT Services": "🛠️", "Cybersecurity Services": "🔐",
    "Online Courses & Training": "🎓", "API & Developer Tools": "⚙️",
    "Data & Analytics Services": "📊", "Backup & Disaster Recovery": "🔄",
    "Telecommunications": "📞", "IT Consulting & Projects": "💡",
  };
  return map[type] || "📦";
};

// ─── Service-specific badge strip ───
function ServiceBadges({ product }) {
  const badges = [];
  if (product.trialPeriodDays > 0)
    badges.push({ icon: <Zap className="w-4 h-4" />, text: `${product.trialPeriodDays}-day free trial`, color: "bg-green-50 text-green-700 border-green-200" });
  if (product.sla?.uptime)
    badges.push({ icon: <ShieldCheck className="w-4 h-4" />, text: `${product.sla.uptime} uptime SLA`, color: "bg-purple-50 text-purple-700 border-purple-200" });
  if (product.supportTier && product.supportTier !== "community")
    badges.push({ icon: <Users className="w-4 h-4" />, text: `${product.supportTier.replace("-", " ")} support`, color: "bg-blue-50 text-blue-700 border-blue-200" });
  if (product.renewalType)
    badges.push({ icon: <RefreshCw className="w-4 h-4" />, text: product.renewalType === "auto" ? "Auto-renewal" : product.renewalType === "manual" ? "Manual renewal" : "One-time purchase", color: "bg-gray-50 text-gray-700 border-gray-200" });
  if (product.certificateIncluded)
    badges.push({ icon: <Award className="w-4 h-4" />, text: "Certificate included", color: "bg-amber-50 text-amber-700 border-amber-200" });

  if (!badges.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b, i) => (
        <span key={i} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${b.color}`}>
          {b.icon}{b.text}
        </span>
      ))}
    </div>
  );
}

// ─── Feature checklist ───
function FeatureList({ features, isService }) {
  if (!features?.length) return null;
  return (
    <div className={`rounded-2xl p-5 border ${isService ? "bg-purple-50 border-purple-100" : "bg-blue-50 border-blue-100"}`}>
      <h3 className={`font-bold text-sm uppercase tracking-wider mb-3 ${isService ? "text-purple-700" : "text-blue-700"}`}>
        {isService ? "What is Included" : "Key Features"}
      </h3>
      <ul className="space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isService ? "text-purple-500" : "text-blue-500"}`} />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Spec table ───
function SpecTable({ specifications }) {
  if (!specifications?.length) return null;
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {specifications.map((spec, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
              <td className="px-4 py-2.5 font-semibold text-gray-700 w-1/3">{spec.key}</td>
              <td className="px-4 py-2.5 text-gray-600">{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Service plan card (right-column sticky) ───
function ServicePurchasePanel({ product, user, dispatch, navigate }) {
  const [loading, setLoading] = useState(false);
  const disc = calculateDiscount(product.mrp, product.price);

  const handleSubscribe = () => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      navigate("/signin");
      return;
    }
    dispatch(addToCart({ productId: product.id, quantity: 1 }));
    toast.success("Added to cart! Proceed to checkout to complete your subscription.");
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden sticky top-4">
      {/* Price header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-5 text-white">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black">{formatPrice(product.price)}</span>
          {product.billingCycle && product.billingCycle !== "one-time" && (
            <span className="text-purple-200 text-sm">/ {billingLabel(product.billingCycle, product.customBillingLabel)}</span>
          )}
        </div>
        {disc > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-purple-200 line-through text-sm">{formatPrice(product.mrp)}</span>
            <span className="bg-white text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">{disc}% OFF</span>
          </div>
        )}
        {product.billingCycle === "monthly" && product.annualPrice && (
          <p className="text-xs text-purple-200 mt-1">
            or {formatPrice(product.annualPrice)}/year (save {Math.round((1 - (product.annualPrice / (product.price * 12))) * 100)}%)
          </p>
        )}
        {product.trialPeriodDays > 0 && (
          <div className="mt-3 bg-white/20 rounded-lg px-3 py-2 text-sm font-semibold">
            ✅ {product.trialPeriodDays}-day free trial — no commitment
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Setup fee */}
        {product.setupFee > 0 && (
          <p className="text-xs text-gray-500 text-center">+ {formatPrice(product.setupFee)} one-time setup fee</p>
        )}

        {/* Subscribe button */}
        <button
          onClick={handleSubscribe}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          <Zap className="w-5 h-5" />
          {product.trialPeriodDays > 0 ? `Start Free Trial` : "Subscribe / Get Access"}
        </button>

        {product.accessLink && (
          <a href={product.accessLink} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 border-2 border-purple-200 text-purple-700 font-semibold py-2.5 rounded-xl hover:bg-purple-50 transition-all text-sm"
          >
            <ExternalLink className="w-4 h-4" /> View Service Portal
          </a>
        )}

        {/* Delivery method */}
        <div className={`flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-2 ${
          product.deliveryMethod === "instant" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
        }`}>
          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
          {product.deliveryMethod === "instant"
            ? "⚡ Instant digital delivery after payment"
            : product.deliveryMethod === "scheduled"
            ? "📅 Delivered on agreed activation date"
            : "🛠️ Delivered after admin setup"}
        </div>

        {/* Quick facts */}
        <ul className="space-y-2 text-xs text-gray-600 pt-1 border-t border-gray-100">
          {product.sla?.uptime && (
            <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-purple-500" /> {product.sla.uptime} uptime SLA</li>
          )}
          {product.supportTier && (
            <li className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-purple-500" /> {product.supportTier.replace(/-/g, " ")} support</li>
          )}
          {product.maxUsers > 0 && (
            <li className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-purple-500" /> Up to {product.maxUsers} users</li>
          )}
          {product.maxUsers === 0 && product.licenseType && (
            <li className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-purple-500" /> {product.licenseType.replace(/-/g, " ")} license</li>
          )}
          {product.apiKeyProvided && (
            <li className="flex items-center gap-2"><Key className="w-3.5 h-3.5 text-purple-500" /> API key / licence key included</li>
          )}
          {product.renewalType && (
            <li className="flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 text-purple-500" />
              {product.renewalType === "auto" ? "Auto-renewal enabled" : product.renewalType === "manual" ? "Renew when ready" : "One-time — no renewal"}
            </li>
          )}
          {product.certificateIncluded && (
            <li className="flex items-center gap-2"><Award className="w-3.5 h-3.5 text-amber-500" /> Certificate of completion included</li>
          )}
          {product.courseDuration && (
            <li className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-blue-500" /> Duration: {product.courseDuration}</li>
          )}
          {product.contractLength && (
            <li className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-blue-500" /> Contract: {product.contractLength}</li>
          )}
          {product.dataQuota && (
            <li className="flex items-center gap-2"><Wifi className="w-3.5 h-3.5 text-blue-500" /> Quota: {product.dataQuota}</li>
          )}
        </ul>
      </div>
    </div>
  );
}

// ─── Goods purchase panel ───
function GoodsPurchasePanel({ product, quantity, setQuantity, user, dispatch, navigate }) {
  const disc = calculateDiscount(product.mrp, product.price);
  const inStock = product.stock > 0;

  const handleAddToCart = () => {
    if (!user) { toast.error("Please sign in to add items to your cart"); navigate("/signin"); return; }
    if (!inStock) { toast.warning("This product is currently out of stock"); return; }
    dispatch(addToCart({ productId: product.id, quantity }));
    toast.success(`Added ${quantity} item(s) to cart!`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-4 space-y-0">
      {/* Price */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 p-5 text-white">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black">{formatPrice(product.price)}</span>
          {disc > 0 && (
            <>
              <span className="text-gray-400 line-through text-lg">{formatPrice(product.mrp)}</span>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{disc}% OFF</span>
            </>
          )}
        </div>
        {disc > 0 && (
          <p className="text-green-400 text-sm font-semibold mt-1">
            You save {formatPrice(product.mrp - product.price)}
          </p>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Stock */}
        <div className={`flex items-center gap-2 text-sm font-semibold rounded-lg px-3 py-2 ${
          inStock ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          <div className={`w-2 h-2 rounded-full ${inStock ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          {inStock ? `${product.stock} unit${product.stock !== 1 ? "s" : ""} in stock` : "Out of stock"}
        </div>

        {/* Quantity */}
        {inStock && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Quantity</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl border-2 border-gray-300 flex items-center justify-center hover:border-gray-900 transition-all">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-lg font-bold text-gray-900">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-10 h-10 rounded-xl border-2 border-gray-300 flex items-center justify-center hover:border-gray-900 transition-all">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow"
        >
          <ShoppingCart className="w-5 h-5" />
          {inStock ? "Add to Cart" : "Out of Stock"}
        </button>

        {/* Trust */}
        <ul className="space-y-2 text-xs text-gray-600 pt-1 border-t border-gray-100">
          <li className="flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-blue-500" /> Free delivery on orders over M500</li>
          <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Secure payment</li>
          {product.warranty?.available && (
            <li className="flex items-center gap-2"><Award className="w-3.5 h-3.5 text-amber-500" /> {product.warranty.period} warranty included</li>
          )}
          {product.importDetails?.isImported && (
            <li className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-purple-500" /> Imported from {product.importDetails.country}</li>
          )}
          {product.origin && (
            <li className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-purple-500" /> Made in {product.origin}</li>
          )}
        </ul>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════
function ProductView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [expandedSections, setExpandedSections] = useState({
    description: true, sla: true, warranty: false, shipping: false,
  });

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user?.currentUser);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() };
          setProduct(productData);
          const productsRef = collection(db, "products");
          const typeQuery = query(productsRef, where("type", "==", productData.type), limit(5));
          const querySnapshot = await getDocs(typeQuery);
          setSimilarProducts(querySnapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((p) => p.id !== productData.id));
        } else {
          toast.error("Product not found!");
          navigate("/products");
        }
      } catch (error) {
        toast.error("An error occurred while loading.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const toggleSection = (s) => setExpandedSections((p) => ({ ...p, [s]: !p[s] }));

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 text-gray-900 animate-spin mb-4" />
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }
  if (!product) return null;

  const isService = product.listingType === "service";
  const isCourse  = product.type === "Online Courses & Training";

  return (
    <>
      <Helmet>
        <title>{product.name} | TechHub Lesotho</title>
        <meta name="description" content={product.description || product.name} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">

          {/* Back */}
          <m.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </m.button>

          {/* Category + type breadcrumb */}
          <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-4 flex-wrap"
          >
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
              isService ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              {isService ? <Cloud className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
              {isService ? "Digital Service" : "Physical Product"}
            </span>
            {product.type && (
              <span className="text-xs text-gray-500">
                {categoryIcon(product.type)} {product.type}
              </span>
            )}
          </m.div>

          {/* ── MAIN GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 mb-12">

            {/* Left col — image + details */}
            <div className="lg:col-span-2 space-y-6">

              {/* Image */}
              <m.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                <div className={`rounded-2xl overflow-hidden shadow-lg border aspect-square ${
                  isService ? "border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50" : "border-gray-100 bg-white"
                }`}>
                  <img src={product.image} alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Thumbnail row */}
                {(product.image2 || product.image3) && (
                  <div className="flex gap-3 mt-3">
                    {[product.image2, product.image3].filter(Boolean).map((img, i) => (
                      <img key={i} src={img} alt="" className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-purple-400 transition-all" />
                    ))}
                  </div>
                )}
              </m.div>

              {/* Name, brand, rating */}
              <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
                {product.brand && (
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{product.brand}</span>
                )}
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{product.name}</h1>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg">
                    <Star className="w-4 h-4 fill-amber-500 stroke-amber-500" />
                    <span className="text-sm font-bold text-amber-700">4.5</span>
                  </div>
                  <span className="text-sm text-gray-500">(128 reviews)</span>
                  <div className="flex-1" />
                  <WishlistButton product={product} size="sm" />
                </div>

                {/* Service badges row */}
                {isService && <ServiceBadges product={product} />}
              </m.div>

              {/* Description */}
              <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <p className="text-gray-600 leading-relaxed">{product.description || "No description available."}</p>
              </m.div>

              {/* Features / what is included */}
              {product.features?.length > 0 && (
                <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <FeatureList features={product.features} isService={isService} />
                </m.div>
              )}

              {/* Specs table */}
              {product.specifications?.length > 0 && (
                <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <h3 className="font-bold text-gray-900 mb-3">
                    {isService ? "Plan Specifications" : "Technical Specifications"}
                  </h3>
                  <SpecTable specifications={product.specifications} />
                </m.div>
              )}

              {/* ── SERVICE SPECIFIC INFO PANELS ── */}
              {isService && (
                <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="space-y-4">

                  {/* Getting started / access instructions */}
                  {product.accessInstructions && (
                    <div className="bg-gray-900 text-green-400 rounded-2xl p-5 font-mono text-sm">
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-3 font-sans font-semibold">📋 Getting Started</p>
                      <p className="whitespace-pre-line leading-relaxed">{product.accessInstructions}</p>
                    </div>
                  )}

                  {/* API key / credentials notice */}
                  {product.apiKeyProvided && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <Key className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-800 text-sm">API Key / Licence Key Included</p>
                        <p className="text-amber-700 text-xs mt-0.5">
                          Your unique key will be delivered to your email
                          {product.credentialsDelivery === "dashboard" ? " and shown in your account dashboard" :
                           product.credentialsDelivery === "both" ? " and shown in your account dashboard" : ""} after purchase.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Course-specific */}
                  {isCourse && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {product.courseFormat && (
                        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                          <BookOpen className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">Format</p>
                          <p className="text-sm font-bold text-gray-800 capitalize">{product.courseFormat.replace(/-/g, " ")}</p>
                        </div>
                      )}
                      {product.courseDuration && (
                        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                          <Clock className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="text-sm font-bold text-gray-800">{product.courseDuration}</p>
                        </div>
                      )}
                      {product.certificateIncluded && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                          <Award className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                          <p className="text-xs text-amber-600">Certificate</p>
                          <p className="text-sm font-bold text-amber-700">Included</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SLA accordion */}
                  {(product.sla?.uptime || product.sla?.details) && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <button onClick={() => toggleSection("sla")}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                        <span className="font-bold text-gray-900">Service Level Agreement (SLA)</span>
                        {expandedSections.sla ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                      </button>
                      {expandedSections.sla && (
                        <div className="px-5 pb-5 space-y-3 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            {product.sla?.uptime && (
                              <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-xs text-green-600 font-semibold">Uptime</p>
                                <p className="text-lg font-black text-green-700">{product.sla.uptime}</p>
                              </div>
                            )}
                            {product.sla?.responseTime && (
                              <div className="bg-blue-50 rounded-lg p-3">
                                <p className="text-xs text-blue-600 font-semibold">Response Time</p>
                                <p className="text-sm font-bold text-blue-700">{product.sla.responseTime}</p>
                              </div>
                            )}
                          </div>
                          {product.sla?.details && (
                            <p className="text-sm text-gray-600 leading-relaxed">{product.sla.details}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Additional info / terms */}
                  {product.additionalInfo && (
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Terms & Notes</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{product.additionalInfo}</p>
                    </div>
                  )}
                </m.div>
              )}

              {/* ── GOODS SPECIFIC INFO PANELS ── */}
              {!isService && (
                <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="space-y-4">
                  {/* Import */}
                  {product.importDetails?.isImported && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <button onClick={() => toggleSection("shipping")}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                        <span className="font-bold text-gray-900">Shipping & Import Details</span>
                        {expandedSections.shipping ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                      </button>
                      {expandedSections.shipping && (
                        <div className="px-5 pb-5 border-t border-gray-100">
                          <div className="flex items-start gap-3 mt-3">
                            <Globe className="w-5 h-5 text-purple-600 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-gray-900">Imported from {product.importDetails.country}</p>
                              {product.importDetails.deliveryNote && (
                                <p className="text-sm text-gray-600 mt-1">{product.importDetails.deliveryNote}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Warranty */}
                  {product.warranty?.available && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <button onClick={() => toggleSection("warranty")}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                        <span className="font-bold text-gray-900">Warranty Information</span>
                        {expandedSections.warranty ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                      </button>
                      {expandedSections.warranty && (
                        <div className="px-5 pb-5 border-t border-gray-100">
                          <div className="flex items-start gap-3 mt-3">
                            <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-gray-900">{product.warranty.period} Warranty</p>
                              <p className="text-sm text-gray-600 mt-1">{product.warranty.details}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {product.additionalInfo && (
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Additional Information</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{product.additionalInfo}</p>
                    </div>
                  )}
                </m.div>
              )}
            </div>

            {/* Right col — purchase panel */}
            <div className="lg:col-span-1">
              <m.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                {isService ? (
                  <ServicePurchasePanel product={product} user={user} dispatch={dispatch} navigate={navigate} />
                ) : (
                  <GoodsPurchasePanel product={product} quantity={quantity} setQuantity={setQuantity}
                    user={user} dispatch={dispatch} navigate={navigate} />
                )}
              </m.div>
            </div>
          </div>

          {/* Reviews */}
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-12">
            <h2 className="text-2xl font-black text-gray-900 mb-4">
              {isService ? "Customer Reviews" : "Customer Reviews"}
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <ProductReviewForm productId={product.id} />
              <div className="mt-8"><ProductReviews productId={product.id} /></div>
            </div>
          </m.div>

          {/* Similar */}
          {similarProducts.length > 0 && (
            <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h2 className="text-2xl font-black text-gray-900 mb-4">
                {isService ? "Other Services You May Like" : "Similar Products"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {similarProducts.map((p) => (
                  <ProductCard key={p.id} product={p}
                    onAddToCart={(prod) => { dispatch(addToCart({ productId: prod.id, quantity: 1 })); toast.success("Added to cart!"); }}
                  />
                ))}
              </div>
            </m.div>
          )}
        </div>
      </div>
    </>
  );
}

export default ProductView;
