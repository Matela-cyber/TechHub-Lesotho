import React, {
  Fragment,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import {
  HomeIcon,
  TagIcon,
  UserCircleIcon,
  ShoppingBagIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase/config";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { getDoc, doc } from "firebase/firestore";
import { useSelector } from "react-redux";
import logger from "../utils/logger";
// import defaultPfp from "../assets/defaultpfp.png";

/**
 * Utility function to combine CSS classes conditionally
 * @param  {...string} classes - CSS class names to combine
 * @returns {string} - Combined class names
 */
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const [user] = useAuthState(auth);
  const [profilePic, setProfilePic] = useState("");
  const [userName, setUserName] = useState("User");
  const [profileLoading, setProfileLoading] = useState(false);
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  // Get cart items from Redux store
  const cartItems = useSelector((state) => state.cart.items);

  // Use useMemo to avoid recalculating on every render
  const cartItemCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  // Define navigation items for both top navbar and bottom tab bar
  const mainNavItems = [
    { name: "Home", href: "/", icon: HomeIcon, exact: true }, // Added exact for better active state matching
    { name: "Products", href: "/products", icon: TagIcon },
    // Additional navigation items can be added here when needed
  ];

  // Define items for the bottom tab navigation, including essentials like Cart and Account
  const bottomNavItems = [
    { name: "Home", href: "/", icon: HomeIcon, exact: true },
    { name: "Products", href: "/products", icon: TagIcon },
    {
      name: "Cart",
      href: "/cart",
      icon: ShoppingBagIcon,
      count: cartItemCount,
    }, // Added count for cart badge
    {
      name: "Account",
      href: user ? "/my-account" : "/signin",
      icon: UserCircleIcon,
    }, // Dynamic link based on auth state
  ];

  /**
   * Fetches user profile data from Firestore
   * Uses caching mechanism to avoid redundant fetches
   * Has proper error handling to prevent app crashes
   */
  const fetchProfileData = useCallback(async () => {
    // Skip if user not authenticated or if already loading
    if (!user || profileLoading) return;

    // Use cached profile data from sessionStorage if available
    const cachedProfile = sessionStorage.getItem(`profile_${user.uid}`);
    if (cachedProfile) {
      try {
        const profileData = JSON.parse(cachedProfile);
        // Ignore cached pics that contain the old defaultpfp image
        const pic = profileData.profilePic || "";
        if (pic.includes("defaultpfp")) {
          sessionStorage.removeItem(`profile_${user.uid}`);
        } else {
          setProfilePic(pic);
          setUserName(profileData.name || "User");
          return;
        }
      } catch (error) {
        // If parse fails, proceed with fetch
        logger.error("Failed to parse cached profile", error, "Navbar");
      }
    }

    try {
      setProfileLoading(true);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Filter out old defaultpfp image URL stored in Firestore for legacy users
        const rawPic = userData.profilePic || "";
        const pic = rawPic.includes("defaultpfp") ? "" : rawPic;
        // Cache the profile data
        sessionStorage.setItem(
          `profile_${user.uid}`,
          JSON.stringify({
            profilePic: pic,
            name: userData.name || "User",
          }),
        );

        setProfilePic(pic);
        setUserName(userData.name || "User");
      }
    } catch (error) {
      logger.error("Failed to fetch profile data", error, "Navbar");
      // Use default values on error
      setProfilePic("");
      setUserName("User");
    } finally {
      setProfileLoading(false);
    }
  }, [user, profileLoading]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user, fetchProfileData]);

  useEffect(() => {
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Handle user sign out with proper error handling and logging
   */
  const handleSignOut = async () => {
    try {
      logger.user.action("Sign out");
      await signOut(auth);
      toast.success("Successfully signed out!");
    } catch (error) {
      logger.error("Sign out failed", error, "Auth");
      toast.error(
        "Error signing out: " + (error.message || "Please try again."),
      );
    }
  };

  return (
    <>
      {/* Top Navigation Bar (for desktop and tablet) */}
      <nav
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-300 backdrop-blur-md border-b
          hidden md:block
          ${
            isScrolled
              ? "bg-[#111827]/98 border-cyan-500/20 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
              : "bg-[#0f1623]/90 border-slate-700/40"
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2.5 group">
                <div className="h-9 w-9 flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-lg font-bold text-cyan-400 font-mono group-hover:border-cyan-400/60 transition-colors">
                  T
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-base text-slate-100 tracking-wide">
                    TechHub
                  </span>
                  <span className="text-[10px] font-mono text-cyan-500 tracking-widest uppercase">
                    Lesotho
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {mainNavItems.map((item) => (
                <div key={item.name} className="relative">
                  <Link
                    to={item.href}
                    className={classNames(
                      location.pathname === item.href
                        ? "text-cyan-400 bg-cyan-500/10"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-700/50",
                      "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-1.5" />
                    {item.name}
                    {location.pathname === item.href && (
                      <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-400 rounded-full" />
                    )}
                  </Link>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Link
                  to="/cart"
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <ShoppingBagIcon className="h-6 w-6" />
                  {cartItemCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-cyan-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-mono font-semibold">
                      {cartItemCount}
                    </div>
                  )}
                </Link>
              </div>

              {user ? (
                <div className="relative h-9">
                  <Menu as="div" className="relative inline-block text-left">
                    <div>
                      <div>
                        <Menu.Button className="flex items-center space-x-2 rounded-lg px-2 py-1 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors">
                          {profilePic && !profilePic.includes("defaultpfp") ? (
                            <img
                              className="h-8 w-8 rounded-full object-cover ring-2 ring-cyan-500/30"
                              src={profilePic}
                              alt={userName}
                            />
                          ) : (
                            <UserCircleIcon className="h-8 w-8 text-slate-400" />
                          )}
                          <span className="text-sm font-medium text-slate-300">
                            {userName}
                          </span>
                        </Menu.Button>
                      </div>
                    </div>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl bg-[#1a2535] border border-slate-600/60 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)] focus:outline-none z-50">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/my-account"
                              className={classNames(
                                active
                                  ? "bg-slate-700/60 text-cyan-400"
                                  : "text-slate-300",
                                "flex items-center px-4 py-2 text-sm transition-colors",
                              )}
                            >
                              <UserCircleIcon className="mr-3 h-5 w-5 text-slate-400" />
                              My Account
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/wishlist"
                              className={classNames(
                                active
                                  ? "bg-slate-700/60 text-cyan-400"
                                  : "text-slate-300",
                                "flex items-center px-4 py-2 text-sm transition-colors",
                              )}
                            >
                              <HeartIcon className="mr-3 h-5 w-5 text-slate-400" />
                              My Wishlist
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleSignOut}
                              className={classNames(
                                active
                                  ? "bg-red-500/10 text-red-400"
                                  : "text-slate-300",
                                "flex w-full items-center px-4 py-2 text-sm transition-colors",
                              )}
                            >
                              <svg
                                className="mr-3 h-5 w-5 text-slate-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                              </svg>
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/signin"
                    className="text-slate-400 hover:text-slate-100 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-cyan-600 text-white px-4 py-1.5 text-sm font-medium rounded-lg hover:bg-cyan-500 transition-colors border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for the fixed top navbar (only for desktop/tablet) */}
      <div className="hidden md:block h-16"></div>

      {/* Bottom Tab Navigation (for mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111827]/98 border-t border-slate-700/60 shadow-[0_-4px_24px_rgba(0,0,0,0.4)] z-50 backdrop-blur-md">
        <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
          {bottomNavItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                (item.exact && location.pathname === item.href) ||
                  (!item.exact &&
                    location.pathname.startsWith(item.href) &&
                    item.href !== "/") ||
                  (item.href === "/" && location.pathname === "/")
                  ? "text-cyan-400"
                  : "text-slate-500 hover:text-slate-300",
                "flex flex-col items-center justify-center flex-1 pt-1 pb-1 text-xs font-medium transition-all duration-150 ease-in-out focus:outline-none",
              )}
              onClick={() => {
                // Optional: close any open modals or perform other actions on tab click
                // setIsMobileMenuOpen(false); // If we had a modal menu this would be useful
              }}
            >
              <div className="relative">
                {/* Show profile picture instead of icon for Account tab when user is logged in */}
                {item.name === "Account" && user ? (
                  profilePic && !profilePic.includes("defaultpfp") ? (
                    <img
                      src={profilePic}
                      alt={userName}
                      className="h-6 w-6 mb-0.5 rounded-full object-cover ring-1 ring-cyan-500/40"
                    />
                  ) : (
                    <UserCircleIcon className="h-6 w-6 mb-0.5" />
                  )
                ) : (
                  <item.icon className="h-6 w-6 mb-0.5" />
                )}
                {item.name === "Cart" && item.count > 0 && (
                  <span className="absolute -top-1 -right-2.5 bg-cyan-500 text-white text-[10px] font-mono font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.count > 9 ? "9+" : item.count}
                  </span>
                )}
              </div>
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
