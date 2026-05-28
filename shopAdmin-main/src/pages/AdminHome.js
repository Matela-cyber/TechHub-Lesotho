import { Link, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { formatCurrency, formatLakhs } from "../utils/formatUtils";
import {
  Home,
  Package,
  Users,
  ShoppingBag,
  Tag,
  Bell,
  LogOut,
  TrendingUp,
  ShoppingCart,
  Menu,
  X,
  ChevronRight,
  Activity,
  User,
} from "react-feather";
import { Card, LoadingSpinner, Badge } from "../components/ui";

// Import recharts components
const ChartComponents = () => {
  const {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    LineChart,
    Line,
    Area,
    AreaChart,
  } = require("recharts");
  return {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    LineChart,
    Line,
    Area,
    AreaChart,
  };
};

/**
 * Animated Stat Card Component
 */
const StatCard = ({ title, value, icon: Icon, color, trend, loading }) => {
  const colorClasses = {
    blue: {
      bg: "bg-cyan-500/10 border border-cyan-500/20",
      icon: "text-cyan-400",
      gradient: "from-cyan-500 to-cyan-600",
    },
    green: {
      bg: "bg-emerald-500/10 border border-emerald-500/20",
      icon: "text-emerald-400",
      gradient: "from-emerald-500 to-emerald-600",
    },
    purple: {
      bg: "bg-violet-500/10 border border-violet-500/20",
      icon: "text-violet-400",
      gradient: "from-violet-500 to-violet-600",
    },
    orange: {
      bg: "bg-amber-500/10 border border-amber-500/20",
      icon: "text-amber-400",
      gradient: "from-amber-500 to-amber-600",
    },
    red: {
      bg: "bg-red-500/10 border border-red-500/20",
      icon: "text-red-400",
      gradient: "from-red-500 to-red-600",
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, shadow: "0 20px 40px rgba(0,0,0,0.1)" }}
      className="bg-[#162033] rounded-2xl border border-[#1e3048] hover:border-cyan-500/25 p-6 transition-all duration-300 overflow-hidden relative"
    >
      {/* Background gradient decoration */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.gradient} opacity-5 rounded-full -mr-16 -mt-16`}
      />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-slate-500 text-sm font-medium mb-2">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-700/50 animate-pulse rounded" />
          ) : (
            <motion.h3
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold text-slate-100 font-mono"
            >
              {value}
            </motion.h3>
          )}
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center mt-2"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400 mr-1" />
              <span className="text-sm text-emerald-400 font-medium">
                {trend}
              </span>
            </motion.div>
          )}
        </div>
        <motion.div
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className={`${colors.bg} p-4 rounded-xl`}
        >
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </motion.div>
      </div>
    </motion.div>
  );
};

/**
 * Admin Dashboard Component
 */
const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageOrderValue: 0,
    recentOrders: [],
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
  });

  const [chartsReady, setChartsReady] = useState(false);
  const [Charts, setCharts] = useState(null);

  useEffect(() => {
    const charts = ChartComponents();
    setCharts(charts);
    setChartsReady(true);
  }, []);

  const COLORS = [
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];
  const STATUS_COLORS = {
    Placed: "#f59e0b",
    Approved: "#06b6d4",
    Shipped: "#8b5cf6",
    Delivered: "#10b981",
    Declined: "#ef4444",
    Cancelled: "#6B7280",
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchOrderStatistics(),
          fetchMonthlyRevenue(),
          fetchProductPerformance(),
          fetchOrderStatusDistribution(),
          fetchUserStatistics(),
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const fetchOrderStatistics = async () => {
    try {
      const ordersRef = collection(db, "orders");
      const ordersSnapshot = await getDocs(ordersRef);

      let totalRevenue = 0;
      let monthlyRevenue = 0;
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const orders = ordersSnapshot.docs.map((doc) => {
        const data = doc.data();
        const orderTotal = data.total || data.totalAmount || data.amount || 0;
        totalRevenue += orderTotal;

        // Calculate this month's revenue
        const orderDate = data.orderDate ? new Date(data.orderDate) : null;
        if (orderDate && orderDate >= firstDayOfMonth) {
          monthlyRevenue += orderTotal;
        }

        return { id: doc.id, ...data };
      });

      const recentOrdersQuery = query(
        collection(db, "orders"),
        orderBy("orderDate", "desc"),
        limit(5),
      );
      const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
      const recentOrders = recentOrdersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setOrderStats({
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        monthlyRevenue: monthlyRevenue,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        recentOrders: recentOrders,
      });

      console.log("Order Stats:", {
        totalOrders: orders.length,
        totalRevenue,
        monthlyRevenue,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      });
    } catch (error) {
      console.error("Error fetching order statistics:", error);
      toast.error("Failed to load order statistics");
    }
  };

  const fetchMonthlyRevenue = async () => {
    try {
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      const ordersRef = collection(db, "orders");
      const ordersSnapshot = await getDocs(ordersRef);

      const monthlyData = {};

      for (let i = 0; i < 6; i++) {
        const month = new Date();
        month.setMonth(now.getMonth() - i);
        const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
        const monthName = month.toLocaleString("default", { month: "short" });
        monthlyData[monthKey] = {
          month: monthName,
          year: month.getFullYear(),
          revenue: 0,
          orders: 0,
        };
      }

      ordersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const orderDate = new Date(data.orderDate);

        if (orderDate >= sixMonthsAgo) {
          const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;

          if (monthlyData[monthKey]) {
            monthlyData[monthKey].revenue += data.total || 0;
            monthlyData[monthKey].orders += 1;
          }
        }
      });

      const monthlyArray = Object.values(monthlyData).sort((a, b) => {
        return a.year === b.year
          ? new Date(0, a.month, 0) - new Date(0, b.month, 0)
          : a.year - b.year;
      });

      setMonthlyRevenue(monthlyArray);
    } catch (error) {
      console.error("Error fetching monthly revenue:", error);
    }
  };

  const fetchProductPerformance = async () => {
    try {
      const ordersRef = collection(db, "orders");
      const ordersSnapshot = await getDocs(ordersRef);

      const productSales = {};

      ordersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.items && Array.isArray(data.items)) {
          data.items.forEach((item) => {
            if (!productSales[item.name]) {
              productSales[item.name] = {
                name: item.name,
                quantity: 0,
                revenue: 0,
              };
            }
            productSales[item.name].quantity += item.quantity || 0;
            productSales[item.name].revenue += item.price * item.quantity || 0;
          });
        }
      });

      const productArray = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      setProductPerformance(productArray);
    } catch (error) {
      console.error("Error fetching product performance:", error);
    }
  };

  const fetchOrderStatusDistribution = async () => {
    try {
      const ordersRef = collection(db, "orders");
      const ordersSnapshot = await getDocs(ordersRef);

      const statusCounts = {};

      ordersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const status = data.status || "Unknown";

        if (!statusCounts[status]) {
          statusCounts[status] = { status, count: 0 };
        }
        statusCounts[status].count += 1;
      });

      const statusArray = Object.values(statusCounts);

      setStatusDistribution(statusArray);
    } catch (error) {
      console.error("Error fetching status distribution:", error);
    }
  };

  const fetchUserStatistics = async () => {
    try {
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      let newUsersCount = 0;

      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (
          data.createdAt &&
          new Date(data.createdAt.seconds * 1000) >= firstDayOfMonth
        ) {
          newUsersCount++;
        }
      });

      setUserStats({
        totalUsers: usersSnapshot.docs.length,
        newUsersThisMonth: newUsersCount,
      });
    } catch (error) {
      console.error("Error fetching user statistics:", error);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#162033] p-3 shadow-xl rounded-xl border border-[#1e3048]">
          <p className="font-semibold text-slate-200 text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}:{" "}
              {entry.name === "Revenue" || entry.name === "revenue"
                ? formatCurrency(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="xl" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Welcome Banner removed as requested */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value={orderStats.totalOrders}
          icon={ShoppingCart}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(orderStats.totalRevenue)}
          icon={Tag}
          color="green"
          trend={
            orderStats.monthlyRevenue > 0
              ? `+${formatCurrency(orderStats.monthlyRevenue)} this month`
              : undefined
          }
          loading={loading}
        />
        <StatCard
          title="Avg. Order Value"
          value={formatCurrency(orderStats.averageOrderValue)}
          icon={TrendingUp}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Total Users"
          value={userStats.totalUsers}
          icon={Users}
          color="orange"
          trend={`+${userStats.newUsersThisMonth} new`}
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      {chartsReady && Charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              title="Monthly Revenue"
              subtitle="Last 6 months performance"
              icon={<Activity className="w-5 h-5 text-cyan-400" />}
              gradient
            >
              {monthlyRevenue.length > 0 ? (
                <div className="h-80 w-full">
                  <Charts.ResponsiveContainer width="100%" height="100%">
                    <Charts.AreaChart
                      data={monthlyRevenue}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#06b6d4"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#06b6d4"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Charts.CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1e3048"
                      />
                      <Charts.XAxis dataKey="month" stroke="#566a80" />
                      <Charts.YAxis
                        tickFormatter={(value) => formatLakhs(value)}
                        stroke="#566a80"
                      />
                      <Charts.Tooltip content={<CustomTooltip />} />
                      <Charts.Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#06b6d4"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </Charts.AreaChart>
                  </Charts.ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center py-10 text-slate-500">
                  No revenue data available
                </p>
              )}
            </Card>
          </motion.div>

          {/* Order Status Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              title="Order Status"
              subtitle="Current distribution"
              icon={<Package className="w-5 h-5 text-violet-400" />}
              gradient
            >
              {statusDistribution.length > 0 ? (
                <div className="h-80 w-full">
                  <Charts.ResponsiveContainer width="100%" height="100%">
                    <Charts.PieChart>
                      <Charts.Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="status"
                        label={({ status, count, percent }) =>
                          `${status}: ${count}`
                        }
                      >
                        {statusDistribution.map((entry, index) => (
                          <Charts.Cell
                            key={`cell-${index}`}
                            fill={
                              STATUS_COLORS[entry.status] ||
                              COLORS[index % COLORS.length]
                            }
                          />
                        ))}
                      </Charts.Pie>
                      <Charts.Tooltip />
                    </Charts.PieChart>
                  </Charts.ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center py-10 text-slate-500">
                  No order data available
                </p>
              )}
            </Card>
          </motion.div>
        </div>
      )}

      {/* Top Products and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card
            title="Top Selling Products"
            subtitle="Best performers"
            icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
            gradient
          >
            {productPerformance.length > 0 ? (
              <div className="space-y-3">
                {productPerformance.map((product, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-3 bg-[#111c2d] rounded-lg hover:bg-[#1e3048]/60 transition-colors duration-200 border border-[#1e3048]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center">
                        <span className="text-cyan-400 font-bold text-xs font-mono">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200 text-sm">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.quantity} units sold
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">
                      {formatCurrency(product.revenue)}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-gray-500">
                No product data available
              </p>
            )}
          </Card>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card
            title="Recent Orders"
            subtitle="Latest transactions"
            icon={<ShoppingBag className="w-5 h-5 text-orange-600" />}
            actions={
              <Link
                to="/orders"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            }
            gradient
          >
            {orderStats.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {orderStats.recentOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-3 bg-[#111c2d] rounded-lg hover:bg-[#1e3048]/60 transition-colors duration-200 border border-[#1e3048]"
                  >
                    <div>
                      <p className="font-semibold text-slate-200 text-sm">
                        {order.orderId || order.id.substring(0, 8)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.userName || order.userEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-200 text-sm">
                        {formatCurrency(order.total)}
                      </p>
                      <Badge
                        variant={
                          order.status === "Delivered"
                            ? "success"
                            : order.status === "Shipped"
                              ? "purple"
                              : order.status === "Placed"
                                ? "warning"
                                : order.status === "Cancelled"
                                  ? "danger"
                                  : "default"
                        }
                        size="sm"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-gray-500">
                No recent orders
              </p>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

/**
 * Admin Home Layout Component with Sidebar
 */
const AdminHome = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("admin_read_notifs") || "[]");
    } catch {
      return [];
    }
  });

  // Real-time listener: orders with status "Placed" = need admin attention
  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("orderDate", "desc"),
      limit(20),
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notifs);
    });
    return () => unsub();
  }, []);

  const unreadCount = notifications.filter(
    (n) => !readIds.includes(n.id),
  ).length;

  const markAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    localStorage.setItem("admin_read_notifs", JSON.stringify(allIds));
  };

  const markRead = (id) => {
    const updated = [...new Set([...readIds, id])];
    setReadIds(updated);
    localStorage.setItem("admin_read_notifs", JSON.stringify(updated));
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "placed":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "approved":
        return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
      case "packed":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "shipped":
        return "bg-violet-500/10 text-violet-400 border border-violet-500/20";
      case "delivered":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "declined":
      case "cancelled":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      default:
        return "bg-slate-700/50 text-slate-400 border border-slate-600/40";
    }
  };

  const handleLogout = () => {
    toast.success("Logged out successfully!");
    window.location.href = "/login";
  };

  const menuItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/orders", icon: ShoppingBag, label: "Orders" },
    { path: "/products", icon: Package, label: "Products" },
    { path: "/users", icon: Users, label: "Users" },
    { path: "/coupons", icon: Tag, label: "Coupons" },
    { path: "/announcements", icon: Bell, label: "Announcements" },
    { path: "/account", icon: User, label: "My Account" },
  ];

  const isManageRoute = location.pathname !== "/";

  return (
    <div className="flex h-screen bg-[#0d1421]">
      {/* Sidebar - Desktop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="hidden lg:flex w-64 bg-[#111c2d] text-white flex-col border-r border-[#1e3048]"
          >
            {/* Logo */}
            <div className="p-5 border-b border-[#1e3048]">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100 tracking-wide">
                    TechHub Admin
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                    Management Panel
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== "/" &&
                    location.pathname.startsWith(item.path));

                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Link
                      to={item.path}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm
                        ${
                          isActive
                            ? "bg-cyan-500/10 border border-cyan-500/25 text-cyan-400"
                            : "text-slate-400 hover:bg-slate-700/40 hover:text-slate-100 border border-transparent"
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-1.5 h-1.5 bg-cyan-400 rounded-full"
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="p-3 border-t border-[#1e3048]">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 hover:text-red-300 transition-colors duration-200 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-[#111c2d] text-white z-50 flex flex-col border-r border-[#1e3048]"
            >
              {/* Mobile Logo & Close */}
              <div className="p-5 border-b border-[#1e3048] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-100">
                      TechHub Admin
                    </h2>
                    <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                      Management Panel
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/" &&
                      location.pathname.startsWith(item.path));

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm border
                        ${
                          isActive
                            ? "bg-cyan-500/10 border-cyan-500/25 text-cyan-400"
                            : "border-transparent text-slate-400 hover:bg-slate-700/40 hover:text-slate-100"
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Logout */}
              <div className="p-3 border-t border-[#1e3048]">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 transition-colors duration-200 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-[#111c2d] border-b border-[#1e3048] px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-700/50 rounded-lg text-slate-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-2 hover:bg-slate-700/50 rounded-lg transition-colors duration-200 text-slate-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-100">
                {menuItems.find((item) => item.path === location.pathname)
                  ?.label || "Dashboard"}
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                // manage your store
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 relative">
            {/* Notification Bell */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNotifOpen((v) => !v)}
                className="p-2 hover:bg-slate-700/50 rounded-lg relative focus:outline-none text-slate-400 hover:text-slate-200"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </motion.button>

              {/* Dropdown */}
              <AnimatePresence>
                {notifOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setNotifOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-2 w-96 bg-[#162033] rounded-2xl border border-[#1e3048] shadow-[0_8px_40px_rgba(0,0,0,0.5)] z-40 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                        <div>
                          <h3 className="font-bold text-gray-800 text-base">
                            Notifications
                          </h3>
                          <p className="text-xs text-gray-400">
                            {unreadCount} unread
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-[420px] overflow-y-auto divide-y divide-[#1e3048]">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Bell className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const isRead = readIds.includes(notif.id);
                            const dateStr = notif.orderDate
                              ? new Date(notif.orderDate).toLocaleDateString(
                                  "en-LS",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "";
                            return (
                              <div
                                key={notif.id}
                                onClick={() => {
                                  markRead(notif.id);
                                  setNotifOpen(false);
                                  window.location.href = "/orders";
                                }}
                                className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-cyan-500/5 transition-colors ${
                                  isRead ? "opacity-50" : "bg-[#162033]"
                                }`}
                              >
                                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                  <ShoppingBag className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-semibold text-slate-200 truncate">
                                      Order #
                                      {notif.orderId ||
                                        notif.id.substring(0, 8)}
                                    </p>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(notif.status)}`}
                                    >
                                      {notif.status || "Unknown"}
                                    </span>
                                    {!isRead && (
                                      <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {notif.userName ||
                                      notif.userEmail ||
                                      "Customer"}
                                    {dateStr && <> &middot; {dateStr}</>}
                                  </p>
                                  {notif.totalAmount != null && (
                                    <p className="text-xs font-medium text-slate-300 mt-0.5">
                                      M
                                      {Number(notif.totalAmount).toLocaleString(
                                        "en-LS",
                                        { minimumFractionDigits: 2 },
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Footer */}
                      <div className="px-5 py-3 border-t border-[#1e3048] bg-[#111c2d] text-center">
                        <button
                          onClick={() => {
                            setNotifOpen(false);
                            window.location.href = "/orders";
                          }}
                          className="text-sm text-cyan-400 font-medium hover:underline"
                        >
                          View all orders →
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0d1421]">
          {!isManageRoute && location.pathname === "/" ? (
            <AdminDashboard />
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
