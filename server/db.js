/**
 * Database initialization — SQLite via better-sqlite3
 * Creates all tables and seeds reference data on first run.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { createEnterpriseTables, seedEnterpriseData } from './enterprise/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export function initDB() {
  db = new Database(path.join(__dirname, 'suvidha.db'));

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  createEnterpriseTables(db);
  seedData();
  seedEnterpriseData(db);

  return db;
}

export function getDB() {
  return db;
}

function createTables() {
  db.exec(`
    -- Aadhaar citizen records (simulated UIDAI)
    CREATE TABLE IF NOT EXISTS citizens (
      uid TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_hi TEXT,
      name_ta TEXT,
      dob TEXT NOT NULL,
      gender TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT,
      house TEXT,
      street TEXT,
      landmark TEXT,
      city TEXT,
      city_id TEXT,
      district TEXT,
      state TEXT,
      state_id TEXT,
      pincode TEXT,
      ward TEXT,
      ward_id TEXT,
      photo TEXT,
      disability TEXT,
      blood_group TEXT,
      language TEXT DEFAULT 'en',
      category TEXT DEFAULT 'General',
      occupation TEXT,
      annual_income INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      password_hash TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Service requests (all types: electricity, gas, water, etc.)
    CREATE TABLE IF NOT EXISTS service_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT UNIQUE NOT NULL,
      service_type TEXT NOT NULL,
      service_category TEXT NOT NULL,
      citizen_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT,
      aadhaar_uid TEXT,
      consumer_number TEXT,
      meter_number TEXT,
      connection_id TEXT,
      property_id TEXT,
      health_card_number TEXT,
      state TEXT,
      city TEXT,
      ward TEXT,
      address TEXT,
      description TEXT,
      preferred_date TEXT,
      preferred_time TEXT,
      status TEXT DEFAULT 'submitted',
      assigned_to TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (aadhaar_uid) REFERENCES citizens(uid)
    );

    -- Complaints
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id TEXT UNIQUE NOT NULL,
      complaint_type TEXT NOT NULL,
      citizen_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT,
      aadhaar_uid TEXT,
      state TEXT,
      city TEXT,
      ward TEXT,
      location TEXT,
      description TEXT,
      status TEXT DEFAULT 'submitted',
      ai_department TEXT,
      ai_priority TEXT,
      ai_duplicate_check INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (aadhaar_uid) REFERENCES citizens(uid)
    );

    -- Transport tickets
    CREATE TABLE IF NOT EXISTS transport_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT UNIQUE NOT NULL,
      ticket_type TEXT NOT NULL,
      passenger_name TEXT NOT NULL,
      passenger_mobile TEXT NOT NULL,
      from_station TEXT,
      to_station TEXT,
      bus_route TEXT,
      pass_type TEXT,
      train_class TEXT,
      passengers INTEGER DEFAULT 1,
      travel_date TEXT,
      travel_time TEXT,
      fare REAL DEFAULT 0,
      status TEXT DEFAULT 'confirmed',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Request timeline events
    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL,
      request_type TEXT NOT NULL DEFAULT 'service',
      status TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Schemes database
    CREATE TABLE IF NOT EXISTS schemes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_hi TEXT,
      name_ta TEXT,
      ministry TEXT,
      description TEXT,
      desc_hi TEXT,
      desc_ta TEXT,
      eligibility TEXT,
      benefit TEXT,
      category TEXT,
      status TEXT DEFAULT 'Active',
      target_age_groups TEXT,
      target_genders TEXT,
      target_states TEXT,
      target_income TEXT,
      target_categories TEXT,
      target_occupations TEXT,
      base_match INTEGER DEFAULT 80
    );

    -- Government offices
    CREATE TABLE IF NOT EXISTS offices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_hi TEXT,
      name_ta TEXT,
      type TEXT NOT NULL,
      state TEXT NOT NULL,
      city TEXT NOT NULL,
      ward TEXT,
      address TEXT,
      address_hi TEXT,
      address_ta TEXT,
      phone TEXT,
      email TEXT,
      working_hours TEXT,
      working_hours_hi TEXT,
      working_hours_ta TEXT,
      services TEXT,
      directions TEXT,
      directions_hi TEXT,
      directions_ta TEXT
    );

    -- Emergency alerts
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      title_hi TEXT,
      title_ta TEXT,
      message TEXT NOT NULL,
      message_hi TEXT,
      message_ta TEXT,
      source TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- File uploads
    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER,
      request_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Upload sessions (QR + PIN)
    CREATE TABLE IF NOT EXISTS upload_sessions (
      session_id TEXT PRIMARY KEY,
      pin_hash TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Notification log
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mobile TEXT NOT NULL,
      method TEXT NOT NULL,
      document_type TEXT,
      document_id TEXT,
      status TEXT DEFAULT 'sent',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- OTP store (temporary)
    CREATE TABLE IF NOT EXISTS otp_store (
      uid TEXT PRIMARY KEY,
      otp TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function seedData() {
  // Only seed if citizens table is empty
  const count = db.prepare('SELECT COUNT(*) as c FROM citizens').get();
  if (count.c > 0) return;

  console.log('  📦  Seeding database...');

  // ── Seed Citizens (Aadhaar mock data) ──
  const insertCitizen = db.prepare(`
    INSERT OR IGNORE INTO citizens 
    (uid, name, name_hi, name_ta, dob, gender, mobile, email,
     house, street, landmark, city, city_id, district, state, state_id, pincode, ward, ward_id,
     photo, disability, blood_group, language, category, occupation, annual_income, is_admin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const citizens = [
    ['999988887777', 'Rajesh Kumar', 'राजेश कुमार', 'ராஜேஷ் குமார்', '1990-05-14', 'Male', '9486635346', 'rajesh.kumar@mail.com', '12/A, Gandhi Nagar', 'MG Road', 'Near Central Park', 'Chennai', 'CHN', 'Chennai', 'Tamil Nadu', 'TN', '600001', 'T. Nagar', 'W1', null, null, 'O+', 'ta', 'General', 'Software Engineer', 800000, 0],
    ['111122223333', 'Kamala Devi', 'कमला देवी', 'கமலா தேவி', '1952-11-20', 'Female', '7904802849', null, '45, Sadar Bazaar', 'Chandni Chowk', 'Opposite Red Fort', 'New Delhi', 'NDL', 'Central Delhi', 'Delhi', 'DL', '110006', 'Karol Bagh', 'W2', null, null, 'B+', 'hi', 'OBC', 'Retired', 240000, 0],
    ['444455556666', 'Arun Patil', 'अरुण पाटिल', 'அருண் பாட்டில்', '1985-08-03', 'Male', '9988776655', 'arun.patil@mail.com', '78, Shivaji Park', 'Dadar West', 'Near Siddhivinayak Temple', 'Mumbai', 'MUM', 'Mumbai Suburban', 'Maharashtra', 'MH', '400028', 'Ward D - Grant Road', 'W4', null, 'visual', 'A+', 'en', 'General', 'Teacher', 500000, 0],
    ['777788889999', 'Sneha Reddy', 'स्नेहा रेड्डी', 'ஸ்னேஹா ரெட்டி', '2014-03-10', 'Female', '9090909090', null, '23, Jayanagar 4th Block', '11th Main Road', 'Near Cool Joint', 'Bengaluru', 'BLR', 'Bengaluru Urban', 'Karnataka', 'KA', '560041', 'Jayanagar', 'W4', null, null, 'AB+', 'en', 'General', 'Student', 0, 0],
    ['222233334444', 'Meera Shah', 'मीरा शाह', 'மீரா ஷா', '1978-01-15', 'Female', '9111222333', 'meera.shah@mail.com', '12, CG Road', 'Navrangpura', 'Near Law Garden', 'Ahmedabad', 'AMD', 'Ahmedabad', 'Gujarat', 'GJ', '380009', 'Ward 1 - Central', 'W1', null, 'physical', 'O-', 'en', 'General', 'Accountant', 600000, 0],
    ['123412341234', 'Admin User', 'एडमिन यूज़र', 'நிர்வாகி', '1980-06-01', 'Male', '9000000001', 'admin@suvidha.gov.in', '1, Rajpath', 'Central Secretariat', 'India Gate', 'New Delhi', 'NDL', 'New Delhi', 'Delhi', 'DL', '110001', 'Connaught Place', 'W1', null, null, 'A+', 'en', 'General', 'Government Officer', 1200000, 1],
  ];

  const seedCitizens = db.transaction(() => {
    for (const c of citizens) {
      insertCitizen.run(...c);
    }
  });
  seedCitizens();

  // ── Seed Mock Tracking Data ──
  const insertRequest = db.prepare(`
    INSERT OR IGNORE INTO service_requests 
    (request_id, service_type, service_category, citizen_name, mobile, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertTimeline = db.prepare(`
    INSERT INTO timeline_events (request_id, request_type, status, description, created_at)
    VALUES (?, 'service', ?, ?, ?)
  `);

  const seedTracking = db.transaction(() => {
    insertRequest.run('SVD-TEST-001', 'electricity', 'Electricity - New Connection', 'John Doe', '9876543210', 'inProgress', '2026-01-15T10:30:00Z', '2026-01-17T14:45:00Z');
    insertTimeline.run('SVD-TEST-001', 'submitted', 'Request submitted successfully', '2026-01-15T10:30:00Z');
    insertTimeline.run('SVD-TEST-001', 'inProgress', 'Request assigned to field officer', '2026-01-16T09:00:00Z');

    insertRequest.run('SVD-TEST-002', 'water', 'Water - Leakage Repair', 'Jane Smith', '9876543210', 'resolved', '2026-01-10T08:15:00Z', '2026-01-14T16:20:00Z');
    insertTimeline.run('SVD-TEST-002', 'submitted', 'Request submitted successfully', '2026-01-10T08:15:00Z');
    insertTimeline.run('SVD-TEST-002', 'inProgress', 'Plumber assigned', '2026-01-11T10:00:00Z');
    insertTimeline.run('SVD-TEST-002', 'resolved', 'Leakage repaired successfully', '2026-01-14T16:20:00Z');
  });
  seedTracking();

  // ── Seed Government Offices ──
  const insertOffice = db.prepare(`
    INSERT OR IGNORE INTO offices 
    (id, name, name_hi, name_ta, type, state, city, ward, address, address_hi, address_ta,
     phone, email, working_hours, working_hours_hi, working_hours_ta, services, directions, directions_hi, directions_ta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const offices = [
    ['OFF-CHN-01', 'Chennai Electricity Board (TANGEDCO)', 'चेन्नई विद्युत बोर्ड (TANGEDCO)', 'சென்னை மின்சார வாரியம் (TANGEDCO)', 'electricity', 'TN', 'CHN', 'W1', '144, Anna Salai, T. Nagar, Chennai - 600001', '144, अन्ना सलाई, टी. नगर, चेन्नई - 600001', '144, அண்ணா சாலை, தி. நகர், சென்னை - 600001', '044-28520230', 'tangedco.chennai@tn.gov.in', 'Mon-Sat: 10:00 AM - 5:00 PM', 'सोम-शनि: सुबह 10:00 - शाम 5:00', 'திங்-சனி: காலை 10:00 - மாலை 5:00', '["electricity"]', 'From T. Nagar bus stand, walk 500m east on Anna Salai.', 'टी. नगर बस स्टैंड से 500 मीटर पूर्व अन्ना सलाई पर चलें।', 'தி. நகர் பேருந்து நிலையத்தில் இருந்து 500 மீ கிழக்கே அண்ணா சாலையில் நடக்கவும்.'],
    ['OFF-CHN-02', 'Chennai Corporation Zonal Office (Zone V)', 'चेन्नई निगम क्षेत्रीय कार्यालय (ज़ोन V)', 'சென்னை மாநகராட்சி மண்டல அலுவலகம் (மண்டலம் V)', 'municipal', 'TN', 'CHN', 'W2', '12, Anna Nagar 2nd Avenue, Chennai - 600040', '12, अन्ना नगर 2nd एवेन्यू, चेन्नई - 600040', '12, அண்ணா நகர 2வது அவெனியூ, சென்னை - 600040', '044-26161515', 'zone5@chennaicorporation.gov.in', 'Mon-Fri: 9:30 AM - 5:30 PM', 'सोम-शुक्र: सुबह 9:30 - शाम 5:30', 'திங்-வெள்: காலை 9:30 - மாலை 5:30', '["municipal","sanitation","water"]', 'Located on 2nd Avenue, Anna Nagar.', '2nd एवेन्यू, अन्ना नगर पर स्थित।', '2வது அவெனியூ, அண்ணா நகரில் அமைந்துள்ளது.'],
    ['OFF-CHN-03', 'Chennai Metro Water (CMWSSB)', 'चेन्नई मेट्रो वाटर (CMWSSB)', 'சென்னை மெட்ரோ நீர் (CMWSSB)', 'water', 'TN', 'CHN', 'W3', '1, Pumping Station Road, Chintadripet, Chennai - 600002', '1, पंपिंग स्टेशन रोड, चिंतद्रिपेट, चेन्नई - 600002', '1, பம்பிங் ஸ்டேஷன் சாலை, சிந்தாதிரிப்பேட்டை, சென்னை - 600002', '044-28454343', 'water@cmwssb.tn.gov.in', 'Mon-Sat: 10:00 AM - 4:30 PM', 'सोम-शनि: सुबह 10:00 - शाम 4:30', 'திங்-சனி: காலை 10:00 - மாலை 4:30', '["water","sanitation"]', 'Near Chintadripet railway station.', 'चिंतद्रिपेट रेलवे स्टेशन के पास।', 'சிந்தாதிரிப்பேட்டை ரயில் நிலையம் அருகில்.'],
    ['OFF-CHN-04', 'Chennai Transport Corporation (MTC)', 'चेन्नई परिवहन निगम (MTC)', 'சென்னை போக்குவரத்து கழகம் (MTC)', 'transport', 'TN', 'CHN', 'W1', 'Pallavan House, Anna Salai, Chennai - 600002', 'पल्लवन हाउस, अन्ना सलाई, चेन्नई - 600002', 'பல்லவன் ஹவுஸ், அண்ணா சாலை, சென்னை - 600002', '044-25678900', 'mtc@tn.gov.in', 'Mon-Sat: 9:00 AM - 6:00 PM', 'सोम-शनि: सुबह 9:00 - शाम 6:00', 'திங்-சனி: காலை 9:00 - மாலை 6:00', '["transport"]', 'Pallavan House is on Anna Salai.', 'पल्लवन हाउस अन्ना सलाई पर।', 'பல்லவன் ஹவுஸ் அண்ணா சாலையில்.'],
    ['OFF-CHN-05', 'LPG / Gas Distribution Center (IOC)', 'एलपीजी / गैस वितरण केंद्र (IOC)', 'எல்பிஜி / எரிவாயு விநியோக மையம் (IOC)', 'gas', 'TN', 'CHN', 'W4', '56, Velachery Main Road, Velachery, Chennai - 600042', '56, वेलचेरी मेन रोड, वेलचेरी, चेन्नई - 600042', '56, வேளச்சேரி மெயின் ரோடு, வேளச்சேரி, சென்னை - 600042', '044-22591234', 'ioc.velachery@iocl.com', 'Mon-Sat: 9:00 AM - 5:00 PM', 'सोम-शनि: सुबह 9:00 - शाम 5:00', 'திங்-சனி: காலை 9:00 - மாலை 5:00', '["gas"]', 'On Velachery Main Road.', 'वेलचेरी मेन रोड पर।', 'வேளச்சேரி மெயின் ரோட்டில்.'],
    ['OFF-CHN-06', 'Government General Hospital (PHC)', 'सरकारी सामान्य अस्पताल (PHC)', 'அரசு பொது மருத்துவமனை (PHC)', 'healthcare', 'TN', 'CHN', 'W3', 'Park Town, Chennai - 600003', 'पार्क टाउन, चेन्नई - 600003', 'பார்க் டவுன், சென்னை - 600003', '044-25305000', 'ggh@tn.gov.in', '24/7 Emergency | OPD: 8:00 AM - 12:00 PM', '24/7 आपातकाल | OPD: सुबह 8:00 - दोपहर 12:00', '24/7 அவசரம் | OPD: காலை 8:00 - மதியம் 12:00', '["healthcare"]', 'Located in Park Town near Chennai Central.', 'चेन्नई सेंट्रल के पास पार्क टाउन में स्थित।', 'சென்னை சென்ட்ரல் அருகில் பார்க் டவுனில் அமைந்துள்ளது.'],
    ['OFF-NDL-01', 'Delhi Jal Board (DJB) Head Office', 'दिल्ली जल बोर्ड (DJB) मुख्यालय', 'டெல்லி ஜல் போர்டு (DJB) தலைமை அலுவலகம்', 'water', 'DL', 'NDL', 'W2', 'Varunalaya Phase-II, Karol Bagh, New Delhi - 110005', 'वरुणालय फेज-II, करोल बाग, नई दिल्ली - 110005', 'வருணாலயா பேஸ்-II, கரோல் பாக், புது டெல்லி - 110005', '011-23527679', 'djb@delhi.gov.in', 'Mon-Fri: 9:30 AM - 5:30 PM', 'सोम-शुक्र: सुबह 9:30 - शाम 5:30', 'திங்-வெள்: காலை 9:30 - மாலை 5:30', '["water","sanitation"]', 'Near Karol Bagh Metro Station.', 'करोल बाग मेट्रो स्टेशन के पास।', 'கரோல் பாக் மெட்ரோ நிலையம் அருகில்.'],
    ['OFF-NDL-02', 'BSES Rajdhani Power Ltd.', 'बीएसईएस राजधानी पावर लिमिटेड', 'BSES ராஜ்தானி பவர் லிமிடெட்', 'electricity', 'DL', 'NDL', 'W1', 'BSES Bhawan, Nehru Place, New Delhi - 110019', 'बीएसईएस भवन, नेहरू प्लेस, नई दिल्ली - 110019', 'BSES பவன், நேரு பிளேஸ், புது டெல்லி - 110019', '011-39999707', 'bses.rajdhani@relianceada.com', 'Mon-Sat: 10:00 AM - 6:00 PM', 'सोम-शनि: सुबह 10:00 - शाम 6:00', 'திங்-சனி: காலை 10:00 - மாலை 6:00', '["electricity"]', 'At Nehru Place, opposite the District Centre.', 'नेहरू प्लेस में, डिस्ट्रिक्ट सेंटर के सामने।', 'நேரு பிளேஸில், மாவட்ட மையத்திற்கு எதிரே.'],
    ['OFF-NDL-03', 'South Delhi Municipal Corporation', 'दक्षिण दिल्ली नगर निगम', 'தெற்கு டெல்லி நகராட்சி', 'municipal', 'DL', 'NDL', 'W5', 'Dr. S.P. Mukherji Civic Centre, Minto Road, New Delhi', 'डॉ. एस.पी. मुखर्जी सिविक सेंटर, मिंटो रोड', 'டாக்டர் எஸ்.பி. முகர்ஜி சிவிக் சென்டர், மிண்டோ ரோடு', '011-23227706', 'sdmc@mcdonline.nic.in', 'Mon-Fri: 9:00 AM - 5:00 PM', 'सोम-शुक्र: सुबह 9:00 - शाम 5:00', 'திங்-வெள்: காலை 9:00 - மாலை 5:00', '["municipal","sanitation"]', 'On Minto Road, near Delhi Gate Metro.', 'मिंटो रोड पर, दिल्ली गेट मेट्रो के पास।', 'மிண்டோ ரோட்டில், டெல்லி கேட் மெட்ரோ அருகில்.'],
    ['OFF-NDL-04', 'Delhi Transport Corporation (DTC)', 'दिल्ली परिवहन निगम (DTC)', 'டெல்லி போக்குவரத்து கழகம் (DTC)', 'transport', 'DL', 'NDL', 'W1', 'IP Estate, New Delhi - 110002', 'आईपी एस्टेट, नई दिल्ली - 110002', 'ஐ.பி. எஸ்டேட், புது டெல்லி - 110002', '011-23378888', 'dtc@delhi.gov.in', 'Mon-Sat: 9:30 AM - 5:30 PM', 'सोम-शनि: सुबह 9:30 - शाम 5:30', 'திங்-சனி: காலை 9:30 - மாலை 5:30', '["transport"]', 'IP Estate near ITO Metro.', 'ITO मेट्रो के पास आईपी एस्टेट।', 'ITO மெட்ரோ அருகில் ஐ.பி. எஸ்டேட்.'],
    ['OFF-MUM-01', 'BMC Ward Office D (Grant Road)', 'बीएमसी वार्ड कार्यालय D (ग्रांट रोड)', 'BMC வார்ட் அலுவலகம் D (கிராண்ட் ரோடு)', 'municipal', 'MH', 'MUM', 'W4', 'BMC Ward D Office, Grant Road West, Mumbai - 400007', 'बीएमसी वार्ड D कार्यालय, ग्रांट रोड पश्चिम', 'BMC வார்ட் D அலுவலகம், கிராண்ட் ரோடு மேற்கு', '022-23868686', 'wardd@mcgm.gov.in', 'Mon-Sat: 10:00 AM - 5:30 PM', 'सोम-शनि: सुबह 10:00 - शाम 5:30', 'திங்-சனி: காலை 10:00 - மாலை 5:30', '["municipal","water","sanitation"]', 'Near Grant Road station (Western Line).', 'ग्रांट रोड स्टेशन (वेस्टर्न लाइन) के पास।', 'கிராண்ட் ரோடு நிலையம் (வெஸ்டர்ன் லைன்) அருகில்.'],
    ['OFF-MUM-02', 'BEST Undertaking (Transport)', 'बेस्ट अंडरटेकिंग (परिवहन)', 'BEST அண்டர்டேக்கிங் (போக்குவரத்து)', 'transport', 'MH', 'MUM', 'W3', 'BEST Bhawan, Colaba, Mumbai - 400001', 'बेस्ट भवन, कोलाबा, मुंबई - 400001', 'BEST பவன், கொலாபா, மும்பை - 400001', '022-22853434', 'best@bestundertaking.com', 'Mon-Sat: 9:30 AM - 5:30 PM', 'सोम-शनि: सुबह 9:30 - शाम 5:30', 'திங்-சனி: காலை 9:30 - மாலை 5:30', '["transport","electricity"]', 'At Colaba, near Gateway of India.', 'कोलाबा में, गेटवे ऑफ इंडिया के पास।', 'கொலாபாவில், கேட்வே ஆஃப் இந்தியா அருகில்.'],
    ['OFF-BLR-01', 'BBMP Ward Office (Jayanagar)', 'बीबीएमपी वार्ड कार्यालय (जयनगर)', 'BBMP வார்ட் அலுவலகம் (ஜெயநகர்)', 'municipal', 'KA', 'BLR', 'W4', '4th Block, Jayanagar, Bengaluru - 560041', '4th ब्लॉक, जयनगर, बेंगलुरु - 560041', '4வது பிளாக், ஜெயநகர், பெங்களூர் - 560041', '080-26535555', 'jnagar@bbmp.gov.in', 'Mon-Sat: 10:00 AM - 5:00 PM', 'सोम-शनि: सुबह 10:00 - शाम 5:00', 'திங்-சனி: காலை 10:00 - மாலை 5:00', '["municipal","sanitation","water"]', 'In 4th Block Jayanagar, near Jain Temple.', '4th ब्लॉक जयनगर में, जैन मंदिर के पास।', '4வது பிளாக் ஜெயநகரில், ஜைன் கோவில் அருகில்.'],
    ['OFF-BLR-02', 'BESCOM Office (Koramangala)', 'बेस्कॉम कार्यालय (कोरमंगला)', 'BESCOM அலுவலகம் (கோரமங்கலா)', 'electricity', 'KA', 'BLR', 'W1', '80 Feet Road, Koramangala, Bengaluru - 560034', '80 फीट रोड, कोरमंगला, बेंगलुरु - 560034', '80 ஃபீட் ரோடு, கோரமங்கலா, பெங்களூர் - 560034', '080-22876543', 'bescom.koramangala@karnataka.gov.in', 'Mon-Sat: 10:00 AM - 5:00 PM', 'सोम-शनि: सुबह 10:00 - शाम 5:00', 'திங்-சனி: காலை 10:00 - மாலை 5:00', '["electricity"]', 'On 80 Feet Road in Koramangala 4th Block.', 'कोरमंगला 4th ब्लॉक में 80 फीट रोड पर।', 'கோரமங்கலா 4வது பிளாக்கில் 80 ஃபீட் ரோட்டில்.'],
    ['OFF-AMD-01', 'Ahmedabad Municipal Corporation (AMC)', 'अहमदाबाद नगर निगम (AMC)', 'அகமதாபாத் நகராட்சி (AMC)', 'municipal', 'GJ', 'AMD', 'W1', 'Danapith, Ahmedabad - 380001', 'डानापीठ, अहमदाबाद - 380001', 'டானாபித், அகமதாபாத் - 380001', '079-25391811', 'amc@ahmedabadcity.gov.in', 'Mon-Sat: 10:30 AM - 6:00 PM', 'सोम-शनि: सुबह 10:30 - शाम 6:00', 'திங்-சனி: காலை 10:30 - மாலை 6:00', '["municipal","water","sanitation"]', 'Near Lal Darwaja bus stand.', 'लाल दरवाजा बस स्टैंड के पास।', 'லால் தர்வாஜா பேருந்து நிலையம் அருகில்.'],
    ['OFF-AMD-02', 'Torrent Power Customer Care', 'टॉरेंट पावर ग्राहक सेवा', 'டோர்ரென்ட் பவர் வாடிக்கையாளர் சேவை', 'electricity', 'GJ', 'AMD', 'W1', 'Torrent House, CG Road, Ahmedabad - 380009', 'टॉरेंट हाउस, सीजी रोड, अहमदाबाद - 380009', 'டோர்ரென்ட் ஹவுஸ், சிஜி ரோடு, அகமதாபாத் - 380009', '079-26462222', 'care@torrentpower.com', 'Mon-Sat: 9:30 AM - 6:00 PM', 'सोम-शनि: सुबह 9:30 - शाम 6:00', 'திங்-சனி: காலை 9:30 - மாலை 6:00', '["electricity"]', 'On CG Road near Law Garden.', 'लॉ गार्डन के पास सीजी रोड पर।', 'லா கார்டன் அருகில் சிஜி ரோட்டில்.'],
  ];

  const seedOffices = db.transaction(() => {
    for (const o of offices) {
      insertOffice.run(...o);
    }
  });
  seedOffices();

  // ── Seed Emergency Alerts ──
  const insertAlert = db.prepare(`
    INSERT OR IGNORE INTO alerts (id, type, severity, title, title_hi, title_ta, message, message_hi, message_ta, source, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedAlerts = db.transaction(() => {
    insertAlert.run('alert-1', 'weather', 'high', 'Heavy Rainfall Warning', 'भारी वर्षा चेतावनी', 'கனமழை எச்சரிக்கை', 'IMD has issued a heavy rainfall warning for coastal Tamil Nadu. Expected 120mm+ rainfall in next 24 hours.', 'IMD ने तटीय तमिलनाडु के लिए भारी वर्षा चेतावनी जारी की है।', 'IMD கடலோர தமிழ்நாட்டிற்கு கனமழை எச்சரிக்கை வழங்கியுள்ளது.', 'IMD', 1);
    insertAlert.run('alert-2', 'air', 'medium', 'Poor Air Quality Alert', 'खराब वायु गुणवत्ता चेतावनी', 'மோசமான காற்றுத்தர எச்சரிக்கை', 'AQI levels in Delhi-NCR have crossed 300. Avoid outdoor activities.', 'दिल्ली-NCR में AQI स्तर 300 से अधिक हो गया है।', 'டெல்லி-NCR இல் AQI அளவு 300 ஐ கடந்துள்ளது.', 'CPCB', 1);
  });
  seedAlerts();

  // ── Seed Schemes ──
  const insertScheme = db.prepare(`
    INSERT OR IGNORE INTO schemes 
    (id, name, name_hi, name_ta, ministry, description, desc_hi, desc_ta, eligibility, benefit, category, status,
     target_age_groups, target_genders, target_states, target_income, target_categories, target_occupations, base_match)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const schemes = [
    ['PM-KISAN', 'PM-Kisan Samman Nidhi', 'पीएम-किसान सम्मान निधि', 'பிரதான மந்திரி கிசான் சம்மான் நிதி', 'Ministry of Agriculture', 'Direct income support of ₹6,000/year to small and marginal farmer families.', 'छोटे और सीमांत किसान परिवारों को ₹6,000/वर्ष की प्रत्यक्ष आय सहायता।', 'சிறு மற்றும் குறு விவசாயி குடும்பங்களுக்கு ₹6,000/ஆண்டு நேரடி வருமான ஆதரவு.', '["Small/marginal farmer","Indian citizen","Land ownership records"]', '₹6,000 per year in 3 installments', 'Agriculture', 'Active', '["18-25","26-35","36-45","46-60","60+"]', '["male","female","other"]', '["all"]', '["below-1L","1L-3L","3L-6L"]', '["all"]', '["farmer"]', 95],
    ['PM-AWAS', 'Pradhan Mantri Awas Yojana', 'प्रधानमंत्री आवास योजना', 'பிரதான மந்திரி ஆவாஸ் யோஜனா', 'Ministry of Housing', 'Housing for all — financial assistance up to ₹2.67 lakh for constructing pucca houses.', 'सभी के लिए आवास — पक्के घर बनाने के लिए ₹2.67 लाख तक की वित्तीय सहायता।', 'அனைவருக்கும் வீடு — பக்கா வீடுகள் கட்ட ₹2.67 லட்சம் வரை நிதி உதவி.', '["BPL family","No pucca house","EWS/LIG category"]', 'Up to ₹2.67 lakh subsidy', 'Housing', 'Active', '["26-35","36-45","46-60","60+"]', '["male","female","other"]', '["all"]', '["below-1L","1L-3L","3L-6L"]', '["sc","st","obc","ews"]', '["all"]', 88],
    ['MUDRA-LOAN', 'Pradhan Mantri MUDRA Yojana', 'प्रधानमंत्री मुद्रा योजना', 'பிரதான மந்திரி முத்ரா யோஜனா', 'Ministry of Finance', 'Collateral-free loans up to ₹10 lakh for small/micro enterprises.', 'छोटे/सूक्ष्म उद्यमों के लिए ₹10 लाख तक के गारंटी-मुक्त ऋण।', 'சிறு/நுண் நிறுவனங்களுக்கு ₹10 லட்சம் வரை உத்தரவாத இல்லா கடன்.', '["Non-corporate small business","Indian citizen","Business plan required"]', 'Loans up to ₹10 lakh', 'Finance', 'Active', '["18-25","26-35","36-45","46-60"]', '["male","female","other"]', '["all"]', '["below-1L","1L-3L","3L-6L","6L-10L"]', '["all"]', '["self-employed","street-vendor"]', 85],
    ['AYUSHMAN', 'Ayushman Bharat (PM-JAY)', 'आयुष्मान भारत (PM-JAY)', 'ஆயுஷ்மான் பாரத் (PM-JAY)', 'Ministry of Health', 'Health coverage of ₹5 lakh/year/family for secondary and tertiary hospitalization.', 'माध्यमिक और तृतीयक अस्पताल में भर्ती के लिए ₹5 लाख/वर्ष/परिवार का स्वास्थ्य कवरेज।', 'இரண்டாம் மற்றும் மூன்றாம் நிலை மருத்துவமனை தங்கலுக்கு ₹5 லட்சம்/ஆண்டு/குடும்ப சுகாதார காப்பீடு.', '["BPL family","No existing health insurance","SECC listed"]', '₹5 lakh health cover per family', 'Healthcare', 'Active', '["all"]', '["male","female","other"]', '["all"]', '["below-1L","1L-3L"]', '["sc","st","obc","ews"]', '["all"]', 90],
    ['SUKANYA', 'Sukanya Samriddhi Yojana', 'सुकन्या समृद्धि योजना', 'சுகன்யா சம்ரிதி யோஜனா', 'Ministry of Finance', 'Savings scheme for girl child with attractive interest rate and tax benefits.', 'आकर्षक ब्याज दर और कर लाभ के साथ बालिकाओं के लिए बचत योजना।', 'கவர்ச்சிகரமான வட்டி விகிதம் மற்றும் வரிச் சலுகைகளுடன் பெண் குழந்தைக்கான சேமிப்புத் திட்டம்.', '["Girl child below 10 years","Parent/guardian opens account","Max 2 accounts per family"]', 'Up to 8.2% interest + tax-free maturity', 'Women & Child', 'Active', '["all"]', '["female"]', '["all"]', '["all"]', '["all"]', '["all"]', 80],
    ['UJJWALA', 'Pradhan Mantri Ujjwala Yojana', 'प्रधानमंत्री उज्ज्वला योजना', 'பிரதான மந்திரி உஜ்வலா யோஜனா', 'Ministry of Petroleum', 'Free LPG connections and subsidized refills for BPL households.', 'बीपीएल परिवारों के लिए मुफ्त एलपीजी कनेक्शन और सब्सिडी वाले रीफिल।', 'BPL குடும்பங்களுக்கு இலவச எல்பிஜி இணைப்பு மற்றும் மானிய நிரப்புதல்கள்.', '["BPL household","Adult woman of household","No existing LPG connection"]', 'Free LPG connection + subsidized refills', 'Energy', 'Active', '["26-35","36-45","46-60","60+"]', '["female"]', '["all"]', '["below-1L","1L-3L"]', '["sc","st","obc","ews"]', '["homemaker","daily-wage"]', 87],
    ['NSP', 'National Scholarship Portal', 'राष्ट्रीय छात्रवृत्ति पोर्टल', 'தேசிய உதவித்தொகை இணையதளம்', 'Ministry of Education', 'Central scholarships for students from minority communities, SC/ST/OBC, and merit-based.', 'अल्पसंख्यक समुदायों, SC/ST/OBC और मेरिट आधारित छात्रों के लिए केंद्रीय छात्रवृत्ति।', 'சிறுபான்மை சமூகங்கள், SC/ST/OBC மற்றும் தகுதி அடிப்படையிலான மாணவர்களுக்கான மத்திய உதவித்தொகை.', '["Student enrolled in recognized institution","Income below ₹2.5 lakh","Minimum 50% attendance"]', '₹10,000 - ₹50,000 per year', 'Education', 'Active', '["18-25"]', '["male","female","other"]', '["all"]', '["below-1L","1L-3L"]', '["sc","st","obc","ews"]', '["student"]', 92],
    ['PM-SVA', 'PM SVANidhi (Street Vendors)', 'पीएम स्वानिधि (स्ट्रीट वेंडर)', 'PM சுவநிதி (தெருக்கடை வணிகர்)', 'Ministry of Housing', 'Working capital loan up to ₹50,000 for street vendors at subsidized rates.', 'स्ट्रीट वेंडरों के लिए रियायती दरों पर ₹50,000 तक का कार्यशील पूंजी ऋण।', 'தெருக்கடை வணிகர்களுக்கு மானிய விகிதத்தில் ₹50,000 வரை செயல்பாட்டு மூலதன கடன்.', '["Street vendor with vending certificate","Age 18+","Valid ID"]', 'Loan up to ₹50,000', 'Urban Livelihood', 'Active', '["18-25","26-35","36-45","46-60"]', '["male","female","other"]', '["all"]', '["below-1L","1L-3L"]', '["all"]', '["street-vendor"]', 93],
    ['OLD-AGE', 'Indira Gandhi National Old Age Pension', 'इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन', 'இந்திரா காந்தி தேசிய முதியோர் ஓய்வூதியம்', 'Ministry of Rural Development', 'Monthly pension of ₹200-₹500 for senior citizens from BPL families.', 'बीपीएल परिवारों के वरिष्ठ नागरिकों के लिए ₹200-₹500 का मासिक पेंशन।', 'BPL குடும்பங்களின் மூத்த குடிமக்களுக்கு ₹200-₹500 மாத ஓய்வூதியம்.', '["Age 60+ years","BPL family","Not receiving any other pension"]', '₹200-₹500 per month', 'Social Security', 'Active', '["60+"]', '["male","female","other"]', '["all"]', '["below-1L","1L-3L"]', '["all"]', '["retired","unemployed"]', 90],
    ['MGNREGA', 'MGNREGA', 'मनरेगा', 'மகாத்மா காந்தி தேசிய ஊரக வேலைவாய்ப்பு உறுதித்திட்டம்', 'Ministry of Rural Development', 'Guaranteed 100 days of wage employment per year to rural households.', 'ग्रामीण परिवारों को प्रति वर्ष 100 दिनों के वेतन रोजगार की गारंटी।', 'கிராமப்புற குடும்பங்களுக்கு ஆண்டுக்கு 100 நாட்கள் ஊதிய வேலைவாய்ப்பு உத்தரவாதம்.', '["Adult member of rural household","Willing to do unskilled manual work","Job card holder"]', '100 days guaranteed employment', 'Employment', 'Active', '["18-25","26-35","36-45","46-60"]', '["male","female","other"]', '["all"]', '["below-1L","1L-3L"]', '["all"]', '["daily-wage","unemployed","farmer"]', 88],
  ];

  const seedSchemes = db.transaction(() => {
    for (const s of schemes) {
      insertScheme.run(...s);
    }
  });
  seedSchemes();

  console.log('  ✅  Database seeded successfully');
}
