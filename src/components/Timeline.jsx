import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/helpers';

/**
 * Timeline component for tracking request status
 */
const Timeline = ({ events = [], currentStatus }) => {
  const { t, i18n } = useTranslation();

  const statusOrder = ['submitted', 'inProgress', 'resolved', 'closed'];

  const currentStatusIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="tl">
      {events.map((event, index) => {
        const eventStatusIndex = statusOrder.indexOf(event.status);
        const isCompleted = eventStatusIndex < currentStatusIndex;
        const isCurrent = eventStatusIndex === currentStatusIndex;

        return (
          <div key={index} className="tl-item">
            <div className={`tl-dot${isCompleted ? ' done' : ''}${isCurrent ? ' now' : ''}`}>
              {index + 1}
            </div>
            <div className="card" style={{ flex: 1, border: isCurrent ? '2px solid var(--indigo-700)' : undefined }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <span className={`badge ${isCompleted ? 'b-ok' : isCurrent ? 'b-info' : ''}`}>
                  {t(`tracking.${event.status}`)}
                </span>
                <span className="meta">
                  {formatDate(event.timestamp, i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'ta' ? 'ta-IN' : 'en-IN')}
                </span>
              </div>
              <p className="body">{event.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
