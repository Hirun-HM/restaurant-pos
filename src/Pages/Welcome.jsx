import { useState } from 'react';
import { RiAdminFill } from "react-icons/ri";
import { FaUser } from "react-icons/fa";
import PopupComponent from '../components/PopupComponent';

const userTypes = [
        {
            id: 1,
            name: 'Cashier',
            icon: FaUser,
            description: 'Access point-of-sale features and customer transactions',
        },
        {
            id: 2,
            name: 'Admin',
            icon: RiAdminFill,
            description: 'Full system access with management capabilities',
        }
    ];

export default function Welcome() {
    const [selectedCard, setSelectedCard] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    

    const handleCardClick = (userType) => {
        setSelectedCard(userType);
        setIsPopupOpen(true);
    };

    const handleClosePopup = () => {
        setIsPopupOpen(false);
        setSelectedCard(null);
    };

    const UserCard = ({ userType }) => {
        const IconComponent = userType.icon;
        
        return (
            <div 
                className={`group cursor-pointer p-6 flex flex-col items-center justify-center 
                    w-full max-w-sm h-48 sm:h-56 border-2 rounded-xl transition-all duration-300 
                    transform hover:scale-105 
                    hover:shadow-lg active:scale-95 bg-thirdPartyColor hover:bg-secondaryColor`}
                onClick={() => handleCardClick(userType)}
            >
                <div className={`mb-4 ${userType.color} transition-transform duration-300 group-hover:scale-110`}>
                    <IconComponent size={48} className="sm:w-16 sm:h-16" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 text-center">
                    {userType.name}
                </h3>
                <p className="text-[16px] text-gray-600 text-center mt-2 ">
                    Click to continue
                </p>
            </div>
        );
    };

    return (
        <div className="font-poppins min-h-screen">
            {/* Header */}
            <div className="text-center pt-8 pb-6 px-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
                    🍽️ Hotel Heaven
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                    Welcome! Please select your role to continue
                </p>
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-center min-h-[60vh] px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 w-full max-w-4xl">
                    {userTypes.map((userType) => (
                        <UserCard key={userType.id} userType={userType} />
                    ))}
                </div>
            </div>

            {/* Popup Component */}
            <PopupComponent 
                isOpen={isPopupOpen} 
                onClose={handleClosePopup}
                title={selectedCard?.name || ''}
            >
                {selectedCard && (
                    <div className="text-center">
                        <div className={`mb-6 ${selectedCard.color} flex justify-center`}>
                            <selectedCard.icon size={64} />
                        </div>
                        <p className="text-gray-700 mb-6 leading-relaxed">
                            {selectedCard.description}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                                className="flex-1 bg-primaryColor text-white px-6 py-3 rounded-lg 
                                    hover:bg-orange-600 transition-colors duration-200 font-medium"
                                onClick={() => {
                                    // Add your navigation logic here
                                    console.log(`Continuing as ${selectedCard.name}`);
                                    handleClosePopup();
                                }}
                            >
                                Continue as {selectedCard.name}
                            </button>
                            <button 
                                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg 
                                    hover:bg-gray-300 transition-colors duration-200 font-medium"
                                onClick={handleClosePopup}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </PopupComponent>
        </div>
    );
}
