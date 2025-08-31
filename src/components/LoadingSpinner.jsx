import { Spinner } from 'flowbite-react'

export default function LoadingSpinner() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
            <div className="bg-transparent p-4 rounded-lg ">
                <Spinner 
                    color="warning" 
                    size="xl"
                    className="w-12 h-12"
                    aria-label="Loading..." 
                />
            </div>
        </div>
    )
}
