import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, Circle } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { statusConfig } from '../utils/constants';

/**
 * Timeline component for tracking request status
 */
const Timeline = ({ events = [], currentStatus }) => {
  const { t, i18n } = useTranslation();

  const statusOrder = ['submitted', 'inProgress', 'resolved', 'closed'];
  
  const getStatusIcon = (status, isCompleted, isCurrent) => {
    if (isCompleted) {
      return (
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
      );
    }
    if (isCurrent) {
      return (
        <div className="w-10 h-10 rounded-full bg-government-blue flex items-center justify-center animate-pulse-slow">
          <Clock className="w-6 h-6 text-white" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
        <Circle className="w-6 h-6 text-gray-400" />
      </div>
    );
  };

  const currentStatusIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="relative">
      {events.map((event, index) => {
        const eventStatusIndex = statusOrder.indexOf(event.status);
        const isCompleted = eventStatusIndex < currentStatusIndex;
        const isCurrent = eventStatusIndex === currentStatusIndex;
        const isLast = index === events.length - 1;

        return (
          <div key={index} className="relative flex items-start mb-8 last:mb-0">
            {/* Vertical Line */}
            {!isLast && (
              <div 
                className={`absolute left-5 top-10 w-0.5 h-full -ml-px ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
            
            {/* Icon */}
            <div className="relative z-10 flex-shrink-0">
              {getStatusIcon(event.status, isCompleted, isCurrent)}
            </div>
            
            {/* Content */}
            <div className="ml-6 flex-1">
              <div className={`
                p-4 rounded-kiosk border-2 
                ${isCurrent ? 'border-government-blue bg-blue-50' : 'border-gray-200 bg-white'}
              `}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className={`
                    px-3 py-1 rounded-full text-kiosk-sm font-semibold
                    ${statusConfig[event.status]?.bgColor || 'bg-gray-100'}
                    ${statusConfig[event.status]?.textColor || 'text-gray-700'}
                  `}>
                    {t(`tracking.${event.status}`)}
                  </span>
                  <span className="text-kiosk-sm text-gray-500">
                    {formatDate(event.timestamp, i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'ta' ? 'ta-IN' : 'en-IN')}
                  </span>
                </div>
                <p className="text-kiosk-base text-gray-700">
                  {event.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
