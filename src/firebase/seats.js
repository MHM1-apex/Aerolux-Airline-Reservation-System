import { db } from "./firebaseConfig";
import { collection, doc, updateDoc, onSnapshot, writeBatch, getDocs } from "firebase/firestore";

export const initializeSeats = async (flightId) => {
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

export const bookSeat = async (flightId, seatId, passengerId) => {
  await updateDoc(doc(db, "flights", flightId, "seats", seatId), {
    isBooked: true,
    bookedBy: passengerId
  });
};

export const cancelSeat = async (flightId, seatId) => {
  await updateDoc(doc(db, "flights", flightId, "seats", seatId), {
    isBooked: false,
    bookedBy: null
  });
};

export const listenToSeats = (flightId, callback) => {
  const seatsRef = collection(db, "flights", flightId, "seats");
  return onSnapshot(seatsRef, (snapshot) => {
    const seats = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(seats);
  });
};

export const resetFlightSeatsDatabase = async (flightId) => {
  try {
    const seatsRef = collection(db, "flights", flightId, "seats");
    const snapshot = await getDocs(seatsRef);
    const batch = writeBatch(db);

    snapshot.forEach((seatDoc) => {
      const singleSeatRef = doc(db, "flights", flightId, "seats", seatDoc.id);
      batch.update(singleSeatRef, {
        isBooked: false,
        bookedBy: null
      });
    });

    const flightDocRef = doc(db, "flights", flightId);
    batch.update(flightDocRef, {
      availableSeats: 30
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Failed to execute batch database wipe: ", error);
    throw error;
  }
};