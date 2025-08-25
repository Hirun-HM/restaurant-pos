import TableCard from './TableCard'

export default function TableManagement({tableList = []}) {
    return (
        <div className='flex flex-col md:flex-row gap-2 h-full md:h-[78vh] mt-5'>
            {/* for tables */}
            <div className='p-6 w-full md:w-1/3 overflow-y-auto bg-fourthColor rounded-[32px]'>
                <h1 className='text-[24px] font-[500]'>Table List</h1>
                <div className='grid grid-cols-1 gap-2 md:grid-cols-2 mt-5'>
                    {
                        tableList.map((table) => (
                            <TableCard
                                key={table.id}
                                tableNumber={table.tableNumber}
                                status={table.status}
                                customerCount={table.customerCount}
                                orderTime={table.orderTime}
                            />
                        ))
                    }
                </div>
            </div>

            {/* for food items */}
            <div className='p-6 w-full md:flex-1 overflow-hidden bg-fourthColor rounded-[32px]'>
                <h1 className='text-[24px] font-[500]'>Order Summary</h1>
            </div>
        </div>
    )
}
