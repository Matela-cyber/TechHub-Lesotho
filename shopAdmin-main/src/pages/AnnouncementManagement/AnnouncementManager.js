import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Trash2, Plus, Edit, Check, X, Globe, Link as LinkIcon, MessageSquare } from 'react-feather';

/**
 * Announcement Manager Component
 * 
 * This component allows administrators to manage announcements displayed on the site
 * Features:
 * - Add/Edit/Delete announcements
 * - Enable/disable announcements display
 * - Add clickable links in announcements
 * - Control text appearance
 * 
 * @returns {JSX.Element} The Announcement Manager component
 */
const AnnouncementManager = () => {
  // State for announcement data
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    text: '',
    link: '',
    linkText: '', 
    active: true,
    backgroundColor: '#E5F6FD',
    textColor: '#1E88E5',
    priority: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isAnnouncementEnabled, setIsAnnouncementEnabled] = useState(true);

  // Fetch announcements on component mount
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        // Get announcements from Firestore
        const announcementsQuery = query(collection(db, 'announcements'), orderBy('priority'));
        const announcementsSnapshot = await getDocs(announcementsQuery);
        
        const announcementsData = announcementsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAnnouncements(announcementsData);
        
        // Get announcement setting
        const settingsCollection = collection(db, 'settings');
        const settingsSnapshot = await getDocs(settingsCollection);
        const settingsData = settingsSnapshot.docs.find(doc => doc.id === 'announcementSettings');
        
        if (settingsData) {
          setIsAnnouncementEnabled(settingsData.data().enabled ?? true);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
        toast.error('Failed to load announcement data');
      }
    };
    
    fetchAnnouncements();
  }, []);

  /**
   * Handles adding a new announcement
   */
  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.text.trim()) {
      toast.error('Announcement text cannot be empty');
      return;
    }
    
    try {
      // Create announcement with unique ID
      const announcementRef = doc(collection(db, 'announcements'));
      await setDoc(announcementRef, {
        ...newAnnouncement,
        createdAt: new Date()
      });
      
      // Update local state
      setAnnouncements([...announcements, {
        id: announcementRef.id,
        ...newAnnouncement,
        createdAt: new Date()
      }]);
      
      toast.success('Announcement added successfully');
      
      // Reset form
      setNewAnnouncement({
        text: '',
        link: '',
        linkText: '',
        active: true,
        backgroundColor: '#E5F6FD',
        textColor: '#1E88E5',
        priority: 0
      });
      setIsAddingNew(false);
    } catch (error) {
      console.error('Error adding announcement:', error);
      toast.error('Failed to add announcement');
    }
  };

  /**
   * Handles updating an existing announcement
   */
  const handleUpdateAnnouncement = async () => {
    if (!newAnnouncement.text.trim()) {
      toast.error('Announcement text cannot be empty');
      return;
    }
    
    try {
      // Update announcement in Firestore
      const announcementRef = doc(db, 'announcements', currentEditId);
      await setDoc(announcementRef, newAnnouncement, { merge: true });
      
      // Update local state
      setAnnouncements(announcements.map(announcement => 
        announcement.id === currentEditId ? { ...announcement, ...newAnnouncement } : announcement
      ));
      
      toast.success('Announcement updated successfully');
      
      // Reset form
      setNewAnnouncement({
        text: '',
        link: '',
        linkText: '',
        active: true,
        backgroundColor: '#E5F6FD',
        textColor: '#1E88E5',
        priority: 0
      });
      setIsEditing(false);
      setCurrentEditId(null);
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Failed to update announcement');
    }
  };

  /**
   * Handles deleting an announcement
   * @param {string} id - ID of the announcement to delete
   */
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }
    
    try {
      // Delete announcement from Firestore
      await deleteDoc(doc(db, 'announcements', id));
      
      // Update local state
      setAnnouncements(announcements.filter(announcement => announcement.id !== id));
      
      toast.success('Announcement deleted successfully');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  /**
   * Initiates editing of an announcement
   * @param {Object} announcement - Announcement object to edit
   */
  const startEdit = (announcement) => {
    setNewAnnouncement({
      text: announcement.text,
      link: announcement.link || '',
      linkText: announcement.linkText || '',
      active: announcement.active,
      backgroundColor: announcement.backgroundColor || '#E5F6FD',
      textColor: announcement.textColor || '#1E88E5',
      priority: announcement.priority || 0
    });
    setIsEditing(true);
    setCurrentEditId(announcement.id);
    setIsAddingNew(false);
  };

  /**
   * Cancels the current edit or add operation
   */
  const cancelEdit = () => {
    setNewAnnouncement({
      text: '',
      link: '',
      linkText: '',
      active: true,
      backgroundColor: '#E5F6FD',
      textColor: '#1E88E5',
      priority: 0
    });
    setIsEditing(false);
    setCurrentEditId(null);
    setIsAddingNew(false);
  };

  /**
   * Updates the announcement display setting
   */
  const toggleAnnouncementSetting = async () => {
    try {
      const newSetting = !isAnnouncementEnabled;
      await setDoc(doc(db, 'settings', 'announcementSettings'), {
        enabled: newSetting
      }, { merge: true });
      setIsAnnouncementEnabled(newSetting);
      toast.success(`Announcements ${newSetting ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating announcement setting:', error);
      toast.error('Failed to update announcement setting');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Announcement Management</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer mr-2">
              <input 
                type="checkbox" 
                checked={isAnnouncementEnabled} 
                onChange={toggleAnnouncementSetting}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-sm font-medium text-gray-700">Display Announcements</span>
          </div>
          <button
            onClick={() => {
              setIsAddingNew(true);
              setIsEditing(false);
            }}
            disabled={isAddingNew || isEditing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            <Plus size={16} className="mr-1" /> Add Announcement
          </button>
        </div>
      </div>

      {/* Add/Edit Announcement Form */}
      {(isAddingNew || isEditing) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <h3 className="text-lg font-semibold mb-4">
            {isEditing ? 'Edit Announcement' : 'Add New Announcement'}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {/* Announcement Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Announcement Text *
              </label>
              <textarea
                value={newAnnouncement.text}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, text: e.target.value })}
                placeholder="Enter announcement text here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            </div>
            
            {/* Link Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link URL (optional)
                </label>
                <div className="flex">
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={newAnnouncement.link}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, link: e.target.value })}
                      placeholder="https://example.com/page"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Text (optional)
                </label>
                <input
                  type="text"
                  value={newAnnouncement.linkText}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, linkText: e.target.value })}
                  placeholder="Click here"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Color and Status Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Background Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={newAnnouncement.backgroundColor}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, backgroundColor: e.target.value })}
                    className="w-10 h-10 rounded border-0 p-0 mr-2"
                  />
                  <input
                    type="text"
                    value={newAnnouncement.backgroundColor}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, backgroundColor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={newAnnouncement.textColor}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, textColor: e.target.value })}
                    className="w-10 h-10 rounded border-0 p-0 mr-2"
                  />
                  <input
                    type="text"
                    value={newAnnouncement.textColor}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, textColor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  min="0"
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement({ 
                    ...newAnnouncement, 
                    priority: parseInt(e.target.value) || 0 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Higher priority announcements appear first</p>
              </div>
            </div>
            
            {/* Status Setting */}
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer mr-2">
                <input 
                  type="checkbox" 
                  checked={newAnnouncement.active} 
                  onChange={(e) => setNewAnnouncement({ 
                    ...newAnnouncement, 
                    active: e.target.checked 
                  })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-sm font-medium text-gray-700">Active</span>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preview
              </label>
              <div 
                className="px-4 py-2 rounded-md flex items-center justify-center"
                style={{ 
                  backgroundColor: newAnnouncement.backgroundColor,
                  color: newAnnouncement.textColor
                }}
              >
                <span>{newAnnouncement.text}</span>
                {newAnnouncement.link && newAnnouncement.linkText && (
                  <button 
                    onClick={(e) => e.preventDefault()}
                    className="ml-2 font-medium underline border-none bg-transparent cursor-pointer"
                    style={{ color: newAnnouncement.textColor }}
                  >
                    {newAnnouncement.linkText}
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <X size={16} className="inline mr-1" /> Cancel
              </button>
              <button
                onClick={isEditing ? handleUpdateAnnouncement : handleAddAnnouncement}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Check size={16} className="inline mr-1" />
                {isEditing ? 'Update Announcement' : 'Add Announcement'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Announcements List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="text-lg font-medium text-gray-900">Current Announcements</h3>
        </div>
        
        {announcements.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-500 mb-4">
              <MessageSquare size={24} />
            </div>
            <p className="text-gray-500">No announcements have been added yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Add your first announcement to display it on the website.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {announcements.map((announcement, index) => (
              <motion.li 
                key={announcement.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 flex items-start justify-between hover:bg-gray-50"
              >
                <div className="flex items-start space-x-4">
                  <div>
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: announcement.backgroundColor || '#E5F6FD' }}
                      ></div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {announcement.text}
                      </h4>
                    </div>
                    {announcement.link && (
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <LinkIcon size={12} className="mr-1" />
                        <span>{announcement.link}</span>
                        {announcement.linkText && <span className="ml-1">({announcement.linkText})</span>}
                      </div>
                    )}
                    <div className="mt-1 flex items-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${announcement.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {announcement.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        Priority: {announcement.priority || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEdit(announcement)}
                    disabled={isEditing || isAddingNew}
                    className="p-1 rounded-full text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                    disabled={isEditing || isAddingNew}
                    className="p-1 rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <Globe className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Announcement Guidelines</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc space-y-1 pl-5">
                <li>Keep announcements short and concise for better readability</li>
                <li>Use the priority field to control the order of multiple announcements</li>
                <li>Use colors that match your brand and ensure good text visibility</li>
                <li>Add links to direct users to more information when needed</li>
                <li>Set announcements as inactive instead of deleting them if you plan to use them again</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementManager; 