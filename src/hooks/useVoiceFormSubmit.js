import { useEffect } from 'react';

export function useVoiceFormSubmit(formId, submitFn) {
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.formId === formId) submitFn();
    };
    window.addEventListener('suvidha:submit-form', handler);
    return () => window.removeEventListener('suvidha:submit-form', handler);
  }, [formId, submitFn]);
}

export default useVoiceFormSubmit;
