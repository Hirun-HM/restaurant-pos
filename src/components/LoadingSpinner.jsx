import { Spinner } from 'flowbite-react'

export default function LoadingSpinner() {
    return (
        <div className='h-screen w-full flex items-center justify-center bg-opacity-45 bg-other1'>
            <Spinner color="warning" aria-label="Warning spinner example" />
        </div>
    )
}
