import { collection, addDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import { db } from "./firebaseConfig";

const initializeFreshSeats = async (flightId) => {
  const rows = ["A", "B", "C", "D", "E"];
  const batch = writeBatch(db);

  rows.forEach(row => {
    [1, 2, 3, 4, 5, 6].forEach(col => {
      const seatRef = doc(db, "flights", flightId, "seats", `${row}${col}`);
      batch.set(seatRef, {
        seatNumber: `${row}${col}`,
        row,
        column: col,
        isBooked: false,
        bookedBy: null,
        class: row === "A" ? "business" : "economy"
      });
    });
  });
  await batch.commit();
};

export const seedFlights = async () => {
  try {
    const flightsRef = collection(db, "flights");
    const freshFlights = [
      {
        flightNumber: "PK301",
        airline: "PIA",
        origin: "Karachi",
        destination: "Lahore",
        departureTime: "08:00 AM",
        arrivalTime: "10:00 AM",
        price: 15000,
        totalSeats: 30,
        availableSeats: 30,
        status: "on-time"
      },
      {
        flightNumber: "PK401",
        airline: "PIA",
        origin: "Karachi",
        destination: "Islamabad",
        departureTime: "11:00 AM",
        arrivalTime: "01:00 PM",
        price: 18000,
        totalSeats: 30,
        availableSeats: 30,
        status: "on-time"
      }
    ];

    for (const flight of freshFlights) {
      const docRef = await addDoc(flightsRef, {
        ...flight,
        createdAt: serverTimestamp()
      });
      await initializeFreshSeats(docRef.id);
    }
  } catch (error) {
    console.error(error);
  }
};