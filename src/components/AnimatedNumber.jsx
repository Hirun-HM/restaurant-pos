import React from 'react';
import { useCountAnimation } from '../hooks/useCountAnimation';

const AnimatedNumber = ({ 
    value, 
    duration = 2000, 
    startDelay = 0, 
    prefix = '', 
    suffix = '',
    className = '',
    formatValue = null 
}) => {
    const { currentValue, isAnimating } = useCountAnimation(value, duration, startDelay);
    
    const displayValue = formatValue ? formatValue(currentValue) : currentValue;
    
    return (
        <span className={`${className} transition-all duration-300 ${isAnimating ? 'text-opacity-80' : 'text-opacity-100'}`}>
            {prefix}{displayValue}{suffix}
        </span>
    );
};

export default AnimatedNumber;
