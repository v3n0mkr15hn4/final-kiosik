/**
 * Transport Routes — Ticket booking
 */

import { Router } from 'express';

const router = Router();

// Fare calculation
const fares = {
  metroTicket: { base: 20, perStation: 5 },
  busTicket: { base: 15 },
  busPass: { monthly: 1500, quarterly: 4000, annual: 14000 },
  suburbanTrain: { second: 10, first: 40 },
};

function calculateFare(ticketType, data) {
  switch (ticketType) {
    case 'metroTicket':
      return (fares.metroTicket.base + fares.metroTicket.perStation * 3) * (data.passengers || 1);
    case 'busTicket':
      return fares.busTicket.base * (data.passengers || 1);
    case 'busPass':
      return fares.busPass[data.passType] || fares.busPass.monthly;
    case 'suburbanTrain':
      return (fares.suburbanTrain[data.trainClass] || fares.suburbanTrain.second) * 5 * (data.passengers || 1);
    default:
      return 0;
  }
}

function generateRequestId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SVD-${timestamp}-${random}`;
}

// POST /api/transport/book-ticket
router.post('/book-ticket', (req, res) => {
  const {
    ticketType, passengerName, passengerMobile,
    fromStation, toStation, busRoute, passType, trainClass,
    passengers = 1, travelDate, travelTime,
  } = req.body;

  if (!ticketType || !passengerName || !passengerMobile) {
    return res.status(400).json({ success: false, error: 'Ticket type, passenger name, and mobile are required.' });
  }

  const db = req.app.locals.db;
  const ticketId = `TKT-${generateRequestId()}`;
  const fare = calculateFare(ticketType, { passengers, passType, trainClass });
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO transport_tickets 
      (ticket_id, ticket_type, passenger_name, passenger_mobile,
       from_station, to_station, bus_route, pass_type, train_class,
       passengers, travel_date, travel_time, fare, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
    `).run(
      ticketId, ticketType, passengerName, passengerMobile,
      fromStation || null, toStation || null, busRoute || null, passType || null, trainClass || null,
      passengers, travelDate || null, travelTime || null, fare, now
    );

    return res.status(201).json({
      success: true,
      ticketId,
      type: ticketType,
      from: fromStation || null,
      to: toStation || null,
      route: busRoute || null,
      passType: passType || null,
      passengers,
      fare,
      date: travelDate || null,
      status: 'confirmed',
      timestamp: now,
    });
  } catch (err) {
    console.error('[TRANSPORT]', err.message);
    return res.status(500).json({ success: false, error: 'Failed to book ticket.' });
  }
});

// GET /api/transport/tickets/:ticketId
router.get('/tickets/:ticketId', (req, res) => {
  const db = req.app.locals.db;
  const row = db.prepare('SELECT * FROM transport_tickets WHERE ticket_id = ?').get(req.params.ticketId);

  if (!row) {
    return res.status(404).json({ success: false, error: 'Ticket not found.' });
  }

  return res.json({
    success: true,
    data: {
      ticketId: row.ticket_id,
      type: row.ticket_type,
      passengerName: row.passenger_name,
      from: row.from_station,
      to: row.to_station,
      passengers: row.passengers,
      fare: row.fare,
      date: row.travel_date,
      status: row.status,
      timestamp: row.created_at,
    },
  });
});

export default router;
