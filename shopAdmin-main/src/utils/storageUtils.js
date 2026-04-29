import { storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param {File} file - The file to upload
 * @param {string} path - The storage path (e.g., 'products/images/')
 * @returns {Promise<string>} - The download URL
 */
export async function uploadImageToStorage(file, path) {
  if (!file) throw new Error("No file provided");
  const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
