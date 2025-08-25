// Primary Button Component
export const PrimaryButton = ({ 
    children, 
    onClick, 
    disabled = false, 
    className = "", 
    type = "button",
    ...props 
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`bg-primaryColor text-white px-6 py-3 rounded-lg 
                hover:bg-opacity-90 transition-colors duration-200 font-medium
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-primaryColor focus:ring-opacity-50
                ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

// Secondary Button Component
export const SecondaryButton = ({ 
    children, 
    onClick, 
    disabled = false, 
    className = "", 
    type = "button",
    ...props 
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`bg-transparent text-primaryColor border-2 border-primaryColor px-6 py-3 rounded-lg 
                hover:bg-primaryColor hover:text-white transition-all duration-200 font-medium
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-primaryColor focus:ring-opacity-50
                ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
