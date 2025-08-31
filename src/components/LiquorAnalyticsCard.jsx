import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaTint, FaWineBottle, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';
import AnimatedNumber from './AnimatedNumber';

const LiquorAnalyticsCard = ({ liquor }) => {
  const [analytics, setAnalytics] = useState(null);

  // Calculate analytics from liquor data
  useEffect(() => {
    if (liquor) {
      const calculateAnalytics = () => {
        const isHardLiquor = liquor.type === 'hard_liquor';
        
        if (isHardLiquor) {
          // Hard liquor analytics
          const totalVolumeSold = liquor.totalSoldVolume || 0;
          
          // Current bottle status
          const currentBottleStatus = liquor.bottlesInStock > 0 ? {
            isOpen: liquor.currentBottleVolume < liquor.bottleVolume,
            volumeUsed: liquor.bottleVolume - liquor.currentBottleVolume,
            volumeRemaining: liquor.currentBottleVolume,
            progressPercent: ((liquor.bottleVolume - liquor.currentBottleVolume) / liquor.bottleVolume * 100)
          } : null;
          
          return {
            type: 'hard_liquor',
            bottlesInStock: liquor.bottlesInStock || 0,
            totalBottlesSold: liquor.totalSoldItems || 0, // Use totalSoldItems for bottles sold count
            totalVolumeRemaining: liquor.totalVolumeRemaining || 0,
            totalSoldVolume: totalVolumeSold,
            wastedVolume: liquor.wastedVolume || 0,
            currentBottle: currentBottleStatus,
            efficiency: totalVolumeSold > 0 ? 
              ((totalVolumeSold / (totalVolumeSold + (liquor.wastedVolume || 0))) * 100) : 100,
            bottleVolume: liquor.bottleVolume
          };
        } else {
          // Beer, wine, cigarettes analytics  
          const unitName = liquor.type === 'cigarettes' ? 'packs' : 'bottles';
          const totalUnitsReceived = (liquor.bottlesInStock || 0) + (liquor.totalSoldItems || 0);
          
          return {
            type: liquor.type,
            unitsInStock: liquor.bottlesInStock || 0,
            totalUnitsSold: liquor.totalSoldItems || 0,
            totalUnitsReceived: totalUnitsReceived,
            unitName: unitName,
            stockTurnover: totalUnitsReceived > 0 ? 
              ((liquor.totalSoldItems || 0) / totalUnitsReceived * 100) : 0
          };
        }
      };

      setAnalytics(calculateAnalytics());
    }
  }, [liquor]);

  if (!analytics) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-5 space-y-4 border border-yellow-200">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <FaChartLine className="text-yellow-600" />
          Stock Analytics
        </h4>
        {liquor.isLowStock && (
          <FaExclamationTriangle className="text-orange-500 text-lg" title="Low Stock Warning" />
        )}
      </div>
      
      {analytics.type === 'hard_liquor' ? (
        // Hard Liquor Analytics
        <div className="space-y-4">
          {/* Stock Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 text-center border">
              <div className="text-2xl font-bold text-green-600">
                <AnimatedNumber value={analytics.bottlesInStock} />
              </div>
              <div className="text-xs text-gray-600">Bottles in Stock</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border">
              <div className="text-2xl font-bold text-blue-600">
                <AnimatedNumber value={analytics.totalBottlesSold} />
              </div>
              <div className="text-xs text-gray-600">Bottles Sold</div>
            </div>
          </div>
          
          {/* Volume Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center gap-2 mb-1">
                <FaTint className="text-yellow-500" />
                <span className="text-gray-600">Volume Sold</span>
              </div>
              <div className="font-bold text-yellow-600">
                <AnimatedNumber value={analytics.totalSoldVolume} suffix="ml" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center gap-2 mb-1">
                <FaWineBottle className="text-green-500" />
                <span className="text-gray-600">Volume Remaining</span>
              </div>
              <div className="font-bold text-green-600">{analytics.totalVolumeRemaining.toLocaleString()}ml</div>
            </div>
          </div>
          
          {/* Waste Information */}
          {analytics.wastedVolume > 0 && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-600">⚠️</span>
                <span className="text-gray-700 font-medium">Volume Wasted</span>
              </div>
              <div className="text-red-700 font-bold">{analytics.wastedVolume}ml</div>
              <div className="text-xs text-red-600">
                {((analytics.wastedVolume / (analytics.totalSoldVolume + analytics.wastedVolume)) * 100).toFixed(1)}% of total handled
              </div>
            </div>
          )}
          
          {/* Current Bottle Progress */}
          {analytics.bottlesInStock > 0 && analytics.currentBottle && (
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <FaWineBottle className="text-yellow-600" />
                <span className="font-medium text-gray-800">Current Bottle Status</span>
              </div>
              
              {analytics.currentBottle.isOpen ? (
                <>
                  <div className="bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${analytics.currentBottle.progressPercent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {analytics.currentBottle.volumeRemaining}ml remaining
                    </span>
                    <span className="font-medium text-yellow-600">
                      {analytics.currentBottle.progressPercent.toFixed(1)}% used
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {analytics.currentBottle.volumeUsed}ml used from current bottle
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <div className="text-green-600 font-medium">Fresh Bottle Ready</div>
                  <div className="text-sm text-gray-600">{analytics.bottleVolume}ml full capacity</div>
                </div>
              )}
            </div>
          )}
          
          {/* Efficiency Rating */}
          <div className="bg-white rounded-lg p-3 border">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Efficiency Rating</div>
              <div className={`text-2xl font-bold ${(() => {
                if (analytics.efficiency > 95) return 'text-green-600';
                if (analytics.efficiency > 90) return 'text-yellow-600';
                return 'text-red-600';
              })()}`}>
                {analytics.efficiency.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                Sales vs Total Volume Handled
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Beer, Wine, Cigarettes Analytics
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 text-center border">
              <div className="text-2xl font-bold text-green-600">
                <AnimatedNumber value={analytics.unitsInStock} />
              </div>
              <div className="text-sm text-gray-600">In Stock</div>
              <div className="text-xs text-gray-500">{analytics.unitName}</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border">
              <div className="text-2xl font-bold text-yellow-600">
                <AnimatedNumber value={analytics.totalUnitsSold} />
              </div>
              <div className="text-sm text-gray-600">Units Sold</div>
              <div className="text-xs text-gray-500">{analytics.unitName}</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Stock Turnover</div>
              <div className="text-xl font-bold text-purple-600">
                {analytics.stockTurnover.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                {analytics.totalUnitsSold} sold of {analytics.totalUnitsReceived} received
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

LiquorAnalyticsCard.propTypes = {
  liquor: PropTypes.object.isRequired
};

export default LiquorAnalyticsCard;
