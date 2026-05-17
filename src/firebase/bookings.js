import { db } from "./firebaseConfig";
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

export const createBooking = async ({
  passengerId,
  passengerName,
  passengerEmail,
  flightId,
  flightNumber,
  seatNumber
}) => {
  try {
    
    const seatRef = doc(db, "flights", flightId, "seats", seatNumber);
    await updateDoc(seatRef, {
      isBooked: true,
      bookedBy: passengerId
    });

    
    const flightRef = doc(db, "flights", flightId);
    await updateDoc(flightRef, {
      availableSeats: increment(-1)
    });

    
    const docRef = await addDoc(collection(db, "bookings"), {
      passengerId,
      passengerName,
      passengerEmail,
      flightId,
      flightNumber,
      seatNumber,
      bookingTime: serverTimestamp(),
      status: "confirmed"
    });

    return { success: true, bookingId: docRef.id };
  } catch (error) {
    console.error("Booking transactional failure: ", error);
    throw error;
  }
};