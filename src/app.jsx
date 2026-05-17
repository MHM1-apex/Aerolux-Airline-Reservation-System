import React, { useState, useEffect, useRef } from 'react';
import { Plane, MapPin, Calendar, ShieldCheck, Headphones, CheckCircle, Award, Coffee, X } from 'lucide-react';
import { searchFlights } from './firebase/flights';
import { listenToSeats, resetFlightSeatsDatabase } from './firebase/seats';
import { createBooking } from './firebase/bookings';
import { seedFlights } from './firebase/seedFlights';

import './app.css';

import heroImg from './assets/image_fe2139.jpg';   
import hostessImg from './assets/image_fe243f.jpg';  
import cabinImg from './assets/image_fe2197.jpg';    

export default function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [flights, setFlights] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedFlight, setSelectedFlight] = useState(null);
  const [liveSeats, setLiveSeats] = useState([]); 
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [bookingId, setBookingId] = useState('');
  const [randomFlightCode, setRandomFlightCode] = useState('');

  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const dateInputRef = useRef(null);

  const popularCities = [
    { code: 'Karachi', name: 'Jinnah International', city: 'Karachi' },
    { code: 'Lahore', name: 'Allama Iqbal International', city: 'Lahore' },
    { code: 'Islamabad', name: 'Islamabad International', city: 'Islamabad' },
    { code: 'London', name: 'London Heathrow', city: 'London' },
    { code: 'New York', name: 'John F. Kennedy Intl', city: 'New York' },
    { code: 'Dubai', name: 'Dubai International', city: 'Dubai' },
  ];

  const generateFlightCode = (airlineCode) => {
    const prefix = airlineCode || "AX";
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomDigits}`;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!origin || !destination) {
      alert('Validation Error: Please select From location and To location.');
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const cleanOrigin = origin.trim().charAt(0).toUpperCase() + origin.trim().slice(1).toLowerCase();
      const cleanDest = destination.trim().charAt(0).toUpperCase() + destination.trim().slice(1).toLowerCase();
      const results = await searchFlights(cleanOrigin, cleanDest);
      setFlights(results);
    } catch (err) {
      console.error(err);
      alert("Error finding flights. Check database connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalDatabaseReset = async (flightId) => {
    if (!window.confirm("Are you sure you want to completely clear out all booked seats for this flight in the database?")) return;
    try {
      setLoading(true);
      await resetFlightSeatsDatabase(flightId);
      
      setFlights(prevFlights => 
        prevFlights.map(f => f.id === flightId ? { ...f, availableSeats: f.totalSeats } : f)
      );
      alert("Database wiped successfully! 30 out of 30 seats are now completely available.");
    } catch (err) {
      alert("Failed to clear database records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    seedFlights();
  }, []);

  useEffect(() => {
    if (!selectedFlight || step !== 2) return;
    const unsubscribe = listenToSeats(selectedFlight.id, (updatedSeats) => {
      const sorted = [...updatedSeats].sort((a, b) => a.seatNumber.localeCompare(b.seatNumber));
      setLiveSeats(sorted);
    });
    return () => unsubscribe();
  }, [selectedFlight, step]);

  const handleConfirmSeat = async () => {
    if (!selectedSeat) return;
    if (!passengerName.trim()) {
      alert("Please enter the passenger's full name before reserving a seat.");
      return;
    }
    setLoading(true);
    try {
      const generatedCode = generateFlightCode(selectedFlight.airline);
      setRandomFlightCode(generatedCode);

      const response = await createBooking({
        passengerId: `USER_${Date.now()}`, 
        passengerName: passengerName.trim(),
        passengerEmail: "passenger@example.com",
        flightId: selectedFlight.id,
        flightNumber: generatedCode,
        seatNumber: selectedSeat.seatNumber
      });

      if (response.success) {
        setBookingId(response.bookingId);
        setStep(3);
      }
    } catch (err) {
      console.error(err);
      alert("Booking processing error. Choose a different seat layout position.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const triggerDatePicker = () => {
    if (dateInputRef.current) {
      dateInputRef.current.type = "date";
      try {
        dateInputRef.current.showPicker();
      } catch (error) {
        dateInputRef.current.focus();
      }
    }
  };

  const handleDateBlur = () => {
    if (!travelDate && dateInputRef.current) {
      dateInputRef.current.type = "text";
    }
  };

  const isFormInvalid = !origin || !destination;

  if (step === 1) {
    return (
      <div id="top-page" className="w-full min-h-screen bg-white text-slate-700 overflow-x-hidden flex flex-col items-stretch">
        <nav className="absolute top-0 left-0 right-0 z-20 px-6 md:px-12 py-6 flex justify-between items-center text-white max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter opacity-0 pointer-events-none">
            <Plane className="text-blue-400" /> AEROLUX
          </div>
          <div className="flex w-full md:w-auto justify-end gap-6 md:gap-8 text-xs font-bold uppercase tracking-widest items-center">
            <button onClick={() => scrollToSection('top-page')} className="cursor-pointer hover:text-blue-400 transition-colors">Home</button>
            <button onClick={() => scrollToSection('search-section')} className="cursor-pointer hover:text-blue-400 transition-colors">Flights</button>
            <button onClick={() => scrollToSection('about-section')} className="cursor-pointer hover:text-blue-400 transition-colors">About</button>
            <button onClick={() => setShowLoginModal(true)} className="bg-blue-600 px-5 py-2 rounded-full cursor-pointer hover:bg-blue-700 transition-all">Login</button>
          </div>
        </nav>

        <header className="relative w-full h-[450px] flex items-center justify-center overflow-hidden">
          <img src={heroImg} className="absolute inset-0 w-full h-full object-cover object-center" alt="Plane Header" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-white"></div>
          <div className="relative z-10 text-center mt-10 px-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            <h1 className="text-4xl md:text-6xl font-black mb-2 tracking-tighter uppercase italic text-white">Discover Your Next Adventure</h1>
            <p className="text-md font-medium text-slate-100 opacity-90">Experience seamless automation with AeroLux.</p>
          </div>
        </header>

        <main className="w-full max-w-6xl mx-auto px-4 md:px-8 -mt-20 relative z-20 pb-20 flex-1">
          <form id="search-section" onSubmit={handleSearch} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6 mb-16 scroll-mt-24">
            <div className="space-y-1 text-left relative">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-wider">From</label>
              <div className="flex items-center gap-2 border-b border-slate-100 py-1">
                <MapPin size={16} className="text-slate-300 shrink-0" />
                <input 
                  className="outline-none font-bold w-full text-sm uppercase text-slate-800" 
                  placeholder="e.g. Karachi" 
                  value={origin} 
                  onChange={(e) => setOrigin(e.target.value)} 
                  onFocus={() => setShowOriginDropdown(true)}
                  onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                />
              </div>
              {showOriginDropdown && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                  {popularCities
                    .filter(item => item.city.toLowerCase().includes(origin.toLowerCase()) || item.code.toLowerCase().includes(origin.toLowerCase()))
                    .map(airport => (
                      <button
                        key={airport.code}
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-blue-50 text-xs transition-colors cursor-pointer text-left"
                        onMouseDown={() => setOrigin(airport.code)}
                      >
                        <span className="font-bold text-slate-800">{airport.city}</span>
                        <span className="text-[10px] text-slate-400">{airport.name}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className="space-y-1 text-left relative">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-wider">To</label>
              <div className="flex items-center gap-2 border-b border-slate-100 py-1">
                <MapPin size={16} className="text-slate-300 shrink-0" />
                <input 
                  className="outline-none font-bold w-full text-sm uppercase text-slate-800" 
                  placeholder="e.g. Lahore" 
                  value={destination} 
                  onChange={(e) => setDestination(e.target.value)} 
                  onFocus={() => setShowDestDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
                />
              </div>
              {showDestDropdown && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                  {popularCities
                    .filter(item => item.city.toLowerCase().includes(destination.toLowerCase()) || item.code.toLowerCase().includes(destination.toLowerCase()))
                    .map(airport => (
                      <button
                        key={airport.code}
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-blue-50 text-xs transition-colors cursor-pointer text-left"
                        onMouseDown={() => setDestination(airport.code)}
                      >
                        <span className="font-bold text-slate-800">{airport.city}</span>
                        <span className="text-[10px] text-slate-400">{airport.name}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className="space-y-1 text-left cursor-pointer select-none" onClick={triggerDatePicker}>
              <div className="flex items-center gap-1.5 text-blue-600">
                <Calendar size={14} className="shrink-0" />
                <label className="text-[10px] font-black uppercase tracking-wider cursor-pointer">Departure</label>
              </div>
              <div className="border-b border-slate-100 py-1">
                <input 
                  type="text" 
                  placeholder="Select Date"
                  ref={dateInputRef}
                  onClick={(e) => e.stopPropagation()} 
                  onFocus={triggerDatePicker}
                  onBlur={handleDateBlur}
                  className="outline-none font-bold w-full text-sm text-slate-800 cursor-pointer min-h-[24px] bg-transparent" 
                  value={travelDate} 
                  onChange={(e) => setTravelDate(e.target.value)} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`font-black rounded-xl shadow-lg transition-all uppercase tracking-widest text-xs h-12 mt-2 cursor-pointer
                ${isFormInvalid 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              {loading ? 'Searching...' : 'Find Flights'}
            </button>
          </form>

          <h2 className="text-xl font-black mb-6 italic uppercase tracking-tighter text-slate-900 text-left">Available Flight Schedules</h2>
          {hasSearched && flights.length === 0 && !loading ? (
            <div className="bg-slate-50 rounded-2xl p-12 text-center border border-dashed border-slate-200">
              <p className="text-sm font-bold text-slate-400">No active flights found for this route.</p>
            </div>
          ) : !hasSearched ? (
            <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100">
              <p className="text-xs font-bold text-slate-400">Enter your flight destinations and departure date above to check current availability.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {flights.map(flight => (
                <div key={flight.id} className="bg-white border border-slate-100 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm text-left gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs">AX</div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{flight.airline} <span className="text-xs font-normal text-slate-400">({flight.flightNumber})</span></h3>
                      <p className="text-xs font-bold text-slate-400">{flight.origin} → {flight.destination} • <span className="text-blue-500">{flight.departureTime} - {flight.arrivalTime}</span></p>
                    </div>
                  </div>
                  <div className="text-center px-6">
                    <p className="text-xl font-black text-slate-900">Rs. {flight.price}</p>
                    <p className="text-[11px] font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md mt-1 uppercase tracking-wider">{flight.availableSeats} / {flight.totalSeats} Available</p>
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      type="button"
                      onClick={() => handleGlobalDatabaseReset(flight.id)} 
                      className="bg-red-50 text-red-600 border border-red-100 px-3 py-3 rounded-xl font-bold text-[10px] hover:bg-red-100 transition-all cursor-pointer uppercase tracking-widest text-center flex-1 sm:flex-initial"
                    >
                      Reset Database Records
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setSelectedFlight(flight); setStep(2); }} 
                      className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] hover:bg-blue-600 transition-all cursor-pointer uppercase tracking-widest text-center flex-1 sm:flex-initial"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div id="about-section" className="mt-24 pt-8 border-t border-slate-100 scroll-mt-24">
            <div className="flex flex-col md:flex-row items-center gap-12 text-left">
              <div className="flex-1 max-w-sm relative group">
                <div className="absolute inset-0 bg-blue-600/10 rounded-[2.5rem] transform translate-x-3 translate-y-3 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
                <img src={hostessImg} className="relative z-10 rounded-[2.5rem] shadow-xl w-full h-[360px] object-cover border border-slate-100" alt="Service Profile" />
              </div>
              
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-black tracking-widest uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Our Signature Standards</span>
                  <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-slate-900">Premium Operations Infrastructure.</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    AeroLux sets the standard for modern air travel, delivering uncompromising comfort, flexible booking solutions, and unmatched world-class service across every destination.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 items-start">
                    <div className="bg-blue-600 text-white p-2 rounded-xl shrink-0 shadow-md shadow-blue-600/20"><ShieldCheck size={18}/></div>
                    <div>
                      <h4 className="font-black text-xs text-slate-800 uppercase tracking-wide">Flexible Booking</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Easily modify travel dates or cancel your flights up to 24 hours prior to departure without hidden structural penalties.</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 items-start">
                    <div className="bg-blue-600 text-white p-2 rounded-xl shrink-0 shadow-md shadow-blue-600/20"><Headphones size={18}/></div>
                    <div>
                      <h4 className="font-black text-xs text-slate-800 uppercase tracking-wide">24/7 Concierge</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Our dedicated guest relations team remains online around the clock to support layout changes and seating arrangements.</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 items-start">
                    <div className="bg-blue-600 text-white p-2 rounded-xl shrink-0 shadow-md shadow-blue-600/20"><Award size={18}/></div>
                    <div>
                      <h4 className="font-black text-xs text-slate-800 uppercase tracking-wide">Elite Fleet</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Travel comfortably aboard our state-of-the-art aircraft configurations optimized for maximum fuel efficiency and range.</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 items-start">
                    <div className="bg-blue-600 text-white p-2 rounded-xl shrink-0 shadow-md shadow-blue-600/20"><Coffee size={18}/></div>
                    <div>
                      <h4 className="font-black text-xs text-slate-800 uppercase tracking-wide">In-Flight Luxury</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Enjoy handpicked artisanal meals, high-speed Wi-Fi, and custom on-demand entertainment during your travel.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative border border-slate-100">
              <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                <X size={18} />
              </button>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-3">
                  <Plane size={22} className="-rotate-45" />
                </div>
                <h3 className="text-2xl font-black tracking-tighter uppercase italic text-slate-900">Welcome to AeroLux</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">Access your flight operation controls</p>
              </div>
              <div className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Email Account</label>
                  <input type="email" placeholder="name@example.com" className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-blue-600 transition-colors text-slate-800" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Access Security Key</label>
                  <input type="password" placeholder="••••••••" className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-blue-600 transition-colors text-slate-800" />
                </div>
                <button onClick={() => setShowLoginModal(false)} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-blue-600 shadow-md transition-all mt-2 cursor-pointer">
                  Authenticate Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden p-8 max-h-[90vh] overflow-y-auto">
          <img src={cabinImg} className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none" alt="Cabin visual background" />
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900">Select Seat Position</h2>
              <p className="text-slate-400 font-bold text-xs mt-1">{selectedFlight?.airline} Seating Chart</p>
            </div>

            <div className="max-w-xs mx-auto mb-6 text-left">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-wider block mb-1">Passenger Full Name</label>
              <input 
                type="text" 
                placeholder="Enter legal passenger name" 
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-blue-600 transition-colors text-slate-800"
              />
            </div>

            <div className="grid grid-cols-4 gap-4 max-w-xs mx-auto mb-8">
              {liveSeats.length === 0 ? (
                <div className="col-span-4 py-6 text-center text-xs font-bold text-slate-400">Loading live aircraft seat layout...</div>
              ) : (
                liveSeats.map(seatDoc => {
                  const isTaken = seatDoc.isBooked;
                  const isChosen = selectedSeat?.id === seatDoc.id;
                  return (
                    <button key={seatDoc.id} disabled={isTaken} onClick={() => setSelectedSeat(seatDoc)}
                      className={`h-12 rounded-xl font-black text-xs transition-all border cursor-pointer
                        ${isTaken ? 'bg-slate-200 border-slate-200 text-slate-400 opacity-40 cursor-not-allowed' : ''}
                        ${isChosen && !isTaken ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105' : ''}
                        ${!isChosen && !isTaken ? 'bg-slate-50 border-slate-100 text-slate-700 hover:border-slate-300' : ''}`}
                    >
                      {seatDoc.seatNumber}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={() => { setStep(1); setSelectedSeat(null); }} className="w-1/3 py-4 rounded-2xl border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-slate-50">Back</button>
              <button disabled={!selectedSeat || loading} onClick={handleConfirmSeat} className="w-2/3 py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest disabled:bg-slate-100 disabled:text-slate-300 cursor-pointer hover:bg-blue-600">
                {loading ? 'Locking Core Record...' : `Reserve Seat ${selectedSeat ? selectedSeat.seatNumber : ''}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden max-w-xs w-full border-4 border-white">
          <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
            <div className="font-black italic text-sm flex items-center gap-2"><Plane size={16} className="text-blue-500" /> BOARDING REF</div>
          </div>
          <div className="p-8 text-center">
             <div className="flex justify-between items-center mb-6">
                <div><p className="text-2xl font-black text-slate-900">{selectedFlight?.origin}</p></div>
                <div className="opacity-20 text-slate-900"><Plane size={14} className="rotate-90" /></div>
                <div><p className="text-2xl font-black text-slate-900">{selectedFlight?.destination}</p></div>
             </div>
             <div className="grid grid-cols-2 gap-4 text-left border-y border-slate-100 py-6 mb-6">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Passenger</p>
                  <p className="font-bold text-xs text-slate-800">{passengerName}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Seat Unit</p>
                  <p className="font-bold text-blue-600 text-sm">{selectedSeat?.seatNumber}</p>
                </div>
                <div className="col-span-2 mt-2">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Flight Operational Security Code</p>
                  <p className="font-mono text-xs font-black text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 text-center uppercase tracking-widest">{randomFlightCode}</p>
                </div>
                <div className="col-span-2 mt-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Database Reference Ticket ID</p>
                  <p className="font-mono text-[9px] text-slate-500 break-all bg-slate-50 p-2 rounded border border-slate-200">{bookingId}</p>
                </div>
             </div>
             <div className="bg-green-50 text-green-600 font-black py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] tracking-wide">
                <CheckCircle size={14} /> FLIGHT ACQUISITION SUCCESSFUL
             </div>
             <button onClick={() => { setStep(1); setSelectedFlight(null); setSelectedSeat(null); setFlights([]); setPassengerName(''); }} className="mt-6 text-slate-400 font-black text-[9px] uppercase tracking-widest hover:text-slate-600 cursor-pointer block mx-auto">Book New Flight</button>
          </div>
        </div>
      </div>
    );
  }
}