const OVERPASS = 'https://overpass-api.de/api/interpreter';
const TIMEOUT_MS = 12000;

// Major Indian city coordinates for Overpass radius queries
export const INDIA_CITIES = {
  'Guwahati':    [26.1445, 91.7362],
  'Delhi':       [28.6139, 77.2090],
  'Mumbai':      [19.0760, 72.8777],
  'Bengaluru':   [12.9716, 77.5946],
  'Chennai':     [13.0827, 80.2707],
  'Kolkata':     [22.5726, 88.3639],
  'Hyderabad':   [17.3850, 78.4867],
  'Ahmedabad':   [23.0225, 72.5714],
  'Pune':        [18.5204, 73.8567],
  'Jaipur':      [26.9124, 75.7873],
  'Lucknow':     [26.8467, 80.9462],
  'Kochi':       [9.9312,  76.2673],
  'Nagpur':      [21.1458, 79.0882],
};

// Static fallback metro stations per city (from actual metro maps)
const METRO_FALLBACK = {
  'Delhi': [
    'Rajiv Chowk','Kashmere Gate','Central Secretariat','Hauz Khas','HUDA City Centre',
    'Dwarka Sector 21','Noida City Centre','Botanical Garden','Vaishali','Inderlok',
    'New Delhi','Chandni Chowk','Lajpat Nagar','Saket','Janakpuri West',
    'Uttam Nagar East','Dilshad Garden','Rithala','Shivaji Stadium','IGI Airport',
  ],
  'Bengaluru': [
    'MG Road','Trinity','Halasuru','Indiranagar','Domlur','Mahatma Gandhi Road',
    'Cubbon Park','Vidhana Soudha','Sir M Visvesvaraya','Nadaprabhu Kempegowda',
    'Chickpete','KR Market','Majestic','Rajajinagar','Peenya',
    'Yelachenahalli','Puttenahalli','South End Circle','Jayanagar','Banashankari',
  ],
  'Mumbai': [
    'Versova','DN Nagar','Azad Nagar','Andheri','Western Express Highway',
    'Chakala','Airport Road','Marol Naka','Saki Naka','Asalpha',
    'Jagruti Nagar','Vinoba Bhave Nagar','Ghatkopar','BKC','CST',
  ],
  'Chennai': [
    'Wimco Nagar','Tiruvottiyur','Thiruvotriyur Theradi','Kaladipet','Tondiarpet',
    'Washermanpet','Sir Theagaraya College','Central','High Court','Egmore',
    'Government Estate','LIC','Chennai Central','CMBT','St. Thomas Mount',
    'Nanganallur Road','Meenambakkam','Chennai Airport',
  ],
  'Kolkata': [
    'Dakshineswar','Baranagar','Noapara','Dum Dum','Belgachhia','Shyambazar',
    'Shobhabazar','Girish Park','MG Road','Central','Chandni Chowk','Esplanade',
    'Park Street','Maidan','Rabindra Sarani','Kalighat','Jatin Das Park',
    'Netaji','Masterda Surya Sen','Tollygunge','Kavi Nazrul','Shahid Khudiram',
  ],
  'Hyderabad': [
    'Miyapur','JNTU College','KPHB Colony','Kukatpally','Balanagar','Moosapet',
    'Bharat Nagar','Erragadda','ESI Hospital','SR Nagar','Ameerpet','Punjagutta',
    'Irrum Manzil','Khairatabad','Lakdi Ka Pul','Assembly','Nampally',
    'Gandhi Bhavan','Osmania Medical College','MJ Market','Malakpet','New Market',
    'Musarambagh','Dilsukhnagar','Chaitanyapuri','Victoria Memorial','L B Nagar',
  ],
  'Kochi': [
    'Aluva','Pulinchodu','Companypady','Ambattukavu','Muttom','Kalamassery',
    'Cusat','Pathadipalam','Edapally','Changampuzha Park','JLN Stadium',
    'Lisie Hospital','MG Road','Maharajas College','Ernakulam South',
    'Kadavanthra','Elamkulam','Vyttila','Thaikoodam','Pettah','SN Junction',
    'Thrippunithura',
  ],
  'Guwahati': [],
  'Ahmedabad': [
    'Vastral','Rabari Colony','Nirant Cross Road','Gyaspur','Apparel Park',
    'Amraiwadi','Naroda Road','Vijaynagar','Kalupur','Gheekanta','Relief Road',
    'Old High Court','Shahpur','Dudheshwar','Ranip','Chandkheda','Motera',
  ],
  'Jaipur': [
    'Mansarovar','Vivek Vihar','Shyam Nagar','Ram Nagar','Civil Lines',
    'Railway Station','Sindhi Camp','New Gate','Chandpole','Chand Pole',
    'Topkhana','Badi Chaupar','Choti Chaupar','Sanjay Square',
  ],
  'Nagpur': [
    'Automotive Square','Kasturchand Park','Zero Mile','Sitabuldi','Rahate Colony',
    'Congress Nagar','Ajni','Ujjwal Nagar','Ambazari','Prajapati Nagar',
  ],
  'Lucknow': [
    'CCS Airport','Mawaiya','Transport Nagar','Singar Nagar','Amausi',
    'Polytechnic','IT Chauraha','Hazratganj','Sachivalaya','Hussainganj',
    'Charbagh','Durgapuri','Lekhraj','Munshipulia',
  ],
  'Pune': [],
};

