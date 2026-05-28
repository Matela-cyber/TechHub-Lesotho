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
    <div className="min-h-screen bg-transparent">
      <m.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        <div className="container mx-auto px-4 pt-6 pb-5 md:pt-8 md:pb-6">
          <div className="tech-panel relative rounded-[26px] px-5 py-6 md:px-8 md:py-8 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(31,111,235,0.18),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(15,157,138,0.16),_transparent_28%)]" />
            <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-center">
              <div className="max-w-2xl">
                <span className="tech-chip mb-3">TechHub Lesotho</span>
                <h1 className="text-3xl md:text-[2.75rem] font-semibold tracking-tight text-circuit-900 leading-tight">
                  Computers, accessories, and digital services in one place.
                </h1>
                <p className="mt-3 max-w-xl text-sm md:text-[15px] text-circuit-600 leading-7">
                  Shop laptops, desktops, accessories, and hosting solutions
                  through a cleaner storefront built for everyday customers,
                  students, and businesses.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow-panel transition hover:bg-primary-700"
                  >
                    Explore Products
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-circuit-200 bg-white/80 px-4 py-2.5 text-sm text-circuit-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-signal-500" />
                    New products added regularly
                  </div>
                </div>
              </div>

              <div className="tech-card rounded-3xl p-5 lg:p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-circuit-500">
                  Shop Categories
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-circuit-800">
                  <div className="rounded-2xl bg-circuit-50 px-4 py-3 font-medium">
                    Laptops
                  </div>
                  <div className="rounded-2xl bg-circuit-50 px-4 py-3 font-medium">
                    Desktops
                  </div>
                  <div className="rounded-2xl bg-circuit-50 px-4 py-3 font-medium">
                    Accessories
                  </div>
                  <div className="rounded-2xl bg-circuit-50 px-4 py-3 font-medium">
                    Web Hosting
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-circuit-200 bg-white/80 px-4 py-3 text-sm text-circuit-600">
                  Browse featured products or open the full catalogue to see
                  everything available.
                </div>
              </div>
            </div>
          </div>
        </div>
      </m.section>

      {/* Features Section */}
      <m.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="container mx-auto px-4 py-7 md:py-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <div className="tech-card rounded-3xl p-4.5 hover:shadow-panel transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary-50 rounded-2xl">
                <Package className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-circuit-900">
                  Structured Quality
                </h3>
                <p className="text-sm text-circuit-600">
                  Curated ICT product catalogue
                </p>
              </div>
            </div>
          </div>
          <div className="tech-card rounded-3xl p-4.5 hover:shadow-panel transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-signal-50 rounded-2xl">
                <TrendingUp className="w-5 h-5 text-signal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-circuit-900">Price Logic</h3>
                <p className="text-sm text-circuit-600">
                  Competitive pricing guaranteed
                </p>
              </div>
            </div>
          </div>

          <div className="tech-card rounded-3xl p-4.5 hover:shadow-panel transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-circuit-100 rounded-2xl">
                <Star className="w-5 h-5 text-circuit-700" />
              </div>
              <div>
                <h3 className="font-semibold text-circuit-900">
                  Reliable Flow
                </h3>
                <p className="text-sm text-circuit-600">
                  Designed to feel more professional
                </p>
              </div>
            </div>
          </div>
        </div>
      </m.section>

      {/* Featured Products Section */}
      <section className="container mx-auto px-4 py-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-circuit-900 mb-2">
                Featured Products
              </h2>
              <p className="text-circuit-600">
                Handpicked items with a cleaner browsing flow
              </p>
            </div>
            <Link
              to="/products"
              className="hidden md:flex items-center gap-2 text-circuit-800 hover:text-primary-700 font-semibold transition-colors group"
            >
              View All
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </m.div>

        {/* Loading State */}
        {isLoadingFresh && products.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="tech-card rounded-3xl overflow-hidden animate-pulse"
              >
                <div className="w-full h-64 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-2/3"></div>
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
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 bg-circuit-100 rounded-full mb-4">
              <ShoppingBag className="w-7 h-7 text-circuit-500" />
            </div>
            <h3 className="text-xl font-semibold text-circuit-900 mb-2">
              No featured products yet
            </h3>
            <p className="text-circuit-600 mb-6">
              Check out our full collection
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-circuit-900 text-white px-6 py-3 rounded-2xl hover:bg-circuit-800 transition-colors"
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
        className="container mx-auto px-4 py-10"
      >
        <div className="rounded-[28px] p-7 md:p-8 text-center relative overflow-hidden border border-circuit-200 bg-[linear-gradient(135deg,_rgba(19,32,51,0.96),_rgba(35,57,86,0.94))] shadow-panel">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6TTQ2IDM0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDEwYzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00eiIvPjwvZz48L2c+PC9zdmc+')] bg-repeat"></div>
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-semibold text-white mb-4">
              Discover Our Complete Collection
            </h2>
            <p className="text-gray-300 text-base md:text-lg mb-7 max-w-2xl mx-auto">
              Explore hundreds of premium computers, ICT products and web
              hosting solutions carefully selected for professionals, students,
              and businesses.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white text-circuit-900 px-6 py-3 rounded-2xl hover:bg-circuit-50 transition-colors font-semibold shadow-soft hover:shadow-panel transform hover:scale-[1.02] transition-transform"
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
