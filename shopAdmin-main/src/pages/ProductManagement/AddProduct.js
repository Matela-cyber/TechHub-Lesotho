import { useState } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  Image as ImageIcon,
  Tag,
  Info,
  Check,
  X,
  Plus,
  Trash2,
  Globe,
  Shield,
  Clock,
  Zap,
  Users,
  RefreshCw,
  Link as LinkIcon,
  Server,
  Key,
  Wifi,
  Monitor,
  HardDrive,
  Cpu,
  Smartphone,
  Printer,
  Cloud,
  BookOpen,
  Lock,
  LifeBuoy,
} from "react-feather";
import { Button, Card, Input, Alert, Badge } from "../../components/ui";
import { toast } from "react-toastify";

// ─────────────────────────────────────────────
//  CATEGORY DEFINITIONS
// ─────────────────────────────────────────────
const GOODS_CATEGORIES = [
  { value: "Laptops & Notebooks",         label: "Laptops & Notebooks",         icon: "💻" },
  { value: "Desktops & All-in-Ones",      label: "Desktops & All-in-Ones",      icon: "🖥️" },
  { value: "Servers & Infrastructure",    label: "Servers & Infrastructure",     icon: "🗄️" },
  { value: "Computer Components & Parts", label: "Computer Components & Parts",  icon: "🔧" },
  { value: "Monitors & Displays",         label: "Monitors & Displays",          icon: "🖥" },
  { value: "Networking & Connectivity",   label: "Networking & Connectivity",    icon: "📡" },
  { value: "Printers & Scanners",         label: "Printers & Scanners",          icon: "🖨️" },
  { value: "Storage Devices",             label: "Storage Devices (HDD/SSD/NAS)", icon: "💾" },
  { value: "Accessories & Peripherals",   label: "Accessories & Peripherals",    icon: "🖱️" },
  { value: "Smartphones & Tablets",       label: "Smartphones & Tablets",        icon: "📱" },
  { value: "UPS & Power Solutions",       label: "UPS & Power Solutions",        icon: "🔋" },
  { value: "Cabling & Connectors",        label: "Cabling & Connectors",         icon: "🔌" },
];

const SERVICE_CATEGORIES = [
  { value: "Software & Licenses",         label: "Software & Licenses",          icon: "📦", hint: "One-time or subscription software keys" },
  { value: "Cloud Services & SaaS",       label: "Cloud Services & SaaS",        icon: "☁️", hint: "Microsoft 365, Google Workspace, CRM, ERP" },
  { value: "Web Hosting & Domains",       label: "Web Hosting & Domains",        icon: "🌐", hint: "Shared, VPS, dedicated, domain registration" },
  { value: "VPS & Dedicated Servers",     label: "VPS & Dedicated Servers",      icon: "🗄️", hint: "Root access, cPanel, custom specs" },
  { value: "Managed IT Services",         label: "Managed IT Services",          icon: "🛠️", hint: "Support contracts, remote management, helpdesk" },
  { value: "Cybersecurity Services",      label: "Cybersecurity Services",       icon: "🔐", hint: "Security audits, antivirus subscriptions, SOC" },
  { value: "Online Courses & Training",   label: "Online Courses & Training",    icon: "🎓", hint: "Self-paced or instructor-led courses" },
  { value: "API & Developer Tools",       label: "API & Developer Tools",        icon: "⚙️", hint: "API access, SDKs, developer subscriptions" },
  { value: "Data & Analytics Services",   label: "Data & Analytics Services",    icon: "📊", hint: "Data storage, BI tools, analytics platforms" },
  { value: "Backup & Disaster Recovery",  label: "Backup & Disaster Recovery",   icon: "🔄", hint: "Cloud backup, DR plans, replication" },
  { value: "Telecommunications",          label: "Telecommunications",           icon: "📞", hint: "VoIP, PBX, internet bundles, SIM plans" },
  { value: "IT Consulting & Projects",    label: "IT Consulting & Projects",     icon: "💡", hint: "Project-based or retainer consulting" },
];

const SERVICE_CATEGORY_SET = new Set(SERVICE_CATEGORIES.map((c) => c.value));

const brands = [
  "Dell", "HP", "Apple", "Lenovo", "Asus", "Acer", "Microsoft", "Samsung",
  "Intel", "AMD", "Cisco", "TP-Link", "Seagate", "Western Digital",
  "Logitech", "SanDisk", "Fortinet", "Ubiquiti", "Synology", "Sophos",
  "Adobe", "Autodesk", "VMware", "Google", "Amazon Web Services",
  "Datamak Technologies", "TechHub Lesotho", "Other",
];

