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

function getInitials(name, fallback = "U") {
  const trimmed = (name || "").trim();
  if (!trimmed) return fallback;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || fallback
  );
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
  const userInitials = useMemo(() => getInitials(userName), [userName]);

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
          transition-all duration-300 backdrop-blur-xl
          hidden md:block {/* Hidden on mobile, block on md and larger */}
          ${isScrolled ? "bg-white/88 shadow-panel border-b border-circuit-200/70" : "bg-white/68 border-b border-transparent"}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-13.5">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2">
                <div className="h-9 w-9 flex items-center justify-center rounded-2xl bg-gradient-to-br from-circuit-800 to-primary-600 text-sm font-bold tracking-[0.25em] text-white shadow-panel">
                  TH
                </div>
                <div>
                  <span className="block font-semibold text-[0.98rem] tracking-[0.14em] text-circuit-900 uppercase leading-none">
                    TechHub Lesotho
                  </span>
                  <span className="text-[10px] tracking-[0.08em] text-circuit-500">
                    Smart tech essentials
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              {mainNavItems.map(
                (
                  item, // Changed to mainNavItems
                ) => (
                  <div key={item.name} className="relative">
                    <Link
                      to={item.href}
                      className={classNames(
                        location.pathname === item.href
                          ? "text-primary-700 bg-primary-50"
                          : "text-circuit-700 hover:text-primary-700 hover:bg-circuit-50",
                        "flex items-center px-3 py-1.5 text-[13px] font-semibold rounded-xl transition-all duration-200",
                      )}
                    >
                      <item.icon className="h-4 w-4 mr-1.5" />
                      {item.name}
                      {location.pathname === item.href && (
                        <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary-600 rounded-full" />
                      )}
                    </Link>
                  </div>
                ),
              )}
            </div>

            <div className="flex items-center space-x-5">
              <div className="relative">
                <Link
                  to="/cart"
                  className="text-circuit-700 hover:text-primary-700 transition-colors"
                >
                  <ShoppingBagIcon className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
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
                        <Menu.Button className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                          {profilePic && !profilePic.includes("defaultpfp") ? (
                            <img
                              className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-soft"
                              src={profilePic}
                              alt={userName}
                            />
                          ) : (
                            <span className="tech-avatar h-9 w-9 text-sm">
                              {userInitials}
                            </span>
                          )}
                          <span className="text-sm font-semibold text-circuit-800">
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
                      <Menu.Items className="absolute right-0 mt-2 w-52 origin-top-right rounded-2xl bg-white/95 py-1.5 shadow-panel ring-1 ring-circuit-200/70 focus:outline-none z-50 backdrop-blur-xl">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/my-account"
                              className={classNames(
                                active ? "bg-circuit-50" : "",
                                "flex items-center px-4 py-2.5 text-sm text-circuit-700",
                              )}
                            >
                              <UserCircleIcon className="mr-3 h-5 w-5 text-circuit-400" />
                              My Account
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/wishlist"
                              className={classNames(
                                active ? "bg-circuit-50" : "",
                                "flex items-center px-4 py-2.5 text-sm text-circuit-700",
                              )}
                            >
                              <HeartIcon className="mr-3 h-5 w-5 text-circuit-400" />
                              My Wishlist
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleSignOut}
                              className={classNames(
                                active ? "bg-circuit-50" : "",
                                "flex w-full items-center px-4 py-2.5 text-sm text-circuit-700",
                              )}
                            >
                              <svg
                                className="mr-3 h-5 w-5 text-circuit-400"
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
                <div className="flex items-center space-x-4">
                  <div>
                    <Link
                      to="/signin"
                      className="text-circuit-700 hover:text-primary-700 px-4 py-2 text-sm font-semibold rounded-xl transition-colors"
                    >
                      Sign in
                    </Link>
                  </div>
                  <div>
                    <Link
                      to="/signup"
                      className="bg-primary-600 text-white px-4 py-2 text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-soft hover:shadow-panel"
                    >
                      Sign up
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for the fixed top navbar (only for desktop/tablet) */}
      <div className="hidden md:block h-14"></div>

      {/* Bottom Tab Navigation (for mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/92 border-t border-circuit-200 shadow-panel z-50 backdrop-blur-xl">
        <div className="max-w-md mx-auto flex justify-around items-center h-15 px-2">
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
                  ? "text-primary-700 scale-105"
                  : "text-circuit-500 hover:text-primary-600",
                "flex flex-col items-center justify-center flex-1 pt-1 pb-1 text-[11px] font-semibold transition-all duration-150 ease-in-out focus:outline-none",
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
                      className="h-6 w-6 mb-0.5 rounded-full object-cover ring-1 ring-gray-200"
                    />
                  ) : (
                    <span className="tech-avatar h-6 w-6 mb-0.5 text-[10px]">
                      {userInitials}
                    </span>
                  )
                ) : (
                  <item.icon className="h-5 w-5 mb-0.5" />
                )}
                {item.name === "Cart" && item.count > 0 && (
                  <span className="absolute -top-1 -right-2.5 bg-primary-600 text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center ring-1 ring-white">
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
