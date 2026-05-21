/**
 * Sarvam AI API Client Service
 * Interacts with the backend proxies located at `/api/sarvam/*`
 */
import { api } from './apiService';

const endpoints = {
    STT: '/sarvam/speech-to-text',
    TTS: '/sarvam/text-to-speech',
    TRANSLATE: '/sarvam/translate',
};

/**
 * Perform Speech-To-Text (Saarasv3)
 * @param {Blob} audioBlob - The recorded audio stream
 * @param {String} languageCode - Language code like 'en-IN', 'hi-IN', 'ta-IN'
 * @returns {Promise<Object>} - returns { transcript: "..." }
 */
export const speechToText = async (audioBlob, languageCode = 'en-IN') => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    if (languageCode) {
        formData.append('language_code', languageCode);
    }

    try {
        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        const response = await api.post(endpoints.STT, formData, config);
        return response;
    } catch (error) {
        console.error('STT Request Failed:', error);
        throw error;
    }
};

/**
 * Perform Text-To-Speech (Bulbulv3)
 * @param {String} text - text to be synthesized
 * @param {String} targetLanguageCode - like 'en-IN', 'hi-IN', 'ta-IN'
 * @param {String} expectedGender - 'male' or 'female'
 * @returns {Promise<ArrayBuffer>} - returns binary audio data playable by browsers
 */
export const textToSpeech = async (text, targetLanguageCode, expectedGender = 'male') => {
    try {
        const response = await api.post(endpoints.TTS, {
            inputs: [text],
            target_language_code: targetLanguageCode,
            expected_gender: expectedGender
        }, {
            responseType: 'arraybuffer'
        });

        return response;
    } catch (error) {
        console.error('TTS Request Failed:', error);
        throw error;
    }
};

/**
 * Perform Translation (Mayurav1)
 * @param {String} text - text to translate
 * @param {String} sourceLanguageCode - source lang like 'en-IN', 'hi-IN'
 * @param {String} targetLanguageCode - target lang like 'hi-IN', 'ta-IN'
 * @returns {Promise<String>}
 */
export const translateText = async (text, sourceLanguageCode, targetLanguageCode) => {
    try {
        const response = await api.post(endpoints.TRANSLATE, {
            input: text,
            source_language_code: sourceLanguageCode,
            target_language_code: targetLanguageCode
        });

        // Translate format => { "translated_text": "..." }
        return response;
    } catch (error) {
        console.error('Translation Request Failed:', error);
        throw error;
    }
};
