import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { orderService } from '../../../../services/orderService';
import LoadingSpinner from '../../../../components/LoadingSpinner';

const PaymentHistory = ({ isOpen, onClose }) => {
    const [completedOrders, setCompletedOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [error, setError] = useState(null);

    const fetchCompletedOrders = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const response = await orderService.getCompletedOrders(page, 20);
            if (response.success) {
                setCompletedOrders(response.data.orders);
                setPagination(response.data.pagination);
            } else {
                setError('Failed to fetch payment history');
            }
        } catch (error) {
            console.error('Error fetching completed orders:', error);
            setError(error.message || 'Failed to fetch payment history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCompletedOrders(currentPage);
        }
    }, [isOpen, currentPage]);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-6xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Payment History</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <LoadingSpinner />
                            <span className="ml-3 text-gray-600">Loading payment history...</span>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-red-500 mb-2">⚠️</div>
                                <p className="text-red-600 font-medium">{error}</p>
                                <button
                                    onClick={() => fetchCompletedOrders(currentPage)}
                                    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : completedOrders.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <div className="text-4xl mb-3">📝</div>
                                <p className="font-medium">No completed payments found</p>
                                <p className="text-sm">Complete some orders to see payment history here</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Table Headers */}
                            <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <div className="grid grid-cols-12 gap-4 font-medium text-gray-700 text-sm">
                                    <div className="col-span-1">Table</div>
                                    <div className="col-span-2">Order ID</div>
                                    <div className="col-span-4">Items</div>
                                    <div className="col-span-2">Total</div>
                                    <div className="col-span-3">Completed At</div>
                                </div>
                            </div>

                            {/* Orders List */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="space-y-3">
                                    {completedOrders.map((order) => (
                                        <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="grid grid-cols-12 gap-4 items-start">
                                                {/* Table Number */}
                                                <div className="col-span-1">
                                                    <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-medium text-sm">
                                                        {order.tableNumber}
                                                    </div>
                                                </div>

                                                {/* Order ID */}
                                                <div className="col-span-2">
                                                    <div className="font-mono text-xs text-gray-500 truncate">
                                                        {order.id}
                                                    </div>
                                                </div>

                                                {/* Items */}
                                                <div className="col-span-4">
                                                    <div className="space-y-1">
                                                        {order.items && order.items.length > 0 ? (
                                                            <>
                                                                {order.items.slice(0, 3).map((item, index) => (
                                                                    <div key={index} className="text-sm text-gray-700">
                                                                        <span className="font-medium">{item.quantity}x</span> {item.name}
                                                                        <span className="text-gray-500 ml-2">{formatCurrency(item.totalPrice)}</span>
                                                                    </div>
                                                                ))}
                                                                {order.items.length > 3 && (
                                                                    <div className="text-xs text-gray-500">
                                                                        +{order.items.length - 3} more items
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="text-sm text-gray-500 italic">
                                                                No items (Empty bill)
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Total */}
                                                <div className="col-span-2">
                                                    <div className="text-lg font-bold text-green-600">
                                                        {formatCurrency(order.total)}
                                                    </div>
                                                    {order.subtotal !== order.total && (
                                                        <div className="text-xs text-gray-500">
                                                            Subtotal: {formatCurrency(order.subtotal)}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Completed At */}
                                                <div className="col-span-3">
                                                    <div className="text-sm text-gray-700">
                                                        {formatDate(order.completedAt)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Status: {order.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="mt-4 flex items-center justify-between border-t pt-4">
                                    <div className="text-sm text-gray-600">
                                        Showing {completedOrders.length} of {pagination.totalOrders} completed payments
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={!pagination.hasPrevPage}
                                            className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-3 py-1 rounded bg-blue-100 text-blue-800 font-medium">
                                            {pagination.currentPage} of {pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={!pagination.hasNextPage}
                                            className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

PaymentHistory.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default PaymentHistory;
