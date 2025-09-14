import { useState, useCallback } from 'react';

export const usePasswordAuth = () => {
    const [currentAuthentication, setCurrentAuthentication] = useState(null); // Single section authentication
    const [pendingSection, setPendingSection] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const restrictedSections = ['Menu', 'Liquor', 'Stocks'];

    const requestAccess = useCallback((sectionName) => {
        // Table section is always accessible, but clears authentication
        if (sectionName === 'Table') {
            // Always clear authentication when going to Table section
            setCurrentAuthentication(null);
            return true;
        }

        // For protected sections, always require authentication (no persistent auth)
        if (restrictedSections.includes(sectionName)) {
            // Always clear any existing authentication and require fresh password
            setCurrentAuthentication(null);
            setPendingSection(sectionName);
            setShowPasswordModal(true);
            return false;
        }

        return true;
    }, []);  // Remove currentAuthentication dependency to always require fresh auth

    const handlePasswordSuccess = useCallback(() => {
        if (pendingSection) {
            setCurrentAuthentication(pendingSection); // Set authentication only for the current section
            setPendingSection(null);
        }
        setShowPasswordModal(false);
    }, [pendingSection]);

    const handlePasswordCancel = useCallback(() => {
        setPendingSection(null);
        setShowPasswordModal(false);
    }, []);

    const clearAuthentication = useCallback(() => {
        setCurrentAuthentication(null);
        setPendingSection(null);
        setShowPasswordModal(false);
    }, []);

    const isAuthenticated = useCallback((sectionName) => {
        // Table section is always accessible
        if (sectionName === 'Table') {
            return true;
        }
        
        // For protected sections, only return true if currently authenticated for that exact section
        // and user hasn't navigated away
        return currentAuthentication === sectionName;
    }, [currentAuthentication]);

    return {
        requestAccess,
        handlePasswordSuccess,
        handlePasswordCancel,
        clearAuthentication,
        isAuthenticated,
        showPasswordModal,
        pendingSection,
        restrictedSections
    };
};
