import { useEffect, useState } from "react";

interface Event {
  id: number;
  name: string;
  location: string;
  date: string;
}

const EventList = () => {
  const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        // Memanggil API Backend yang tadi kita tes
        fetch("http://localhost:8000/api/events/")
            .then((response) => response.json())
            .then((data) => setEvents(data))
            .catch((error) => console.error('Gagal ambil data:', error));
    }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Daftar Event</h1>
      <div style={{ display: 'grid', gap: '10px' }}>
        {events.map((event) => (
            <div key={event.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
                <h2>{event.name}</h2>
                <p>📍 {event.location}</p>
                <small>📅 {new Date(event.date).toLocaleDateString()}</small>
            </div>
        ))}
      </div>
    </div>
  );
};

export default EventList;