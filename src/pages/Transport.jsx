import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Train, Bus, CreditCard, Ticket, MapPin, MessageSquare,
  Search, FileText, UserCog, ArrowLeft,
} from 'lucide-react';
import { Button, Input, Select, TextArea, Modal, LoadingSpinner } from '../components';
import { VK, I, ic } from '../components/kiosk';
import { TransportIcon } from '../assets/icons';
import QRUpload from '../components/QRUpload';
import { states, cities, wards } from '../utils/constants';
import { generateRequestId, getCurrentTimestamp } from '../utils/helpers';
import { serviceAPI, transportAPI } from '../utils/apiService';
import { addReceipt } from '../utils/receipts';

// Mock station/route data
const metroStations = [
  'Central Station', 'Park Street', 'City Hall', 'Tech Park', 'Airport',
  'University', 'Marina Beach', 'Fort', 'Nehru Place', 'Gandhi Nagar',
  'Hospital Junction', 'Market Square', 'Stadium', 'Bus Terminal', 'Railway Junction'
];

const busRoutes = [
  { id: 'R1', name: 'Route 1 - Central ↔ Airport', fare: 45 },
  { id: 'R2', name: 'Route 2 - University ↔ Tech Park', fare: 30 },
  { id: 'R3', name: 'Route 3 - Marina ↔ Stadium', fare: 25 },
  { id: 'R4', name: 'Route 4 - Railway Station ↔ Bus Terminal', fare: 35 },
  { id: 'R5', name: 'Route 5 - Hospital ↔ Market Square', fare: 20 },
  { id: 'R6', name: 'Route 6 - City Express - All Stops', fare: 50 },
];

const trainStations = [
  'Central Suburban', 'Dadar', 'Andheri', 'Borivali', 'Thane',
  'Kalyan', 'Panvel', 'Vashi', 'Churchgate', 'Grant Road'
];

const busPassTypes = [
  { id: 'monthly', name: 'Monthly Pass', price: 1200 },
  { id: 'quarterly', name: 'Quarterly Pass', price: 3200 },
  { id: 'student_monthly', name: 'Student Monthly', price: 600 },
  { id: 'senior_monthly', name: 'Senior Citizen Monthly', price: 800 },
];

