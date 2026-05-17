import { db } from "./firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

export const searchFlights = async (origin, destination) => {
  try {
    const flightsRef = collection(db, "flights");
    const q = query(
      flightsRef,
      where("origin", "==", origin),
      where("destination", "==", destination)
    );
    
    const querySnapshot = await getDocs(q);
    const flightsList = [];
    
    querySnapshot.forEach((docSnap) => {
      flightsList.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    
    return flightsList;
  } catch (error) {
    console.error("Error searching flights: ", error);
    throw error;
  }
};