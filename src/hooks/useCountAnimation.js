import { useEffect, useState, useRef } from 'react';

export const useCountAnimation = (targetValue, duration = 2000, startDelay = 0) => {
    const [currentValue, setCurrentValue] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        // Clear any existing animations
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Parse target value
        const endValue = typeof targetValue === 'string' 
            ? parseFloat(targetValue.replace(/[^\d.-]/g, '')) || 0
            : Number(targetValue) || 0;

        if (endValue === 0) {
            setCurrentValue(0);
            setIsAnimating(false);
            return;
        }

        // Start animation after delay
        timeoutRef.current = setTimeout(() => {
            setIsAnimating(true);
            const startTime = Date.now();
            const startValue = 0;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function for smooth animation
                const easeOutCubic = 1 - Math.pow(1 - progress, 3);
                const currentVal = startValue + (endValue - startValue) * easeOutCubic;
                
                setCurrentValue(Math.round(currentVal));
                
                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                } else {
                    setIsAnimating(false);
                    setCurrentValue(endValue); // Ensure we end exactly at target
                }
            };

            animationRef.current = requestAnimationFrame(animate);
        }, startDelay);

        // Cleanup function
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            setIsAnimating(false);
        };
    }, [targetValue, duration, startDelay]);

    return { currentValue, isAnimating };
};

export const useStaggeredCountAnimation = (values, duration = 2000, staggerDelay = 200) => {
    return values.map((value, index) => 
        useCountAnimation(value, duration, index * staggerDelay)
    );
};