const Transport = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [view, setView] = useState('categories'); // 'categories' | 'booking' | 'complaint'
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');

  const [bookingData, setBookingData] = useState({
    fromStation: '',
    toStation: '',
    passengers: '1',
    travelDate: new Date().toISOString().split('T')[0],
    travelTime: '',
    busRoute: '',
    trainClass: 'second',
    passType: '',
    passengerName: sessionStorage.getItem('userName') || '',
    passengerMobile: sessionStorage.getItem('userMobile') || '',
  });

  const [formData, setFormData] = useState({
    name: sessionStorage.getItem('userName') || '',
    mobile: sessionStorage.getItem('userMobile') || '',
    email: '',
    vehicleNumber: '',
    licenseNumber: '',
    state: '',
    city: '',
    ward: '',
    address: '',
    description: '',
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  const mainServices = [
    {
      id: 'metroTicket',
      LucideIcon: Train,
      title: t('transport.metroTicket', 'Metro Ticket'),
      description: t('home.transportMetroDesc', 'Book metro rail tickets instantly'),
      color: '#0e7490',
      bg: 'color-mix(in oklab, #0e7490 12%, white)',
      booking: true,
    },
    {
      id: 'busTicket',
      LucideIcon: Bus,
      title: t('transport.busTicket', 'Bus Ticket'),
      description: t('home.transportBusDesc', 'Reserve city bus tickets for your route'),
      color: '#0891b2',
      bg: 'color-mix(in oklab, #0891b2 12%, white)',
      booking: true,
    },
    {
      id: 'busPass',
      LucideIcon: CreditCard,
      title: t('transport.busPass', 'Bus Pass'),
      description: t('home.transportPassDesc', 'Purchase monthly or quarterly bus passes'),
      color: '#1d4ed8',
      bg: 'color-mix(in oklab, #1d4ed8 12%, white)',
      booking: true,
    },
    {
      id: 'vehicleComplaint',
      LucideIcon: MessageSquare,
      title: t('home.transportComplaint', 'Report an Issue'),
      description: t('home.transportComplaintDesc', 'Report road, vehicle or transport complaints'),
      color: '#ea580c',
      bg: 'color-mix(in oklab, #ea580c 12%, white)',
      booking: false,
    },
    {
      id: '_track',
      LucideIcon: Search,
      title: t('home.transportTrack', 'Track Request'),
      description: t('home.transportTrackDesc', 'Check real-time status of your requests'),
      path: '/track-status',
      color: '#475569',
      bg: 'color-mix(in oklab, #475569 12%, white)',
    },
    {
      id: '_receipt',
      LucideIcon: FileText,
      title: t('home.transportReceipt', 'View Receipts'),
      description: t('home.transportReceiptDesc', 'View and print transaction receipts'),
      path: '/receipt?org=transport',
      color: '#059669',
      bg: 'color-mix(in oklab, #059669 12%, white)',
    },
  ];

  const getLocalizedName = (item) => {
    if (i18n.language === 'hi' && item.nameHi) return item.nameHi;
    if (i18n.language === 'ta' && item.nameTa) return item.nameTa;
    return item.name;
  };

  const availableCities = formData.state ? cities[formData.state] || [] : [];
  const availableWards = formData.city ? wards[formData.city] || wards.default : [];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (field === 'state') setFormData(prev => ({ ...prev, city: '', ward: '' }));
    if (field === 'city') setFormData(prev => ({ ...prev, ward: '' }));
  };

  const handleBookingChange = (field, value) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const calculateFare = () => {
    const passengers = parseInt(bookingData.passengers) || 1;
    if (selectedCategory === 'metroTicket') return 30 * passengers;
    if (selectedCategory === 'busTicket') {
      const route = busRoutes.find(r => r.id === bookingData.busRoute);
      return (route?.fare || 30) * passengers;
    }
    if (selectedCategory === 'suburbanTrain') {
      const basePrice = bookingData.trainClass === 'first' ? 80 : 25;
      return basePrice * passengers;
    }
    if (selectedCategory === 'busPass') {
      const pass = busPassTypes.find(p => p.id === bookingData.passType);
      return pass?.price || 0;
    }
    return 0;
  };

  const validateBooking = () => {
    const newErrors = {};
    if (!bookingData.passengerName.trim()) newErrors.passengerName = 'Required';
    if (!bookingData.passengerMobile.trim()) newErrors.passengerMobile = 'Required';
    if (selectedCategory === 'metroTicket' || selectedCategory === 'suburbanTrain') {
      if (!bookingData.fromStation) newErrors.fromStation = 'Select station';
      if (!bookingData.toStation) newErrors.toStation = 'Select station';
      if (bookingData.fromStation && bookingData.fromStation === bookingData.toStation) {
        newErrors.toStation = 'Must be different';
      }
    }
    if (selectedCategory === 'busTicket') {
      if (!bookingData.busRoute) newErrors.busRoute = 'Select route';
    }
    if (selectedCategory === 'busPass') {
      if (!bookingData.passType) newErrors.passType = 'Select pass type';
    }
    if (!bookingData.travelDate) newErrors.travelDate = 'Select date';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateComplaintForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('errors.required');
    if (!formData.mobile.trim()) newErrors.mobile = t('errors.required');
    if (!formData.state) newErrors.state = t('errors.required');
    if (!formData.city) newErrors.city = t('errors.required');
    if (!formData.ward) newErrors.ward = t('errors.required');
    if (!formData.address.trim()) newErrors.address = t('errors.required');
    if (!formData.description.trim()) newErrors.description = t('errors.required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBookTicket = async () => {
    if (!validateBooking()) return;
    setLoading(true);
    try {
      const fare = calculateFare();
      let ticketId;
      try {
        const apiResult = await transportAPI.bookTicket({
          ticketType: selectedCategory,
          fromStation: bookingData.fromStation,
          toStation: bookingData.toStation,
          passengers: parseInt(bookingData.passengers) || 1,
          travelDate: bookingData.travelDate,
          travelTime: bookingData.travelTime,
          busRoute: bookingData.busRoute,
          trainClass: bookingData.trainClass,
          passType: bookingData.passType,
          passengerName: bookingData.passengerName,
          passengerMobile: bookingData.passengerMobile,
        });
        ticketId = apiResult.ticketId;
      } catch {
        ticketId = `TKT-${generateRequestId()}`;
      }
      const result = {
        ticketId,
        type: selectedCategory,
        from: bookingData.fromStation || '-',
        to: bookingData.toStation || '-',
        route: bookingData.busRoute ? busRoutes.find(r => r.id === bookingData.busRoute)?.name : '-',
        passType: bookingData.passType ? busPassTypes.find(p => p.id === bookingData.passType)?.name : '-',
        passengers: bookingData.passengers,
        date: bookingData.travelDate,
        fare,
        passengerName: bookingData.passengerName,
        status: 'confirmed',
        timestamp: getCurrentTimestamp(),
      };
      setBookingResult(result);
      addReceipt({
        requestId: ticketId,
        citizenName: bookingData.passengerName,
        mobile: bookingData.passengerMobile,
        serviceType: 'transport',
        serviceCategory: `Ticket Booking - ${selectedCategory}`,
        timestamp: getCurrentTimestamp(),
        status: 'confirmed',
        fare: `₹${fare}`,
      });
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplaintSubmit = () => {
    if (validateComplaintForm()) setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      let requestId;
      try {
        const result = await serviceAPI.submit({
          serviceType: 'transport',
          serviceCategory: selectedCategory,
          citizenName: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          vehicleNumber: formData.vehicleNumber,
          licenseNumber: formData.licenseNumber,
          state: formData.state,
          city: formData.city,
          ward: formData.ward,
          address: formData.address,
          description: formData.description,
          aadhaarUid: sessionStorage.getItem('aadhaarUid'),
        });
        requestId = result.requestId;
      } catch {
        requestId = generateRequestId();
      }
      const receiptData = {
        requestId,
        citizenName: formData.name,
        mobile: formData.mobile,
        serviceType: 'transport',
        serviceCategory: t(`transport.${selectedCategory}`),
        timestamp: getCurrentTimestamp(),
        status: 'submitted',
      };
      addReceipt(receiptData);
      navigate(`/receipt?org=${encodeURIComponent(receiptData.serviceType)}&id=${encodeURIComponent(receiptData.requestId)}`);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <VK bg="color-mix(in oklab, #0891b2 4%, white)">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="large" message={selectedCategory && mainServices.find(s => s.id === selectedCategory)?.booking ? 'Booking your ticket...' : t('app.loading')} />
        </div>
      </VK>
    );
  }

  if (bookingResult) {
    return (
      <VK bg="color-mix(in oklab, #0891b2 4%, white)">
        <div>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0891b2, #1d4ed8)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12, boxShadow: '0 4px 16px rgba(8,145,178,0.25)',
            }}>
              <TransportIcon size={40} color="#fff" />
            </div>
            <h1 className="h2" style={{ marginBottom: 6 }}>
              {t('transport.title', 'Transport Department')}
            </h1>
          </div>

          <div className="bg-white rounded-kiosk-lg shadow-kiosk p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-kiosk-2xl font-bold text-green-700 mb-2">Booking Confirmed!</h2>
            <p className="text-kiosk-lg text-gray-600 mb-6">Your ticket has been booked successfully</p>

            <div className="bg-gray-50 rounded-kiosk p-6 text-left space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Ticket ID:</span>
                <span className="font-bold text-government-blue">{bookingResult.ticketId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Passenger:</span>
                <span>{bookingResult.passengerName}</span>
              </div>
              {bookingResult.from !== '-' && (
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">From → To:</span>
                  <span>{bookingResult.from} → {bookingResult.to}</span>
                </div>
              )}
              {bookingResult.route !== '-' && (
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Route:</span>
                  <span className="text-right">{bookingResult.route}</span>
                </div>
              )}
              {bookingResult.passType !== '-' && (
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Pass Type:</span>
                  <span>{bookingResult.passType}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Date:</span>
                <span>{bookingResult.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Passengers:</span>
                <span>{bookingResult.passengers}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-bold text-gray-800 text-kiosk-lg">Total Fare:</span>
                <span className="font-bold text-green-700 text-kiosk-lg">₹{bookingResult.fare}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate(`/receipt?org=transport&id=${encodeURIComponent(bookingResult.ticketId)}`)} size="large">
                View Receipt
              </Button>
              <Button variant="secondary" onClick={() => navigate('/home')} size="large">Go Home</Button>
            </div>
          </div>
        </div>
      </VK>
    );
  }

  return (
    <VK bg="color-mix(in oklab, #0891b2 4%, white)">
      {/* CATEGORY SELECTION */}
      {view === 'categories' && (
        <>
          {/* Dept header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0891b2, #1d4ed8)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, boxShadow: '0 8px 32px rgba(8,145,178,0.3)',
            }}>
              <TransportIcon size={60} color="#fff" />
            </div>
            <h1 className="h2" style={{ marginBottom: 10 }}>
              {t('transport.title', 'Transport Department')}
            </h1>
            <p className="body-l" style={{ color: 'var(--ink-500)' }}>
              {t('transport.subtitle', 'Metro · Bus · Passes · Complaints · Tracking')}
            </p>
          </div>

          {/* Service grid — 3 cols for kiosk */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
            {mainServices.map((s) => {
              const Icon = s.LucideIcon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (s.path) {
                      navigate(s.path);
                    } else if (s.booking) {
                      setSelectedCategory(s.id);
                      setView('booking');
                      setStep(1);
                    } else {
                      setSelectedCategory(s.id);
                      setView('complaint');
                      setStep(2);
                    }
                  }}
                  className="tile"
                  style={{
                    minHeight: 260,
                    padding: 32,
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    gap: 20,
                    borderTop: `6px solid ${s.color}`,
                    touchAction: 'manipulation',
                  }}
                  aria-label={s.title}
                >
                  <div style={{
                    width: 72, height: 72, borderRadius: 20,
                    background: s.bg, display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    <Icon size={36} style={{ color: s.color }} strokeWidth={2} />
                  </div>
                  <div className="nm" style={{ fontSize: 26, lineHeight: 1.3 }}>{s.title}</div>
                  <div className="sub" style={{ fontSize: 20, marginTop: 'auto' }}>{s.description}</div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="btn btn-quiet"
            style={{ alignSelf: 'center', fontSize: 22, padding: '18px 48px' }}
            onClick={() => navigate('/home')}
          >
            <I d={ic.back} size={24} /> {t('home.backToOrgs', 'Back to Organizations')}
          </button>
        </>
      )}

      {/* BOOKING FORM */}
      {view === 'booking' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0891b2, #1d4ed8)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12, boxShadow: '0 4px 16px rgba(8,145,178,0.25)',
            }}>
              <TransportIcon size={40} color="#fff" />
            </div>
            <h1 className="h2" style={{ marginBottom: 6 }}>
              {t('transport.title', 'Transport Department')}
            </h1>
          </div>

          <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 md:p-8">
            <div className="mb-6 p-4 bg-teal-50 rounded-kiosk border border-teal-200 flex items-center gap-3">
              <Ticket className="w-6 h-6 text-teal-700" />
              <p className="text-kiosk-base font-semibold text-teal-800">
                Booking: {t(`transport.${selectedCategory}`)}
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Passenger Name" value={bookingData.passengerName} onChange={(e) => handleBookingChange('passengerName', e.target.value)} error={errors.passengerName} required />
                <Input label="Mobile Number" value={bookingData.passengerMobile} onChange={(e) => handleBookingChange('passengerMobile', e.target.value)} error={errors.passengerMobile} required />
              </div>

              {selectedCategory === 'metroTicket' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select label="From Station" value={bookingData.fromStation} onChange={(e) => handleBookingChange('fromStation', e.target.value)} error={errors.fromStation} required>
                      <option value="">Select departure station</option>
                      {metroStations.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Select label="To Station" value={bookingData.toStation} onChange={(e) => handleBookingChange('toStation', e.target.value)} error={errors.toStation} required>
                      <option value="">Select arrival station</option>
                      {metroStations.filter(s => s !== bookingData.fromStation).map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="Travel Date" type="date" value={bookingData.travelDate} onChange={(e) => handleBookingChange('travelDate', e.target.value)} error={errors.travelDate} required />
                    <Select label="Number of Passengers" value={bookingData.passengers} onChange={(e) => handleBookingChange('passengers', e.target.value)}>
                      {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>)}
                    </Select>
                    <div className="flex items-end">
                      <div className="w-full p-4 bg-green-50 rounded-kiosk border border-green-200 text-center">
                        <p className="text-sm text-green-600 font-semibold">Estimated Fare</p>
                        <p className="text-kiosk-xl font-bold text-green-700">₹{calculateFare()}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedCategory === 'busTicket' && (
                <>
                  <Select label="Select Bus Route" value={bookingData.busRoute} onChange={(e) => handleBookingChange('busRoute', e.target.value)} error={errors.busRoute} required>
                    <option value="">Choose a route</option>
                    {busRoutes.map(r => <option key={r.id} value={r.id}>{r.name} — ₹{r.fare}</option>)}
                  </Select>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="Travel Date" type="date" value={bookingData.travelDate} onChange={(e) => handleBookingChange('travelDate', e.target.value)} error={errors.travelDate} required />
                    <Select label="Passengers" value={bookingData.passengers} onChange={(e) => handleBookingChange('passengers', e.target.value)}>
                      {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>)}
                    </Select>
                    <div className="flex items-end">
                      <div className="w-full p-4 bg-green-50 rounded-kiosk border border-green-200 text-center">
                        <p className="text-sm text-green-600 font-semibold">Estimated Fare</p>
                        <p className="text-kiosk-xl font-bold text-green-700">₹{calculateFare()}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedCategory === 'busPass' && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {busPassTypes.map(pass => (
                      <div
                        key={pass.id}
                        onClick={() => handleBookingChange('passType', pass.id)}
                        className={`cursor-pointer rounded-kiosk p-4 border-2 text-center transition-all ${bookingData.passType === pass.id ? 'border-teal-600 bg-teal-50' : 'border-gray-200 bg-white hover:border-teal-300'}`}
                      >
                        <CreditCard className={`w-8 h-8 mx-auto mb-2 ${bookingData.passType === pass.id ? 'text-teal-600' : 'text-gray-400'}`} />
                        <p className="font-semibold text-sm">{pass.name}</p>
                        <p className="text-teal-700 font-bold mt-1">₹{pass.price}</p>
                      </div>
                    ))}
                  </div>
                  {errors.passType && <p className="text-red-500 text-sm">{errors.passType}</p>}
                  <Input label="Start Date" type="date" value={bookingData.travelDate} onChange={(e) => handleBookingChange('travelDate', e.target.value)} error={errors.travelDate} required />
                  {bookingData.passType && (
                    <div className="p-4 bg-green-50 rounded-kiosk border border-green-200 text-center">
                      <p className="text-sm text-green-600 font-semibold">Pass Cost</p>
                      <p className="text-kiosk-xl font-bold text-green-700">₹{calculateFare()}</p>
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t">
                <Button variant="secondary" onClick={() => { setView('categories'); setErrors({}); }} size="large">{t('app.back')}</Button>
                <Button onClick={handleBookTicket} size="xlarge">
                  {selectedCategory === 'busPass' ? 'Purchase Pass' : 'Book Ticket'} — ₹{calculateFare()}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLAINT / REQUEST FORM */}
      {view === 'complaint' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0891b2, #1d4ed8)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12, boxShadow: '0 4px 16px rgba(8,145,178,0.25)',
            }}>
              <TransportIcon size={40} color="#fff" />
            </div>
            <h1 className="h2" style={{ marginBottom: 6 }}>
              {t('transport.title', 'Transport Department')}
            </h1>
          </div>

          <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 md:p-8">
            <div className="mb-6 p-4 bg-orange-50 rounded-kiosk border border-orange-200">
              <p className="text-kiosk-base font-semibold text-orange-800">
                Reporting: {t(`transport.${selectedCategory}`)}
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label={t('form.name')} value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder={t('form.enterName')} error={errors.name} required />
                <Input label={t('form.mobile')} value={formData.mobile} onChange={(e) => handleInputChange('mobile', e.target.value)} placeholder={t('form.enterMobile')} error={errors.mobile} required type="tel" />
              </div>
              <Input label={t('form.email')} value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder={t('form.enterEmail')} type="email" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label={t('form.vehicleNumber')} value={formData.vehicleNumber} onChange={(e) => handleInputChange('vehicleNumber', e.target.value)} placeholder={t('form.enterVehicleNumber')} />
                <Input label={t('form.licenseNumber')} value={formData.licenseNumber} onChange={(e) => handleInputChange('licenseNumber', e.target.value)} placeholder={t('form.enterLicenseNumber')} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select label={t('form.state')} value={formData.state} onChange={(e) => handleInputChange('state', e.target.value)} error={errors.state} required>
                  <option value="">{t('form.selectState')}</option>
                  {states.map(s => <option key={s.id} value={s.id}>{getLocalizedName(s)}</option>)}
                </Select>
                <Select label={t('form.city')} value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} error={errors.city} required disabled={!formData.state}>
                  <option value="">{t('form.selectCity')}</option>
                  {availableCities.map(c => <option key={c.id} value={c.id}>{getLocalizedName(c)}</option>)}
                </Select>
                <Select label={t('form.ward')} value={formData.ward} onChange={(e) => handleInputChange('ward', e.target.value)} error={errors.ward} required disabled={!formData.city}>
                  <option value="">{t('form.selectWard')}</option>
                  {availableWards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </Select>
              </div>

              <Input label={t('form.address')} value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder={t('form.enterAddress')} error={errors.address} required />
              <TextArea label={t('form.description')} value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder={t('form.enterDescription')} error={errors.description} required rows={4} maxLength={500} />
              <QRUpload label={t('form.uploadDocuments')} onUploadComplete={(uploadedFiles) => setFiles(uploadedFiles)} maxFiles={5} />

              <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t">
                <Button variant="secondary" onClick={() => { setView('categories'); setErrors({}); }} size="large">{t('app.back')}</Button>
                <Button onClick={handleComplaintSubmit} size="xlarge">{t('app.submit')}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={t('form.confirmSubmission')}
      >
        <div className="space-y-4">
          <p className="text-kiosk-base text-gray-600">{t('form.confirmMessage')}</p>
          <div className="bg-gray-50 rounded-kiosk p-4 space-y-2">
            <p><strong>{t('form.name')}:</strong> {formData.name}</p>
            <p><strong>{t('form.mobile')}:</strong> {formData.mobile}</p>
            <p><strong>Category:</strong> {t(`transport.${selectedCategory}`)}</p>
          </div>
          <div className="flex gap-4 justify-end pt-4">
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleConfirmSubmit}>{t('app.confirm')}</Button>
          </div>
        </div>
      </Modal>
    </VK>
  );
};

export default Transport;
