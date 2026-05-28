import React, { useEffect, useState, useCallback } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";
import { m } from "framer-motion";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { useContentLoader } from "../hooks/useContentLoader";
import {
  ArrowRight,
  Package,
  TrendingUp,
  Star,
  ShoppingBag,
} from "lucide-react";

/**
 * Modern Home Page Component
 *
 * Features:
 * - Hero section with dynamic banner
 * - Featured products showcase
 * - Category highlights
 * - Modern, minimalistic design
 * - Smooth animations and transitions
 */
function Home() {
  const [products, setProducts] = useState([]);
  const [isLoadingFresh, setIsLoadingFresh] = useState(false);
  const dispatch = useDispatch();

  const { getCachedData, preloadedData } = useContentLoader();

  useEffect(() => {
    const initializeProducts = async () => {
      try {
        const cachedProducts = getCachedData("products");

        if (cachedProducts && cachedProducts.length > 0) {
          console.log("✅ Using preloaded products data");
          setProducts(cachedProducts);
          return;
        }

        console.log("🔄 Fetching fresh products data...");
        setIsLoadingFresh(true);

        const productsCol = collection(db, "products");
        const productSnapshot = await getDocs(productsCol);
        const productList = productSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            stock: data.stock !== undefined ? parseInt(data.stock, 10) : 0,
            price: data.price !== undefined ? parseFloat(data.price) : 0,
            mrp: data.mrp !== undefined ? parseFloat(data.mrp) : null,
          };
        });

        const filteredProducts = productList.filter(
          (product) => product.showOnHome,
        );
        setProducts(filteredProducts);
        console.log("✅ Fresh products data loaded");
      } catch (error) {
        console.error("❌ Error initializing products:", error);
        setProducts([]);
      } finally {
        setIsLoadingFresh(false);
      }
    };

    initializeProducts();
  }, [getCachedData]);

  useEffect(() => {
    const preloadedProducts = preloadedData?.products;
    if (
      preloadedProducts &&
      preloadedProducts.length > 0 &&
      products.length === 0
    ) {
      console.log("📦 Updating with newly preloaded products");
      setProducts(preloadedProducts);
    }
  }, [preloadedData, products.length]);

  const handleAddToCart = useCallback(
    (product) => {
      try {
        dispatch(
          addToCart({
            productId: product.id,
            quantity: 1,
          }),
        );
      } catch (error) {
        console.error("❌ Error adding product to cart:", error);
      }
    },
    [dispatch],
  );

  return (
    <div className="min-h-screen bg-[#0f1623] relative">
      {/* Subtle dot-grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(6,182,212,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Features Section */}
      <m.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="container mx-auto px-4 py-14 relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          <div className="bg-[#1a2535] rounded-xl p-6 border border-slate-700/60 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.08)] transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <Package className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">
                  Premium Quality
                </h3>
                <p className="text-sm text-slate-500">
                  Curated ICT product catalogue
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a2535] rounded-xl p-6 border border-slate-700/60 hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)] transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Best Prices</h3>
                <p className="text-sm text-slate-500">
                  Competitive pricing guaranteed
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a2535] rounded-xl p-6 border border-slate-700/60 hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                <Star className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Top Rated</h3>
                <p className="text-sm text-slate-500">Trusted by thousands</p>
              </div>
            </div>
          </div>
        </div>
      </m.section>

      {/* Featured Products Section */}
      <section className="container mx-auto px-4 py-10 relative z-10">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 mb-1 tracking-tight">
                Featured Products
              </h2>
              <p className="text-slate-500 text-sm font-mono">
                // handpicked for you
              </p>
            </div>
            <Link
              to="/products"
              className="hidden md:flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors group text-sm"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </m.div>

        {/* Loading State */}
        {isLoadingFresh && products.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="bg-[#1a2535] rounded-xl border border-slate-700/50 overflow-hidden animate-pulse"
              >
                <div className="w-full h-56 bg-slate-700/50"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
                  <div className="h-6 bg-slate-700/50 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {products.length > 0 && (
          <m.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {products.map((product, index) => (
              <m.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </m.div>
            ))}
          </m.div>
        )}

        {/* No Products State */}
        {!isLoadingFresh && products.length === 0 && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 border border-slate-700 rounded-xl mb-4">
              <ShoppingBag className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">
              No featured products yet
            </h3>
            <p className="text-slate-500 mb-6">Check out our full collection</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-500 transition-colors border border-cyan-500/30"
            >
              Browse Products
              <ArrowRight className="w-5 h-5" />
            </Link>
          </m.div>
        )}
      </section>

      {/* Call to Action Section */}
      <m.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="container mx-auto px-4 py-16"
      >
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-12 text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6TTQ2IDM0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDEwYzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00eiIvPjwvZz48L2c+PC9zdmc+')] bg-repeat"></div>
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Discover Our Complete Collection
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Explore hundreds of premium computers, ICT products and web
              hosting solutions carefully selected for professionals, students,
              and businesses.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform"
            >
              Shop Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </m.section>

      {/* Bottom Spacing */}
      <div className="h-12"></div>
    </div>
  );
}

export default Home;
