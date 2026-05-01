import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setWishlistItems,
  addToWishlist as addToWishlistAction,
  removeFromWishlist as removeFromWishlistAction,
} from "../redux/wishlistSlice";
import {
  getWishlistItems,
  addToWishlist,
  removeFromWishlist,
  isProductInWishlist,
} from "./wishlistUtils";
import { toast } from "react-toastify";
import logger from "./logger";

/**
 * Custom hook for interacting with the wishlist
 *
 * Provides methods to:
 * - Add products to wishlist
 * - Remove products from wishlist
 * - Check if a product is in the wishlist
 * - Get loading and error states
 *
 * Optimized to:
 * - Use caching to minimize Firebase calls
 * - Batch operations where possible
 * - Only fetch wishlist data when needed
 * - Track API usage metrics
 *
 * @returns {Object} Wishlist methods and state
 */
const useWishlist = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(0);
  const hasFetchedRef = useRef(false);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.currentUser);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  // Cache TTL (time to live) - 5 minutes
  const CACHE_TTL = 5 * 60 * 1000;

  // Reset fetch state when user identity changes
  useEffect(() => {
    hasFetchedRef.current = false;
    lastFetchRef.current = 0;
  }, [user?.uid]);

  /**
   * Loads the user's wishlist when the component mounts
   * or when the user changes
   */
  useEffect(() => {
    const loadWishlist = async () => {
      if (!user) return;

      // Skip if fetched recently (TTL guard using ref — no re-render on update)
      const isStale = Date.now() - lastFetchRef.current > CACHE_TTL;
      if (hasFetchedRef.current && !isStale) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const startTime = Date.now();
        const items = await getWishlistItems(user.uid);
        const endTime = Date.now();

        dispatch(setWishlistItems(items));
        lastFetchRef.current = Date.now();
        hasFetchedRef.current = true;

        logger.info(
          "Wishlist loaded",
          {
            count: items.length,
            executionTime: `${endTime - startTime}ms`,
          },
          "Wishlist",
        );
      } catch (err) {
        logger.error("Failed to load wishlist", err, "Wishlist");
        setError("Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
    // Intentionally omitting CACHE_TTL and wishlistItems.length —
    // running only when the user changes prevents an infinite fetch loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, dispatch]);

  /**
   * Adds a product to the user's wishlist
   *
   * @param {Object} product - The product to add
   * @returns {Promise<void>}
   */
  const addProductToWishlist = useCallback(
    async (product) => {
      if (!user) {
        toast.error("Please sign in to add items to your wishlist");
        return;
      }

      if (!product || !product.id) {
        logger.warn(
          "Invalid product data for wishlist",
          { product },
          "Wishlist",
        );
        toast.error("Invalid product data");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        logger.user.action("Add to wishlist", {
          productId: product.id,
          productName: product.name,
        });

        const startTime = Date.now();
        const addedItem = await addToWishlist(user.uid, product);
        const endTime = Date.now();

        // Only dispatch if the item isn't already in the Redux store
        const existingItem = wishlistItems.find(
          (item) => item.id === product.id,
        );
        if (!existingItem) {
          dispatch(addToWishlistAction(addedItem));
        }

        logger.info(
          "Product added to wishlist",
          {
            productId: product.id,
            executionTime: `${endTime - startTime}ms`,
          },
          "Wishlist",
        );

        toast.success("Product added to wishlist");
      } catch (err) {
        logger.error(
          "Failed to add product to wishlist",
          {
            error: err.message,
            productId: product.id,
          },
          "Wishlist",
        );

        setError("Failed to add to wishlist");
        toast.error("Failed to add product to wishlist");
      } finally {
        setLoading(false);
      }
    },
    [user, dispatch, wishlistItems],
  );

  /**
   * Removes a product from the user's wishlist
   *
   * @param {string} productId - The ID of the product to remove
   * @returns {Promise<void>}
   */
  const removeProductFromWishlist = useCallback(
    async (productId) => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        logger.user.action("Remove from wishlist", { productId });

        const startTime = Date.now();
        await removeFromWishlist(user.uid, productId);
        const endTime = Date.now();

        dispatch(removeFromWishlistAction(productId));

        logger.info(
          "Product removed from wishlist",
          {
            productId,
            executionTime: `${endTime - startTime}ms`,
          },
          "Wishlist",
        );

        toast.success("Product removed from wishlist");
      } catch (err) {
        logger.error(
          "Failed to remove product from wishlist",
          {
            error: err.message,
            productId,
          },
          "Wishlist",
        );

        setError("Failed to remove from wishlist");
        toast.error("Failed to remove product from wishlist");
      } finally {
        setLoading(false);
      }
    },
    [user, dispatch],
  );

  /**
   * Checks if a product is in the user's wishlist
   * First checks the Redux store, then falls back to Firebase check
   *
   * @param {string} productId - The ID of the product to check
   * @returns {Promise<boolean>}
   */
  const checkIfInWishlist = useCallback(
    async (productId) => {
      if (!user) return false;

      // First check in Redux store for better performance
      const isInStore = wishlistItems.some((item) => item.id === productId);
      if (isInStore) return true;

      // If not found in store and we don't have data yet, check Firebase directly
      if (wishlistItems.length === 0) {
        try {
          const startTime = Date.now();
          const result = await isProductInWishlist(user.uid, productId);
          const endTime = Date.now();

          logger.debug(
            "Checked product wishlist status",
            {
              productId,
              status: result ? "in wishlist" : "not in wishlist",
              executionTime: `${endTime - startTime}ms`,
            },
            "Wishlist",
          );

          return result;
        } catch (err) {
          logger.error(
            "Failed to check wishlist status",
            {
              error: err.message,
              productId,
            },
            "Wishlist",
          );
          return false;
        }
      }

      return false;
    },
    [user, wishlistItems],
  );

  return {
    loading,
    error,
    wishlistItems,
    addToWishlist: addProductToWishlist,
    removeFromWishlist: removeProductFromWishlist,
    isInWishlist: checkIfInWishlist,
  };
};

export default useWishlist;
