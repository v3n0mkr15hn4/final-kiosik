import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bus, ArrowRight, Train, CreditCard, Ticket, MapPin, Clock, Users, Calendar, UserCog, Search, FileText, ArrowLeft } from 'lucide-react';
import {
  Header,
  Button,
  Input,
  Select,
  TextArea,
  Modal,
  LoadingSpinner,
  PageContainer,
  DepartmentHeader,
  SectionTitle,
  ServiceCard,
  UtilityCard,
  ResponsiveGrid,
  ActionButton
} from '../components';
import { VK } from '../components/kiosk';
import { TransportIcon } from '../assets/icons';
import QRUpload from '../components/QRUpload';
import { states, cities, wards, serviceCategories } from '../utils/constants';
import { generateRequestId, getCurrentTimestamp } from '../utils/helpers';
import { serviceAPI, transportAPI } from '../utils/apiService';
import { addReceipt } from '../utils/receipts';

/**
 * Transport Services page
 * Includes ticket booking (Metro, Bus, Train) + complaint/request forms
 */

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

  // Main view state
  const [view, setView] = useState('categories'); // 'categories' | 'booking' | 'complaint'
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Booking state
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

  // Complaint form state
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

  const categories = serviceCategories.transport;

  const theme = {
    gradient: 'from-cyan-500 via-teal-500 to-blue-500',
    softGradient: 'from-cyan-50 via-cyan-100 to-teal-100',
    accentClass: 'text-cyan-600',
  };

  const utilityServices = [
    {
      id: 'profile',
      title: 'Edit Credentials / Profile',
      description: 'Update your transport profile and details',
      path: '/consumer-profile?org=transport',
      Icon: UserCog,
    },
    {
      id: 'track',
      title: 'Track Request / Complaint',
      description: 'Check real-time status of your requests',
      path: '/track-status',
      Icon: Search,
    },
    {
      id: 'receipt',
      title: 'View Receipts',
      description: 'View and print transaction receipts',
      path: '/receipt?org=transport',
      Icon: FileText,
    },
  ];

  const getLocalizedName = (item) => {
    if (i18n.language === 'hi' && item.nameHi) return item.nameHi;
    if (i18n.language === 'ta' && item.nameTa) return item.nameTa;
    return item.name;
  };

  const availableCities = formData.state ? cities[formData.state] || [] : [];
  const availableWards = formData.city ? wards[formData.city] || wards.default : [];

  const isBookingCategory = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.booking === true;
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
  };

  const handleCategoryNext = () => {
    if (isBookingCategory(selectedCategory)) {
      setView('booking');
      setStep(1);
    } else {
      setView('complaint');
      setStep(2);
    }
  };

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

  // Calculate fare
  const calculateFare = () => {
    const passengers = parseInt(bookingData.passengers) || 1;
    if (selectedCategory === 'metroTicket') {
      const basePrice = 30;
      return basePrice * passengers;
    }
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
        fare: fare,
        passengerName: bookingData.passengerName,
        status: 'confirmed',
        timestamp: getCurrentTimestamp(),
      };
      setBookingResult(result);

      // Also save to receipt
      const receiptData = {
        requestId: ticketId,
        citizenName: bookingData.passengerName,
        mobile: bookingData.passengerMobile,
        serviceType: 'transport',
        serviceCategory: `Ticket Booking - ${selectedCategory}`,
        timestamp: getCurrentTimestamp(),
        status: 'confirmed',
        fare: `₹${fare}`,
      };
      addReceipt(receiptData);
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
      <PageContainer tone="transport">
        
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="large" message={selectedCategory && isBookingCategory(selectedCategory) ? 'Booking your ticket...' : t('app.loading')} />
        </div>
      </PageContainer>
    );
  }

  // Booking confirmation result
  if (bookingResult) {
    return (
      <PageContainer tone="transport">
        
        <div>
          <DepartmentHeader
            title={t('transport.title')}
            subtitle={t('transport.subtitle')}
            icon={TransportIcon}
            iconProps={{ size: 40, color: '#ffffff' }}
            gradient="from-cyan-500 to-blue-600"
            className="mb-6"
          />
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
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Status:</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold text-sm uppercase">{bookingResult.status}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate(`/receipt?org=transport&id=${encodeURIComponent(bookingResult.ticketId)}`)}
                size="large"
              >
                View Receipt
              </Button>
              <Button variant="secondary" onClick={() => navigate('/home')} size="large">Go Home</Button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer tone="transport">
      

      <div>
        <DepartmentHeader
          title={t('transport.title')}
          subtitle={t('transport.subtitle')}
          icon={TransportIcon}
          iconProps={{ size: 40, color: '#ffffff' }}
          gradient="from-cyan-500 to-blue-600"
        />

        {/* CATEGORY SELECTION */}
        {view === 'categories' && (
          <>
            {/* Booking Section */}
            <div className="mb-8">
              <SectionTitle
                title="Book Tickets & Passes"
                icon={Ticket}
                accentClass={theme.accentClass}
                className="mb-4"
              />
              <ResponsiveGrid variant="services">
                {categories.filter(c => c.booking).map((category) => (
                  <ServiceCard
                    key={category.id}
                    title={t(category.key)}
                    icon={TransportIcon}
                    iconProps={{ size: 28, color: '#ffffff' }}
                    gradient={theme.gradient}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setView('booking');
                      setStep(1);
                    }}
                    accessibilityLabel={t(category.key)}
                  />
                ))}
              </ResponsiveGrid>
            </div>

            {/* Complaints/Requests Section */}
            <div className="mb-8">
              <SectionTitle
                title="Report Issues & Requests"
                icon={MapPin}
                accentClass="text-orange-600"
                className="mb-4"
              />
              <ResponsiveGrid variant="services">
                {categories.filter(c => !c.booking).map((category) => (
                  <ServiceCard
                    key={category.id}
                    title={t(category.key)}
                    icon={TransportIcon}
                    iconProps={{ size: 28, color: '#ffffff' }}
                    gradient={theme.gradient}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setView('complaint');
                      setStep(2);
                    }}
                    accessibilityLabel={t(category.key)}
                  />
                ))}
              </ResponsiveGrid>
            </div>

            {/* Profile & History */}
            <div className="mb-8">
              <SectionTitle
                title={t('home.utilitiesHistory', 'Utilities & History')}
                icon={UserCog}
                accentClass={theme.accentClass}
                className="mb-4"
              />
              <ResponsiveGrid variant="utilities">
                {utilityServices.map((service) => (
                  <UtilityCard
                    key={service.id}
                    title={service.title}
                    description={service.description}
                    icon={service.Icon}
                    iconProps={{ className: 'w-6 h-6 text-cyan-700' }}
                    gradient={theme.softGradient}
                    onClick={() => navigate(service.path)}
                    accessibilityLabel={service.title}
                  />
                ))}
              </ResponsiveGrid>
            </div>
          </>
        )}

        {/* Back to Home Button (Only in Categories View) */}
        {view === 'categories' && (
          <div className="flex justify-center py-6">
            <ActionButton
              variant="outline"
              size="large"
              icon={ArrowLeft}
              onClick={() => navigate('/home')}
            >
              {t('home.backToOrgs', 'Back to Home')}
            </ActionButton>
          </div>
        )}

        {/* BOOKING FORM */}
        {view === 'booking' && (
          <div className="bg-white rounded-kiosk-lg shadow-kiosk p-6 md:p-8">
            <div className="mb-6 p-4 bg-teal-50 rounded-kiosk border border-teal-200 flex items-center gap-3">
              <Ticket className="w-6 h-6 text-teal-700" />
              <p className="text-kiosk-base font-semibold text-teal-800">
                Booking: {t(`transport.${selectedCategory}`)}
              </p>
            </div>

            <div className="space-y-6">
              {/* Common fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Passenger Name"
                  value={bookingData.passengerName}
                  onChange={(e) => handleBookingChange('passengerName', e.target.value)}
                  error={errors.passengerName}
                  required
                />
                <Input
                  label="Mobile Number"
                  value={bookingData.passengerMobile}
                  onChange={(e) => handleBookingChange('passengerMobile', e.target.value)}
                  error={errors.passengerMobile}
                  required
                />
              </div>

              {/* Metro Ticket Fields */}
              {selectedCategory === 'metroTicket' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                      label="From Station"
                      value={bookingData.fromStation}
                      onChange={(e) => handleBookingChange('fromStation', e.target.value)}
                      error={errors.fromStation}
                      required
                    >
                      <option value="">Select departure station</option>
                      {metroStations.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Select
                      label="To Station"
                      value={bookingData.toStation}
                      onChange={(e) => handleBookingChange('toStation', e.target.value)}
                      error={errors.toStation}
                      required
                    >
                      <option value="">Select arrival station</option>
                      {metroStations.filter(s => s !== bookingData.fromStation).map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input
                      label="Travel Date"
                      type="date"
                      value={bookingData.travelDate}
                      onChange={(e) => handleBookingChange('travelDate', e.target.value)}
                      error={errors.travelDate}
                      required
                    />
                    <Select
                      label="Number of Passengers"
                      value={bookingData.passengers}
                      onChange={(e) => handleBookingChange('passengers', e.target.value)}
                    >
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

              {/* Bus Ticket Fields */}
              {selectedCategory === 'busTicket' && (
                <>
                  <Select
                    label="Select Bus Route"
                    value={bookingData.busRoute}
                    onChange={(e) => handleBookingChange('busRoute', e.target.value)}
                    error={errors.busRoute}
                    required
                  >
                    <option value="">Choose a route</option>
                    {busRoutes.map(r => <option key={r.id} value={r.id}>{r.name} — ₹{r.fare}</option>)}
                  </Select>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input
                      label="Travel Date"
                      type="date"
                      value={bookingData.travelDate}
                      onChange={(e) => handleBookingChange('travelDate', e.target.value)}
                      error={errors.travelDate}
                      required
                    />
                    <Select
                      label="Passengers"
                      value={bookingData.passengers}
                      onChange={(e) => handleBookingChange('passengers', e.target.value)}
                    >
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

              {/* Bus Pass Fields */}
              {selectedCategory === 'busPass' && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {busPassTypes.map(pass => (
                      <div
                        key={pass.id}
                        onClick={() => handleBookingChange('passType', pass.id)}
                        className={`cursor-pointer rounded-kiosk p-4 border-2 text-center transition-all ${bookingData.passType === pass.id
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-gray-200 bg-white hover:border-teal-300'
                          }`}
                      >
                        <CreditCard className={`w-8 h-8 mx-auto mb-2 ${bookingData.passType === pass.id ? 'text-teal-600' : 'text-gray-400'}`} />
                        <p className="font-semibold text-sm">{pass.name}</p>
                        <p className="text-teal-700 font-bold mt-1">₹{pass.price}</p>
                      </div>
                    ))}
                  </div>
                  {errors.passType && <p className="text-red-500 text-sm">{errors.passType}</p>}
                  <Input
                    label="Start Date"
                    type="date"
                    value={bookingData.travelDate}
                    onChange={(e) => handleBookingChange('travelDate', e.target.value)}
                    error={errors.travelDate}
                    required
                  />
                  {bookingData.passType && (
                    <div className="p-4 bg-green-50 rounded-kiosk border border-green-200 text-center">
                      <p className="text-sm text-green-600 font-semibold">Pass Cost</p>
                      <p className="text-kiosk-xl font-bold text-green-700">₹{calculateFare()}</p>
                    </div>
                  )}
                </>
              )}

              {/* Suburban Train Fields */}
              {selectedCategory === 'suburbanTrain' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                      label="From Station"
                      value={bookingData.fromStation}
                      onChange={(e) => handleBookingChange('fromStation', e.target.value)}
                      error={errors.fromStation}
                      required
                    >
                      <option value="">Select departure station</option>
                      {trainStations.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Select
                      label="To Station"
                      value={bookingData.toStation}
                      onChange={(e) => handleBookingChange('toStation', e.target.value)}
                      error={errors.toStation}
                      required
                    >
                      <option value="">Select arrival station</option>
                      {trainStations.filter(s => s !== bookingData.fromStation).map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Input
                      label="Travel Date"
                      type="date"
                      value={bookingData.travelDate}
                      onChange={(e) => handleBookingChange('travelDate', e.target.value)}
                      error={errors.travelDate}
                      required
                    />
                    <Select
                      label="Class"
                      value={bookingData.trainClass}
                      onChange={(e) => handleBookingChange('trainClass', e.target.value)}
                    >
                      <option value="second">Second Class — ₹25</option>
                      <option value="first">First Class — ₹80</option>
                    </Select>
                    <Select
                      label="Passengers"
                      value={bookingData.passengers}
                      onChange={(e) => handleBookingChange('passengers', e.target.value)}
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                    </Select>
                    <div className="flex items-end">
                      <div className="w-full p-4 bg-green-50 rounded-kiosk border border-green-200 text-center">
                        <p className="text-sm text-green-600 font-semibold">Fare</p>
                        <p className="text-kiosk-xl font-bold text-green-700">₹{calculateFare()}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Booking Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t">
                <Button variant="secondary" onClick={() => { setView('categories'); setErrors({}); }} size="large">
                  {t('app.back')}
                </Button>
                <Button onClick={handleBookTicket} size="xlarge">
                  {selectedCategory === 'busPass' ? 'Purchase Pass' : 'Book Ticket'} — ₹{calculateFare()}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* COMPLAINT / REQUEST FORM */}
        {view === 'complaint' && (
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
                  {states.map(s => <option key={s.code} value={s.code}>{getLocalizedName(s)}</option>)}
                </Select>
                <Select label={t('form.city')} value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} error={errors.city} required disabled={!formData.state}>
                  <option value="">{t('form.selectCity')}</option>
                  {availableCities.map(c => <option key={c.code} value={c.code}>{getLocalizedName(c)}</option>)}
                </Select>
                <Select label={t('form.ward')} value={formData.ward} onChange={(e) => handleInputChange('ward', e.target.value)} error={errors.ward} required disabled={!formData.city}>
                  <option value="">{t('form.selectWard')}</option>
                  {availableWards.map(w => <option key={w.code} value={w.code}>{getLocalizedName(w)}</option>)}
                </Select>
              </div>

              <Input label={t('form.address')} value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder={t('form.enterAddress')} error={errors.address} required />
              <TextArea label={t('form.description')} value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder={t('form.enterDescription')} error={errors.description} required rows={4} maxLength={500} />

              <QRUpload label={t('form.uploadDocuments')} onUploadComplete={(uploadedFiles) => setFiles(uploadedFiles)} maxFiles={5} />

              <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t">
                <Button variant="secondary" onClick={() => { setView('categories'); setErrors({}); }} size="large">
                  {t('app.back')}
                </Button>
                <Button onClick={handleComplaintSubmit} size="xlarge">
                  {t('app.submit')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title={t('form.confirmSubmission')}>
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
      </div>
    </PageContainer>
  );
};

export default Transport;