// ─────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────
const AddProduct = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("basic");
  const [listingType, setListingType] = useState("good");

  const [newProduct, setNewProduct] = useState({
    name: "", description: "", price: "", mrp: "", sellingPrice: "",
    brand: "", type: "", image: "", image2: "", image3: "",
    showOnHome: false, tags: [], slug: "", additionalInfo: "",
    features: [], specifications: [],
    // Goods
    stock: "", origin: "",
    warranty: { available: false, period: "", details: "" },
    guarantee: { available: false, period: "", details: "" },
    importDetails: { isImported: false, country: "", deliveryNote: "" },
    // Services
    billingCycle: "monthly",
    customBillingLabel: "",
    annualPrice: "",
    trialPeriodDays: "0",
    accessLink: "",
    accessInstructions: "",
    deliveryMethod: "instant",
    licenseType: "individual",
    maxUsers: "0",
    apiKeyProvided: false,
    credentialsDelivery: "email",
    sla: { uptime: "99.9%", responseTime: "24 hours", details: "" },
    supportTier: "email",
    renewalType: "manual",
    setupFee: "",
    // Telecoms / internet
    dataQuota: "",
    contractLength: "",
    // Course specific
    courseDuration: "",
    courseFormat: "self-paced",
    certificateIncluded: false,
  });

  const [tagInput, setTagInput] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState({ checked: false, available: false });
  const [errors, setErrors] = useState({});

  const isService = listingType === "service";

  const tabs = [
    { id: "basic",   label: "Basic Info",    icon: Package },
    { id: "pricing", label: "Pricing",       icon: Tag },
    { id: "images",  label: "Images",        icon: ImageIcon },
    { id: "details", label: "Details",       icon: Info },
    isService
      ? { id: "service",  label: "Service Config", icon: Server }
      : { id: "warranty", label: "Warranty & Import", icon: Shield },
  ];

  const handleCategoryChange = (value) => {
    const detected = SERVICE_CATEGORY_SET.has(value) ? "service" : "good";
    setListingType(detected);
    setNewProduct((p) => ({ ...p, type: value }));
  };

  const validateForm = () => {
    const e = {};
    if (!newProduct.name)         e.name = "Name is required";
    if (!newProduct.sellingPrice) e.sellingPrice = "Price is required";
    if (!newProduct.slug)         e.slug = "URL slug is required";
    if (!slugAvailability.available) e.slug = "Please check slug availability";
    if (!newProduct.image)        e.image = "At least one image is required";
    if (!isService && (!newProduct.stock || newProduct.stock < 0))
      e.stock = "Valid stock quantity is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const checkSlugAvailability = async () => {
    if (!newProduct.slug) { toast.error("Please enter a URL slug"); return; }
    try {
      const formatted = newProduct.slug.toLowerCase().trim()
        .replace(/\s+/g, "-").replace(/[^\w-]/g, "");
      setNewProduct((p) => ({ ...p, slug: formatted }));
      const snap = await getDoc(doc(db, "products", formatted));
      setSlugAvailability({ checked: true, available: !snap.exists() });
      snap.exists() ? toast.error("Slug already taken") : toast.success("Slug is available!");
    } catch (err) {
      toast.error("Failed to check slug");
    }
  };

  const handleAddProduct = async () => {
    if (!validateForm()) { toast.error("Please fill in all required fields"); return; }
    try {
      setIsSubmitting(true);
      const formattedSlug = newProduct.slug.toLowerCase().trim()
        .replace(/\s+/g, "-").replace(/[^\w-]/g, "");

      const base = {
        name: newProduct.name,
        description: newProduct.description,
        brand: newProduct.brand,
        type: newProduct.type,
        listingType,
        image: newProduct.image,
        image2: newProduct.image2,
        image3: newProduct.image3,
        showOnHome: newProduct.showOnHome,
        tags: newProduct.tags,
        features: newProduct.features,
        specifications: newProduct.specifications,
        additionalInfo: newProduct.additionalInfo,
        sellingPrice: Number(newProduct.sellingPrice || newProduct.price),
        mrp: Number(newProduct.mrp || newProduct.sellingPrice || newProduct.price),
        price: Number(newProduct.sellingPrice || newProduct.price),
        slug: formattedSlug,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const extra = isService ? {
        billingCycle: newProduct.billingCycle,
        customBillingLabel: newProduct.customBillingLabel,
        annualPrice: newProduct.annualPrice ? Number(newProduct.annualPrice) : null,
        trialPeriodDays: Number(newProduct.trialPeriodDays) || 0,
        accessLink: newProduct.accessLink,
        accessInstructions: newProduct.accessInstructions,
        deliveryMethod: newProduct.deliveryMethod,
        licenseType: newProduct.licenseType,
        maxUsers: Number(newProduct.maxUsers) || 0,
        apiKeyProvided: newProduct.apiKeyProvided,
        credentialsDelivery: newProduct.credentialsDelivery,
        sla: newProduct.sla,
        supportTier: newProduct.supportTier,
        renewalType: newProduct.renewalType,
        setupFee: newProduct.setupFee ? Number(newProduct.setupFee) : 0,
        dataQuota: newProduct.dataQuota,
        contractLength: newProduct.contractLength,
        courseDuration: newProduct.courseDuration,
        courseFormat: newProduct.courseFormat,
        certificateIncluded: newProduct.certificateIncluded,
        stock: 999999,
      } : {
        stock: Number(newProduct.stock),
        warranty: newProduct.warranty,
        guarantee: newProduct.guarantee,
        importDetails: newProduct.importDetails,
        origin: newProduct.origin,
      };

      await setDoc(doc(db, "products", formattedSlug), { ...base, ...extra });
      toast.success(`${isService ? "Service" : "Product"} added successfully!`);
      setTimeout(() => navigate("/products"), 1500);
    } catch (err) {
      toast.error("Failed to add listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !newProduct.tags.includes(tagInput.trim())) {
      setNewProduct((p) => ({ ...p, tags: [...p.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };
  const removeTag = (t) => setNewProduct((p) => ({ ...p, tags: p.tags.filter((x) => x !== t) }));

  const addFeature = () => {
    if (featureInput.trim()) {
      setNewProduct((p) => ({ ...p, features: [...p.features, featureInput.trim()] }));
      setFeatureInput("");
    }
  };
  const removeFeature = (i) => setNewProduct((p) => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }));

  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setNewProduct((p) => ({ ...p, specifications: [...p.specifications, { key: specKey.trim(), value: specValue.trim() }] }));
      setSpecKey(""); setSpecValue("");
    }
  };
  const removeSpecification = (i) => setNewProduct((p) => ({ ...p, specifications: p.specifications.filter((_, idx) => idx !== i) }));

  const discountPct = () => {
    const mrp = Number(newProduct.mrp), sell = Number(newProduct.sellingPrice);
    return mrp > sell && sell > 0 ? Math.round(((mrp - sell) / mrp) * 100) : 0;
  };

  const selectedServiceCategory = SERVICE_CATEGORIES.find((c) => c.value === newProduct.type);
  const isTelecom  = ["Telecommunications"].includes(newProduct.type);
  const isCourse   = newProduct.type === "Online Courses & Training";
  const isApiTool  = newProduct.type === "API & Developer Tools";
  const isHosting  = ["Web Hosting & Domains", "VPS & Dedicated Servers"].includes(newProduct.type);

  // ─── UI helpers ────────────────────────────
  const serviceColor = isService ? "purple" : "blue";
  const ringCls      = isService ? "focus:ring-purple-500" : "focus:ring-blue-500";
  const accentCls    = isService ? "text-purple-600" : "text-blue-600";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Listing</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isService
              ? "Creating a Digital Service / Subscription listing"
              : "Creating a Physical IT Product listing"}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/products")} icon={<X className="w-4 h-4" />}>Cancel</Button>
      </div>

      {/* Listing Type Toggle */}
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Select listing type</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={() => setListingType("good")}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              !isService ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`p-2 rounded-lg ${!isService ? "bg-blue-100" : "bg-gray-100"}`}>
              <Package className={`w-6 h-6 ${!isService ? "text-blue-600" : "text-gray-500"}`} />
            </div>
            <div>
              <p className={`font-bold ${!isService ? "text-blue-700" : "text-gray-700"}`}>Physical IT Product</p>
              <p className="text-xs text-gray-500 mt-0.5">Laptop, desktop, server, networking gear, accessories</p>
            </div>
            {!isService && <Check className="w-5 h-5 text-blue-600 ml-auto" />}
          </button>

          <button type="button" onClick={() => setListingType("service")}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              isService ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`p-2 rounded-lg ${isService ? "bg-purple-100" : "bg-gray-100"}`}>
              <Cloud className={`w-6 h-6 ${isService ? "text-purple-600" : "text-gray-500"}`} />
            </div>
            <div>
              <p className={`font-bold ${isService ? "text-purple-700" : "text-gray-700"}`}>Digital Service / Subscription</p>
              <p className="text-xs text-gray-500 mt-0.5">SaaS, hosting, cloud, courses, licenses, managed IT, API</p>
            </div>
            {isService && <Check className="w-5 h-5 text-purple-600 ml-auto" />}
          </button>
        </div>

        {/* Category hint banner */}
        {isService && selectedServiceCategory && (
          <div className="mt-3 flex items-center gap-2 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
            <span className="text-lg">{selectedServiceCategory.icon}</span>
            <span>{selectedServiceCategory.hint}</span>
          </div>
        )}
      </Card>

      {/* Progress Tabs */}
      <Card>
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button key={tab.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? isService ? "bg-purple-600 text-white shadow" : "bg-blue-600 text-white shadow"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </Card>

      {/* ══════════════════════════════════════════ */}
      {/* BASIC INFO TAB                            */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === "basic" && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">

          <Card title={isService ? "Service Information" : "Product Information"}
            icon={<Package className={`w-5 h-5 ${accentCls}`} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <Input label={isService ? "Service / Plan Name" : "Product Name"}
                placeholder={isService ? "e.g., Business Web Hosting – Starter Plan" : "e.g., Dell Latitude 5540 Laptop"}
                value={newProduct.name}
                onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                error={errors.name} required
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {isService ? "Provider / Vendor" : "Brand / Manufacturer"}
                </label>
                <select value={newProduct.brand}
                  onChange={(e) => setNewProduct((p) => ({ ...p, brand: e.target.value }))}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${ringCls}`}
                >
                  <option value="">Select {isService ? "Provider" : "Brand"}</option>
                  {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select value={newProduct.type}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${ringCls}`}
                >
                  <option value="">Select Category</option>
                  <optgroup label="━━━ Physical IT Products">
                    {GOODS_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="━━━ Digital Services & Subscriptions">
                    {SERVICE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {!isService ? (
                <Input label="Stock Quantity" type="number" placeholder="e.g., 25"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))}
                  error={errors.stock} required
                />
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Seats / User Licences</label>
                  <div className="flex gap-2 items-center">
                    <input type="number" min="0" value={newProduct.maxUsers}
                      onChange={(e) => setNewProduct((p) => ({ ...p, maxUsers: e.target.value }))}
                      placeholder="0 = unlimited"
                      className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${ringCls}`}
                    />
                    <span className="text-xs text-gray-500 whitespace-nowrap">0 = unlimited</span>
                  </div>
                </div>
              )}

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {isService ? "Service Description" : "Product Description"} <span className="text-red-500">*</span>
                </label>
                <textarea value={newProduct.description}
                  onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                  rows="4"
                  placeholder={isService
                    ? "Describe what this service does, who it is designed for, what is included in this plan, and any key differentiators..."
                    : "Describe the product including key specs, condition, and what is in the box..."}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${ringCls}`}
                />
              </div>
            </div>
          </Card>

          {/* IT-specific sub-fields for services */}
          {isService && (
            <Card title="Delivery & Access Configuration"
              icon={<Key className="w-5 h-5 text-purple-600" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">How is this delivered?</label>
                  <select value={newProduct.deliveryMethod}
                    onChange={(e) => setNewProduct((p) => ({ ...p, deliveryMethod: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="instant">⚡ Instant – automated (API key, link, credentials emailed immediately)</option>
                    <option value="manual-setup">🛠️ Manual Setup – admin configures then delivers</option>
                    <option value="scheduled">📅 Scheduled – on agreed activation date</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Credentials delivery method</label>
                  <select value={newProduct.credentialsDelivery}
                    onChange={(e) => setNewProduct((p) => ({ ...p, credentialsDelivery: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="email">📧 Emailed to customer</option>
                    <option value="dashboard">🖥️ Displayed in customer dashboard</option>
                    <option value="both">Both (email + dashboard)</option>
                    <option value="manual">🤝 Delivered manually by staff</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Service / Portal URL
                  </label>
                  <input type="url" value={newProduct.accessLink}
                    onChange={(e) => setNewProduct((p) => ({ ...p, accessLink: e.target.value }))}
                    placeholder="https://portal.yourdomain.com  or  https://app.vendor.com/login"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Where customers log in or access the service</p>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Access / Getting-Started Instructions
                  </label>
                  <textarea value={newProduct.accessInstructions}
                    onChange={(e) => setNewProduct((p) => ({ ...p, accessInstructions: e.target.value }))}
                    rows="3"
                    placeholder="Step-by-step instructions shown to customer after purchase. e.g., 1. Check your email for credentials. 2. Visit the portal URL above. 3. Enter your licence key..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                  <input type="checkbox" id="apiKey" checked={newProduct.apiKeyProvided}
                    onChange={(e) => setNewProduct((p) => ({ ...p, apiKeyProvided: e.target.checked }))}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <label htmlFor="apiKey" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    🔑 This service includes an API key / licence key delivered to the customer
                  </label>
                </div>
              </div>

              {/* Telecom extras */}
              {isTelecom && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                  <Input label="Data Quota / Bandwidth" placeholder="e.g., 100 GB/month, Unlimited"
                    value={newProduct.dataQuota}
                    onChange={(e) => setNewProduct((p) => ({ ...p, dataQuota: e.target.value }))}
                  />
                  <Input label="Contract Length" placeholder="e.g., Month-to-month, 12 months, 24 months"
                    value={newProduct.contractLength}
                    onChange={(e) => setNewProduct((p) => ({ ...p, contractLength: e.target.value }))}
                  />
                </div>
              )}

              {/* Course extras */}
              {isCourse && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                  <Input label="Course Duration" placeholder="e.g., 40 hours, 8 weeks, Self-paced"
                    value={newProduct.courseDuration}
                    onChange={(e) => setNewProduct((p) => ({ ...p, courseDuration: e.target.value }))}
                  />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Course Format</label>
                    <select value={newProduct.courseFormat}
                      onChange={(e) => setNewProduct((p) => ({ ...p, courseFormat: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="self-paced">📺 Self-paced (on-demand video)</option>
                      <option value="live-online">🎙️ Live online (scheduled)</option>
                      <option value="in-person">🏫 In-person / classroom</option>
                      <option value="blended">🔀 Blended (online + in-person)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="cert" checked={newProduct.certificateIncluded}
                      onChange={(e) => setNewProduct((p) => ({ ...p, certificateIncluded: e.target.checked }))}
                      className="w-4 h-4 accent-purple-600"
                    />
                    <label htmlFor="cert" className="text-sm font-semibold text-gray-700 cursor-pointer">
                      🏆 Certificate of completion included
                    </label>
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card title="Listing URL" icon={<Globe className="w-5 h-5 text-indigo-600" />}>
            <Alert variant="info" message="The URL slug is the unique web address for this listing. It cannot be changed after creation." />
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">URL Slug <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="bg-gray-100 px-3 py-2 border border-r-0 rounded-l-lg text-gray-500 text-sm">/product/</span>
                    <input type="text" value={newProduct.slug}
                      onChange={(e) => { setNewProduct((p) => ({ ...p, slug: e.target.value })); setSlugAvailability({ checked: false, available: false }); }}
                      placeholder="e.g., dell-latitude-5540 or ms365-business-basic"
                      className={`flex-1 px-3 py-2 border text-sm rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        slugAvailability.checked ? (slugAvailability.available ? "border-green-500" : "border-red-500") : ""
                      }`}
                    />
                  </div>
                  {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
                  {slugAvailability.checked && (
                    <p className={`text-xs mt-1 ${slugAvailability.available ? "text-green-600" : "text-red-600"}`}>
                      {slugAvailability.available ? "✅ URL is available!" : "❌ URL already taken"}
                    </p>
                  )}
                </div>
                <Button onClick={checkSlugAvailability} variant="outline" disabled={!newProduct.slug}>Check</Button>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => setActiveTab("pricing")} icon={<Tag className="w-4 h-4" />} iconPosition="right">
              Next: Pricing
            </Button>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* PRICING TAB                               */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === "pricing" && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <Card title="Pricing (M – Maloti / LSL)" icon={<Tag className="w-5 h-5 text-green-600" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {isService && (
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Billing Cycle</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: "one-time", label: "One-Time",  sub: "Pay once" },
                      { value: "monthly",  label: "Monthly",   sub: "Billed monthly" },
                      { value: "annual",   label: "Annual",    sub: "Billed yearly" },
                      { value: "custom",   label: "Custom",    sub: "Per GB, per call…" },
                    ].map((opt) => (
                      <button key={opt.value} type="button"
                        onClick={() => setNewProduct((p) => ({ ...p, billingCycle: opt.value }))}
                        className={`flex flex-col p-3 rounded-lg border-2 transition-all text-sm font-medium text-left ${
                          newProduct.billingCycle === opt.value
                            ? "border-purple-600 bg-purple-50 text-purple-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span className="font-bold">{opt.label}</span>
                        <span className="text-xs opacity-70 mt-0.5">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                  {newProduct.billingCycle === "custom" && (
                    <div className="mt-3">
                      <Input placeholder="e.g., Per project, Per GB, Per API call"
                        value={newProduct.customBillingLabel}
                        onChange={(e) => setNewProduct((p) => ({ ...p, customBillingLabel: e.target.value }))}
                        label="Custom Billing Label"
                      />
                    </div>
                  )}
                </div>
              )}

              {isService ? (
                <>
                  <Input
                    label={`Price (M) per ${newProduct.billingCycle === "custom" ? (newProduct.customBillingLabel || "period") : newProduct.billingCycle}`}
                    type="number" placeholder="M 0.00"
                    value={newProduct.sellingPrice}
                    onChange={(e) => setNewProduct((p) => ({ ...p, sellingPrice: e.target.value, price: e.target.value }))}
                    error={errors.sellingPrice} required
                  />

                  {newProduct.billingCycle === "monthly" && (
                    <Input label="Annual Price (M) — discounted yearly rate (optional)"
                      type="number" placeholder="M 0.00"
                      value={newProduct.annualPrice}
                      onChange={(e) => setNewProduct((p) => ({ ...p, annualPrice: e.target.value }))}
                    />
                  )}

                  <Input label="Compare-at / Original Price (M) — shown crossed out"
                    type="number" placeholder="M 0.00"
                    value={newProduct.mrp}
                    onChange={(e) => setNewProduct((p) => ({ ...p, mrp: e.target.value }))}
                  />

                  <Input label="One-time Setup / Activation Fee (M) — leave blank if free"
                    type="number" placeholder="M 0.00"
                    value={newProduct.setupFee}
                    onChange={(e) => setNewProduct((p) => ({ ...p, setupFee: e.target.value }))}
                  />

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Free Trial Period</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" value={newProduct.trialPeriodDays}
                        onChange={(e) => setNewProduct((p) => ({ ...p, trialPeriodDays: e.target.value }))}
                        placeholder="0"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-500 whitespace-nowrap">days (0 = no trial)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Renewal Type</label>
                    <select value={newProduct.renewalType}
                      onChange={(e) => setNewProduct((p) => ({ ...p, renewalType: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="auto">🔄 Auto-Renewal (charged automatically)</option>
                      <option value="manual">📋 Manual Renewal (customer renews)</option>
                      <option value="none">✅ No Renewal — one-time purchase</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <Input label="MRP — Maximum Retail Price (M)"
                    type="number" placeholder="M 0.00"
                    value={newProduct.mrp}
                    onChange={(e) => setNewProduct((p) => ({ ...p, mrp: e.target.value }))}
                  />
                  <Input label="Selling Price (M)" type="number" placeholder="M 0.00"
                    value={newProduct.sellingPrice}
                    onChange={(e) => setNewProduct((p) => ({ ...p, sellingPrice: e.target.value, price: e.target.value }))}
                    error={errors.sellingPrice} required
                  />
                </>
              )}

              {discountPct() > 0 && (
                <div className="col-span-1 md:col-span-2">
                  <Alert variant="success" title="Discount Applied"
                    message={`Customers save ${discountPct()}% on this listing.`} />
                </div>
              )}
            </div>
          </Card>

          <div className="flex justify-between">
            <Button onClick={() => setActiveTab("basic")} variant="outline">Back</Button>
            <Button onClick={() => setActiveTab("images")} icon={<ImageIcon className="w-4 h-4" />} iconPosition="right">Next: Images</Button>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* IMAGES TAB                                */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === "images" && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <Card title={isService ? "Service Logo / Screenshots" : "Product Images"}
            icon={<ImageIcon className="w-5 h-5 text-pink-600" />}>
            <Alert variant="info" message={isService
              ? "Use a service logo or screenshot. First image is the primary thumbnail on product listings."
              : "Use clear, high-resolution photos. First image is the main display image."
            } />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
              {["image", "image2", "image3"].map((imgKey, index) => (
                <div key={imgKey}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {index === 0 ? "Primary Image" : index === 1 ? "Secondary Image" : "Additional Image"}
                    {index === 0 && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <Input type="url" placeholder="https://..." value={newProduct[imgKey]}
                    onChange={(e) => setNewProduct((p) => ({ ...p, [imgKey]: e.target.value }))}
                    error={index === 0 ? errors.image : undefined} className="mb-0"
                  />
                  {newProduct[imgKey] && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-2 relative group">
                      <img src={newProduct[imgKey]} alt={`Preview ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-500 transition-all"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/300x200?text=Invalid+URL"; }}
                      />
                      <button onClick={() => setNewProduct((p) => ({ ...p, [imgKey]: "" }))}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-between">
            <Button onClick={() => setActiveTab("pricing")} variant="outline">Back</Button>
            <Button onClick={() => setActiveTab("details")} icon={<Info className="w-4 h-4" />} iconPosition="right">Next: Details</Button>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* DETAILS TAB                               */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === "details" && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">

          <Card title="Tags" icon={<Tag className="w-5 h-5 text-indigo-600" />}>
            <div className="flex flex-wrap gap-2 mb-4">
              {newProduct.tags.map((tag, i) => (
                <Badge key={i} variant="info">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-2 hover:text-red-500"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder={isService ? "e.g., cloud, SaaS, Microsoft, office365" : "e.g., dell, laptop, i7, gaming"}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="mb-0 flex-1"
              />
              <Button onClick={addTag} icon={<Plus className="w-4 h-4" />}>Add</Button>
            </div>
          </Card>

          <Card title={isService ? "What is Included (Plan Features)" : "Key Features"}
            icon={<Check className="w-5 h-5 text-green-600" />}>
            <div className="space-y-2 mb-4">
              {newProduct.features.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{f}</span>
                  </div>
                  <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={isService
                  ? "e.g., 50 GB NVMe SSD, Free SSL certificate, cPanel access, Daily backups..."
                  : "e.g., Intel Core i7-13th Gen, 16 GB RAM, Backlit keyboard..."}
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                className="mb-0 flex-1"
              />
              <Button onClick={addFeature} icon={<Plus className="w-4 h-4" />}>Add</Button>
            </div>
          </Card>

          <Card title={isService ? "Plan Specifications / Technical Specs" : "Technical Specifications"}
            icon={<Info className="w-5 h-5 text-blue-600" />}>
            <div className="space-y-2 mb-4">
              {newProduct.specifications.map((spec, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 flex-1 text-sm">
                    <span className="font-semibold text-gray-700">{spec.key}</span>
                    <span className="text-gray-600">{spec.value}</span>
                  </div>
                  <button onClick={() => removeSpecification(i)} className="text-red-400 hover:text-red-600 ml-4"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder={isService ? "e.g., Storage, vCPU, RAM, Bandwidth" : "e.g., Processor, RAM, Storage"}
                value={specKey} onChange={(e) => setSpecKey(e.target.value)} className="mb-0"
              />
              <div className="flex gap-2">
                <Input placeholder="Value" value={specValue} onChange={(e) => setSpecValue(e.target.value)} className="mb-0 flex-1" />
                <Button onClick={addSpecification} icon={<Plus className="w-4 h-4" />}>Add</Button>
              </div>
            </div>
          </Card>

          <Card title="Additional Notes">
            <div className="space-y-4">
              {!isService && (
                <Input label="Country of Origin" placeholder="e.g., USA, China, Germany, Japan"
                  value={newProduct.origin}
                  onChange={(e) => setNewProduct((p) => ({ ...p, origin: e.target.value }))}
                  className="mb-0"
                />
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {isService ? "Terms / Compatibility Notes / Fine Print" : "Additional Product Information"}
                </label>
                <textarea value={newProduct.additionalInfo}
                  onChange={(e) => setNewProduct((p) => ({ ...p, additionalInfo: e.target.value }))}
                  rows="3"
                  placeholder={isService
                    ? "Fair use policy, geographic restrictions, compatibility requirements, refund terms..."
                    : "Box contents, compatibility notes, known limitations..."}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="showOnHome" checked={newProduct.showOnHome}
                  onChange={(e) => setNewProduct((p) => ({ ...p, showOnHome: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="showOnHome" className="text-gray-700 cursor-pointer text-sm">⭐ Feature on homepage</label>
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button onClick={() => setActiveTab("images")} variant="outline">Back</Button>
            <Button
              onClick={() => setActiveTab(isService ? "service" : "warranty")}
              icon={isService ? <Server className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              iconPosition="right"
            >
              {isService ? "Next: Service Config" : "Next: Warranty"}
            </Button>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* WARRANTY TAB — goods only                 */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === "warranty" && !isService && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <Card title="Warranty & Guarantee" icon={<Shield className="w-5 h-5 text-yellow-600" />}>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <input type="checkbox" id="warranty" checked={newProduct.warranty.available}
                  onChange={(e) => setNewProduct((p) => ({ ...p, warranty: { ...p.warranty, available: e.target.checked } }))}
                  className="w-4 h-4"
                />
                <label htmlFor="warranty" className="font-semibold text-gray-700 cursor-pointer text-sm">This product includes a manufacturer warranty</label>
              </div>
              {newProduct.warranty.available && (
                <div className="pl-6 space-y-4">
                  <Input label="Warranty Period" placeholder="e.g., 1 year, 3 years, Lifetime"
                    value={newProduct.warranty.period}
                    onChange={(e) => setNewProduct((p) => ({ ...p, warranty: { ...p.warranty, period: e.target.value } }))}
                  />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Warranty Coverage Details</label>
                    <textarea value={newProduct.warranty.details}
                      onChange={(e) => setNewProduct((p) => ({ ...p, warranty: { ...p.warranty, details: e.target.value } }))}
                      rows="3" placeholder="What does the warranty cover? On-site, carry-in, parts only, labour included..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <input type="checkbox" id="guarantee" checked={newProduct.guarantee.available}
                  onChange={(e) => setNewProduct((p) => ({ ...p, guarantee: { ...p.guarantee, available: e.target.checked } }))}
                  className="w-4 h-4"
                />
                <label htmlFor="guarantee" className="font-semibold text-gray-700 cursor-pointer text-sm">This product includes a satisfaction guarantee</label>
              </div>
              {newProduct.guarantee.available && (
                <div className="pl-6 space-y-4">
                  <Input label="Guarantee Period" placeholder="e.g., 30 days, 90 days, Lifetime"
                    value={newProduct.guarantee.period}
                    onChange={(e) => setNewProduct((p) => ({ ...p, guarantee: { ...p.guarantee, period: e.target.value } }))}
                  />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Guarantee Details</label>
                    <textarea value={newProduct.guarantee.details}
                      onChange={(e) => setNewProduct((p) => ({ ...p, guarantee: { ...p.guarantee, details: e.target.value } }))}
                      rows="3" placeholder="Money-back guarantee, replacement policy, exchange conditions..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card title="Import & Shipping Information" icon={<Globe className="w-5 h-5 text-purple-600" />}>
            <div className="flex items-center gap-2 mb-4">
              <input type="checkbox" id="imported" checked={newProduct.importDetails.isImported}
                onChange={(e) => setNewProduct((p) => ({ ...p, importDetails: { ...p.importDetails, isImported: e.target.checked } }))}
                className="w-4 h-4"
              />
              <label htmlFor="imported" className="font-semibold text-gray-700 cursor-pointer text-sm">This is an imported product</label>
            </div>
            {newProduct.importDetails.isImported && (
              <div className="pl-6 space-y-4">
                <Input label="Country of Import" placeholder="e.g., China, USA, Germany"
                  value={newProduct.importDetails.country}
                  onChange={(e) => setNewProduct((p) => ({ ...p, importDetails: { ...p.importDetails, country: e.target.value } }))}
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery / Lead Time Note</label>
                  <textarea value={newProduct.importDetails.deliveryNote}
                    onChange={(e) => setNewProduct((p) => ({ ...p, importDetails: { ...p.importDetails, deliveryNote: e.target.value } }))}
                    rows="2" placeholder="e.g., Allow 2–4 weeks for delivery from overseas supplier"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            )}
          </Card>

          <div className="flex justify-between">
            <Button onClick={() => setActiveTab("details")} variant="outline">Back</Button>
            <Button onClick={handleAddProduct} variant="success" loading={isSubmitting}
              icon={<Check className="w-4 h-4" />} iconPosition="right">
              {isSubmitting ? "Adding Product..." : "✅ Add Product"}
            </Button>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* SERVICE CONFIG TAB — services only        */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === "service" && isService && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">

          <Card title="SLA — Service Level Agreement" icon={<Shield className="w-5 h-5 text-yellow-600" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Uptime Guarantee" placeholder="e.g., 99.9%, 99.99%"
                value={newProduct.sla.uptime}
                onChange={(e) => setNewProduct((p) => ({ ...p, sla: { ...p.sla, uptime: e.target.value } }))}
              />
              <Input label="Support Response Time" placeholder="e.g., 4 hours, 24 hours, Next business day"
                value={newProduct.sla.responseTime}
                onChange={(e) => setNewProduct((p) => ({ ...p, sla: { ...p.sla, responseTime: e.target.value } }))}
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Support Channel</label>
                <select value={newProduct.supportTier}
                  onChange={(e) => setNewProduct((p) => ({ ...p, supportTier: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="community">💬 Community / Knowledge Base only</option>
                  <option value="email">📧 Email support</option>
                  <option value="chat">💬 Live chat</option>
                  <option value="phone">📞 Phone support</option>
                  <option value="dedicated">👤 Dedicated account manager</option>
                  <option value="24x7">🔁 24×7 NOC / enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">License / Access Type</label>
                <select value={newProduct.licenseType}
                  onChange={(e) => setNewProduct((p) => ({ ...p, licenseType: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="individual">👤 Individual / Single user</option>
                  <option value="team">👥 Team / Multi-user</option>
                  <option value="enterprise">🏢 Enterprise / Unlimited users</option>
                  <option value="site">🌐 Site licence</option>
                  <option value="open-source">📖 Open source</option>
                  <option value="concurrent">🔀 Concurrent sessions</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full SLA Description</label>
                <textarea value={newProduct.sla.details}
                  onChange={(e) => setNewProduct((p) => ({ ...p, sla: { ...p.sla, details: e.target.value } }))}
                  rows="3"
                  placeholder="Full SLA text — what is covered, exclusions, compensation / credit policy, maintenance windows..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>
          </Card>

          <Card title="Users, Seats & Compliance" icon={<Users className="w-5 h-5 text-indigo-600" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Users / Seats included</label>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" value={newProduct.maxUsers}
                    onChange={(e) => setNewProduct((p) => ({ ...p, maxUsers: e.target.value }))}
                    placeholder="0 = unlimited"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-500 whitespace-nowrap">0 = unlimited</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button onClick={() => setActiveTab("details")} variant="outline">Back</Button>
            <Button onClick={handleAddProduct} variant="success" loading={isSubmitting}
              icon={<Check className="w-4 h-4" />} iconPosition="right">
              {isSubmitting ? "Adding Service..." : "✅ Add Service"}
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AddProduct;