const BUS_FALLBACK = {
  'Delhi': ['ISBT Kashmere Gate','Anand Vihar','Dhaula Kuan','Nehru Place','Sarita Vihar','Ambedkar Nagar','Sarojini Nagar','RK Puram','Dwarka','Rohini'],
  'Mumbai': ['Kurla Bus Station','Borivali','Thane','Dadar TT','Wadala','Bandra','Andheri','Goregaon','Mulund','Ghatkopar'],
  'Bengaluru': ['Majestic','KR Market','Yeshwanthpur','Shivajinagar','Electronic City','Silk Board','Marathahalli','Whitefield','Bannerghatta Road','Hebbal'],
  'Chennai': ['CMBT','Koyambedu','Broadway','Tambaram','Perambur','Anna Nagar','Adyar','Velachery','Guindy','T Nagar'],
  'Kolkata': ['Esplanade','Babughat','Howrah','Durgapur Expressway','Salt Lake','Gariahat','Ultadanga','Shyambazar','Jadavpur','Garia'],
  'Hyderabad': ['MGBS','Jubilee Bus Station','Secunderabad','Afzalgunj','Charminar','LB Nagar','Uppal','Dilsukhnagar','KPHB','Kukatpally'],
  'Guwahati': ['Paltan Bazar','Adabari','Maligaon','Guwahati Railway Station','Jalukbari','Khanapara','Rukminigaon','Zoo Road','Bhangagarh','Sixmile'],
};

async function overpassQuery(query) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(OVERPASS, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Overpass error ${res.status}`);
    const json = await res.json();
    return json.elements ?? [];
  } finally {
    clearTimeout(timer);
  }
}

function nameOf(el) {
  return el.tags?.name || el.tags?.['name:en'] || el.tags?.['ref'] || null;
}

function dedup(names) {
  const seen = new Set();
  return names.filter(n => n && (seen.has(n) ? false : seen.add(n)));
}

// Metro / subway stations — live from Overpass, fallback to curated list
export async function fetchMetroStations(city) {
  const fallback = METRO_FALLBACK[city] ?? [];
  try {
    const [lat, lng] = INDIA_CITIES[city] ?? [28.6139, 77.2090];
    const q = `
[out:json][timeout:10];
(
  node["railway"="station"]["station"="subway"](around:40000,${lat},${lng});
  node["railway"="station"]["network"~"[Mm]etro|Namma|BMRCL|DMRC|CMRL|HMRL|KMRL"](around:40000,${lat},${lng});
  node["public_transport"="station"]["metro"="yes"](around:40000,${lat},${lng});
);
out body;`;
    const els = await overpassQuery(q);
    const live = dedup(els.map(nameOf)).sort();
    return live.length >= 3 ? live : fallback;
  } catch {
    return fallback;
  }
}

// Bus stops — live from Overpass, fallback to curated list
export async function fetchBusStops(city) {
  const fallback = BUS_FALLBACK[city] ?? [];
  try {
    const [lat, lng] = INDIA_CITIES[city] ?? [28.6139, 77.2090];
    const q = `
[out:json][timeout:10];
node["amenity"="bus_stop"](around:12000,${lat},${lng});
out body;`;
    const els = await overpassQuery(q);
    const live = dedup(els.map(nameOf)).sort();
    return live.length >= 5 ? live : fallback;
  } catch {
    return fallback;
  }
}

// Railway stations — live from Overpass, no static fallback needed (railways well-mapped in OSM)
export async function fetchRailwayStations(city) {
  try {
    const [lat, lng] = INDIA_CITIES[city] ?? [28.6139, 77.2090];
    const q = `
[out:json][timeout:10];
(
  node["railway"="station"](around:60000,${lat},${lng});
  node["railway"="halt"](around:60000,${lat},${lng});
);
out body;`;
    const els = await overpassQuery(q);
    return dedup(els.map(nameOf)).sort();
  } catch {
    return [];
  }
}
