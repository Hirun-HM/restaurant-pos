import React from 'react';

export default function LoadingSpinner() {
    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
            <span className="loader"></span>
            <style>{`
                .loader {
                    width: 48px;
                    height: 48px;
                    border: 5px solid #FFD700;
                    border-bottom-color: transparent;
                    border-radius: 50%;
                    display: inline-block;
                    box-sizing: border-box;
                    animation: rotation 1s linear infinite;
                }
                @keyframes rotation {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    )
}
