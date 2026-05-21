// ────────────────────────────────────────────────────────────────────
// SUVIDHA Vertical Kiosk · Department service pages
// Gas, Municipal, Water, Property Tax, Healthcare, Transport, Sanitation
// ────────────────────────────────────────────────────────────────────
const { I: II, ic: icc, VK: VK_, DD: DD_, PhotoStub: PStub } = window;

// ═══════════════════════════════════════════════════════════════════
// 19. GAS MENU
// ═══════════════════════════════════════════════════════════════════
function VGasMenu() {
  const services = [
    { name: 'Book Refill', desc: 'Schedule a cylinder delivery · Track delivery boy', glyph: icc.flame, primary: true },
    { name: 'Pay Bill', desc: 'PNG pipeline · auto-pay setup', glyph: icc.receipt },
    { name: 'New Connection', desc: 'Apply with KYC + address proof', glyph: icc.plus },
    { name: 'Surrender / Transfer', desc: 'Close or shift connection', glyph: icc.cog },
    { name: 'Report Leak', desc: '24×7 safety hotline · auto-GPS', glyph: icc.bell },
    { name: 'Safety Check', desc: 'Schedule annual home inspection', glyph: icc.shield },
  ];
  return (
    <VK_ name="Aruna">
      <div style={{ textAlign:'center', marginBottom: 22 }}>
        <DD_ color="var(--dept-gas)" glyph={icc.flame} size={120} isz={60}/>
        <h1 className="h2" style={{ marginTop: 14 }}>Assam Gas</h1>
        <p className="body-l" style={{ marginTop: 8 }}>Cylinder · piped gas · safety · billing</p>
      </div>

      {/* Connection summary */}
      <div className="card" style={{ padding: 20, display:'flex', alignItems:'center', gap: 16, marginBottom: 18, borderLeft:'6px solid var(--dept-gas)' }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background:'color-mix(in oklab, var(--dept-gas) 22%, white)', color:'var(--dept-gas)', display:'grid', placeItems:'center' }}><II d={icc.flame} size={30}/></div>
        <div style={{ flex: 1 }}>
          <div className="label-tag">YOUR CONNECTION</div>
          <div style={{ fontSize: 22, fontWeight: 700, color:'var(--indigo-900)', marginTop: 2 }}>Domestic LPG · 14.2 kg</div>
          <div className="meta" style={{ marginTop: 2, fontFamily:'var(--font-mono)' }}>Cons. 9012-77 · Last refill Mar 18</div>
        </div>
        <span className="badge b-ok"><II d={icc.check} size={14}/> ACTIVE</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 14 }}>
        {services.map(s => (
          <button key={s.name} className="tile" style={{ minHeight: 230, padding: 26, background: s.primary ? 'color-mix(in oklab, var(--dept-gas) 9%, white)' : 'white', borderColor: s.primary ? 'var(--dept-gas)' : 'var(--line)', borderWidth: s.primary ? 2 : 1 }}>
            <DD_ color="var(--dept-gas)" glyph={s.glyph} size={72} isz={36}/>
            <div>
              <div className="nm" style={{ fontSize: 26 }}>{s.name}</div>
              <div className="sub" style={{ marginTop: 6 }}>{s.desc}</div>
            </div>
            {s.primary && <span className="badge b-warn" style={{ alignSelf:'flex-start' }}>SUGGESTED · 42 DAYS SINCE LAST</span>}
          </button>
        ))}
      </div>
    </VK_>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 20. GAS BILLS / PAYMENT
// ═══════════════════════════════════════════════════════════════════
function VGasBill() {
  return (
    <VK_ name="Aruna">
      <div style={{ marginBottom: 14 }}>
        <div className="label-tag">ASSAM GAS · PIPED CONNECTION</div>
        <h2 className="h3" style={{ marginTop: 6 }}>Bill Payment</h2>
      </div>

      {/* Bill summary */}
      <div className="card" style={{ padding: 28, marginBottom: 16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 18 }}>
          <div>
            <div className="label-tag">CONSUMER · 9012-77</div>
            <div style={{ fontSize: 24, fontWeight: 700, color:'var(--indigo-900)', marginTop: 4 }}>Aruna Devi</div>
            <div className="meta" style={{ marginTop: 2 }}>Bhangagarh · Bill cycle Apr 2026</div>
          </div>
          <span className="badge b-warn">DUE IN 4 DAYS</span>
        </div>

        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', padding: '20px 0', borderTop:'1.5px dashed var(--line)', borderBottom:'1.5px dashed var(--line)', marginBottom: 16 }}>
          <div>
            <div className="label-tag">TOTAL DUE</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize: 76, fontWeight: 800, color:'var(--dept-gas)', letterSpacing:'-0.03em', lineHeight: 1, marginTop: 6 }}>₹ 1,090</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div className="label-tag">DUE DATE</div>
            <div style={{ fontFamily:'var(--font-mono)', fontWeight: 700, fontSize: 28, color:'var(--err)', marginTop: 6 }}>04 May 2026</div>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
          <div className="receipt-row"><span className="k">Consumption (m³)</span><span className="v">14.8 m³</span></div>
          <div className="receipt-row"><span className="k">Unit rate</span><span className="v">₹ 64.50 / m³</span></div>
          <div className="receipt-row"><span className="k">Fixed charges</span><span className="v">₹ 75.00</span></div>
          <div className="receipt-row"><span className="k">Subsidy applied (PMUY)</span><span className="v" style={{ color:'var(--ok)' }}>− ₹ 38.00</span></div>
          <div className="receipt-row"><span className="k">Previous balance</span><span className="v">₹ 0.00</span></div>
        </div>
      </div>

      {/* Pay methods */}
      <div className="label-tag" style={{ marginBottom: 10 }}>PAY USING</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { l: 'UPI / QR', sub: 'GPay · PhonePe · BHIM', g: icc.qr, primary: true },
          { l: 'Debit / Credit', sub: 'Tap or swipe', g: icc.card },
          { l: 'Net Banking', sub: '60+ banks', g: icc.building },
        ].map(p => (
          <button key={p.l} className="card" style={{ padding: 20, display:'flex', flexDirection:'column', gap: 10, cursor:'pointer', borderColor: p.primary ? 'var(--indigo-700)' : 'var(--line)', borderWidth: p.primary ? 2.5 : 1, background: p.primary ? 'var(--indigo-100)' : 'white' }}>
            <DD_ color={p.primary ? 'var(--indigo-700)' : 'var(--ink-700)'} glyph={p.g} size={56} isz={28}/>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color:'var(--indigo-900)' }}>{p.l}</div>
              <div className="meta" style={{ marginTop: 2 }}>{p.sub}</div>
            </div>
          </button>
        ))}
      </div>

      <button className="btn btn-pri btn-xl" style={{ width: '100%' }}>Continue to UPI · Pay ₹ 1,090 <II d={icc.arrow} size={28}/></button>
    </VK_>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 21. MUNICIPAL MENU
// ═══════════════════════════════════════════════════════════════════
function VMunicipal() {
  const services = [
    { name: 'Property Tax', desc: 'Assessment · pay annual dues', glyph: icc.building, c: 'var(--dept-water)' },
    { name: 'Water Connection', desc: 'New, transfer, repair', glyph: icc.drop, c: 'var(--dept-water)' },
    { name: 'Birth · Death · Marriage', desc: 'Certificates · digital copy', glyph: icc.doc, c: 'var(--indigo-700)' },
    { name: 'Trade Licence', desc: 'New shop · renewal', glyph: icc.cog, c: 'var(--saffron-700)' },
    { name: 'Building Plan', desc: 'Apply · check status', glyph: icc.building, c: 'var(--dept-trans)' },
    { name: 'Grievance', desc: 'Pothole · streetlight · garbage', glyph: icc.bell, c: 'var(--err)' },
  ];
  return (
    <VK_ name="Aruna">
      <div style={{ textAlign:'center', marginBottom: 18 }}>
        <DD_ color="var(--dept-water)" glyph={icc.building} size={120} isz={60}/>
        <h1 className="h2" style={{ marginTop: 14 }}>Guwahati Municipal</h1>
        <p className="body-l" style={{ marginTop: 8 }}>Property · water · certificates · licences</p>
      </div>

      {/* Status cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="label-tag">PROPERTY TAX</div>
          <div style={{ fontSize: 24, fontWeight: 800, color:'var(--err)', marginTop: 6 }}>₹ 4,820 due</div>
          <div className="meta" style={{ marginTop: 2 }}>by 30 Jun 2026</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="label-tag">WATER BILL</div>
          <div style={{ fontSize: 24, fontWeight: 800, color:'var(--err)', marginTop: 6 }}>₹ 412 due</div>
          <div className="meta" style={{ marginTop: 2 }}>by 04 May 2026</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="label-tag">YOUR WARD</div>
          <div style={{ fontSize: 24, fontWeight: 800, color:'var(--indigo-900)', marginTop: 6 }}>Ward 14</div>
          <div className="meta" style={{ marginTop: 2 }}>Councillor: A. Saikia</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 14 }}>
        {services.map(s => (
          <button key={s.name} className="tile" style={{ minHeight: 200, padding: 24 }}>
            <DD_ color={s.c} glyph={s.glyph} size={68} isz={34}/>
            <div>
              <div className="nm" style={{ fontSize: 24 }}>{s.name}</div>
              <div className="sub" style={{ marginTop: 4, fontSize: 17 }}>{s.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </VK_>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 22. PROPERTY TAX PAYMENT
// ═══════════════════════════════════════════════════════════════════
function VPropertyTax() {
  return (
    <VK_ name="Aruna">
      <div style={{ marginBottom: 14 }}>
        <div className="label-tag">MUNICIPAL · PROPERTY TAX</div>
        <h2 className="h3" style={{ marginTop: 6 }}>Pay Annual Assessment</h2>
      </div>

      {/* Property card */}
      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 18 }}>
          <div style={{ width: 96, height: 96, borderRadius: 22, background:'color-mix(in oklab, var(--dept-water) 22%, white)', color:'var(--dept-water)', display:'grid', placeItems:'center', flexShrink:0 }}><II d={icc.building} size={48}/></div>
          <div style={{ flex: 1 }}>
            <div className="label-tag">PROPERTY ID</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize: 24, fontWeight: 700, color:'var(--indigo-700)' }}>GMC-04-BHN-141-2278</div>
            <div className="meta" style={{ marginTop: 4 }}>House 24, GS Road, Bhangagarh · Residential · 1,840 sq ft</div>
          </div>
          <span className="badge b-warn">FY 2026-27</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="card" style={{ padding: 26, marginBottom: 16 }}>
        <div className="label-tag" style={{ marginBottom: 8 }}>ASSESSMENT BREAKDOWN</div>
        <div className="receipt-row"><span className="k">Annual Rental Value (ARV)</span><span className="v">₹ 1,38,000</span></div>
        <div className="receipt-row"><span className="k">Holding tax @ 6%</span><span className="v">₹ 8,280</span></div>
        <div className="receipt-row"><span className="k">Conservancy tax</span><span className="v">₹ 840</span></div>
        <div className="receipt-row"><span className="k">Drainage tax</span><span className="v">₹ 480</span></div>
        <div className="receipt-row"><span className="k">Early-bird rebate (10%)</span><span className="v" style={{ color:'var(--ok)' }}>− ₹ 960</span></div>
        <div className="receipt-row"><span className="k">Last year paid</span><span className="v">₹ 3,820</span></div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', paddingTop: 14, borderTop:'2px solid var(--indigo-900)', marginTop: 8 }}>
          <div>
            <div className="label-tag">PAYABLE NOW</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize: 64, fontWeight: 800, color:'var(--indigo-900)', letterSpacing:'-0.03em', lineHeight: 1, marginTop: 4 }}>₹ 4,820</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div className="label-tag">SAVE BY PAYING</div>
            <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--ok)' }}>BEFORE 30 JUN</div>
          </div>
        </div>
      </div>

      {/* Pay options + part pay */}
      <div style={{ display:'flex', gap: 14, marginBottom: 16 }}>
        <button className="card" style={{ flex: 2, padding: 18, display:'flex', alignItems:'center', gap: 14, cursor:'pointer', borderColor:'var(--indigo-700)', borderWidth: 2.5, background:'var(--indigo-100)' }}>
          <DD_ color="var(--indigo-700)" glyph={icc.rupee} size={48} isz={24}/>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color:'var(--indigo-900)' }}>Pay full amount</div>
            <div className="meta">Get instant receipt & rebate</div>
          </div>
        </button>
        <button className="card" style={{ flex: 1, padding: 18, display:'flex', alignItems:'center', gap: 14, cursor:'pointer' }}>
          <DD_ color="var(--ink-700)" glyph={icc.calendar} size={48} isz={24}/>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color:'var(--indigo-900)' }}>Part pay</div>
            <div className="meta">Min ₹ 1,000</div>
          </div>
        </button>
      </div>

      <button className="btn btn-pri btn-xl" style={{ width: '100%' }}>Proceed to Pay ₹ 4,820 <II d={icc.arrow} size={28}/></button>
    </VK_>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 23. WATER — Bill + connection summary
// ═══════════════════════════════════════════════════════════════════
function VWater() {
  return (
    <VK_ name="Aruna">
      <div style={{ marginBottom: 14, display:'flex', alignItems:'center', gap: 18 }}>
        <DD_ color="var(--dept-water)" glyph={icc.drop} size={80} isz={40}/>
        <div>
          <div className="label-tag">MUNICIPAL WATER · GMC</div>
          <h2 className="h3" style={{ marginTop: 4 }}>Water Connection</h2>
        </div>
      </div>

      {/* Connection */}
      <div className="card" style={{ padding: 20, marginBottom: 14, display:'flex', justifyContent: 'space-between', alignItems:'center', gap: 14 }}>
        <div>
          <div className="label-tag">CONNECTION NO.</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize: 22, fontWeight: 700, color:'var(--indigo-700)', marginTop: 4 }}>W-2241 / 2017</div>
          <div className="meta" style={{ marginTop: 2 }}>Domestic · ½ inch · Bhangagarh</div>
        </div>
        <span className="badge b-ok"><II d={icc.check} size={14}/> ACTIVE</span>
      </div>

      {/* Usage card */}
      <div className="card" style={{ padding: 24, marginBottom: 14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 14 }}>
          <div className="label-tag">CONSUMPTION · LAST 6 MONTHS</div>
          <span className="badge b-info">avg 14 kL / month</span>
        </div>
        {/* Bar chart */}
        <div style={{ display:'flex', alignItems:'flex-end', gap: 14, height: 180, marginTop: 14 }}>
          {[
            { m: 'Nov', v: 12 },
            { m: 'Dec', v: 13 },
            { m: 'Jan', v: 15 },
            { m: 'Feb', v: 14 },
            { m: 'Mar', v: 16 },
            { m: 'Apr', v: 14, current: true },
          ].map(b => (
            <div key={b.m} style={{ flex: 1, display:'flex', flexDirection:'column', alignItems:'center', gap: 8 }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize: 14, color: 'var(--ink-500)', fontWeight: 600 }}>{b.v} kL</div>
              <div style={{ width: '100%', height: `${b.v * 9}px`, background: b.current ? 'var(--dept-water)' : 'color-mix(in oklab, var(--dept-water) 35%, white)', borderRadius: '10px 10px 4px 4px' }}/>
              <div className="meta" style={{ fontFamily:'var(--font-mono)', fontSize: 13 }}>{b.m}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Current bill */}
      <div className="card" style={{ padding: 24, marginBottom: 14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <div className="label-tag">CURRENT BILL · APR 2026</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize: 56, fontWeight: 800, color:'var(--indigo-900)', letterSpacing:'-0.03em', lineHeight: 1, marginTop: 8 }}>₹ 412</div>
            <div className="meta" style={{ marginTop: 6 }}>14 kL × ₹ 22 + fixed ₹ 75 + sewer ₹ 29</div>
          </div>
          <span className="badge b-warn">DUE 04 MAY</span>
        </div>
      </div>

      <div style={{ display:'flex', gap: 12 }}>
        <button className="btn btn-ghost" style={{ flex: 1, minHeight: 80 }}><II d={icc.doc} size={22}/> View bill PDF</button>
        <button className="btn btn-pri" style={{ flex: 2, minHeight: 80 }}>Pay ₹ 412 now <II d={icc.arrow} size={22}/></button>
      </div>
    </VK_>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 24. HEALTHCARE
// ═══════════════════════════════════════════════════════════════════
function VHealth() {
  const hospitals = [
    { n: 'GMCH · Bhangagarh', t: 'Govt Multi-speciality', d: '0.6 km', wait: '24 min', tone: 'b-warn', beds: '14 free' },
    { n: 'Mahendra Mohan Choudhury', t: 'Govt General Hospital', d: '1.4 km', wait: '8 min', tone: 'b-ok', beds: '32 free' },
    { n: 'PHC · Beltola', t: 'Primary Health Centre', d: '2.1 km', wait: '< 5 min', tone: 'b-ok', beds: 'OPD only' },
  ];
  return (
    <VK_ name="Aruna" status={{ aqi: 132 }}>
      <div style={{ marginBottom: 14, display:'flex', alignItems:'center', gap: 18 }}>
        <DD_ color="var(--dept-health)" glyph={icc.heart} size={80} isz={40}/>
        <div>
          <div className="label-tag">HEALTH · স্বাস্থ্য</div>
          <h2 className="h3" style={{ marginTop: 4 }}>Healthcare Services</h2>
        </div>
      </div>

      {/* AQI advisory */}
      <div className="card" style={{ padding: 16, display:'flex', alignItems:'center', gap: 14, marginBottom: 14, background:'color-mix(in oklab, var(--warn) 10%, white)', borderColor:'oklch(0.74 0.15 75)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background:'oklch(0.74 0.15 75)', color:'white', display:'grid', placeItems:'center' }}><II d={icc.leaf} size={24}/></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color:'oklch(0.45 0.12 75)' }}>AQI 132 · respiratory advisory</div>
          <div className="meta" style={{ marginTop: 2 }}>Asthma/COPD patients: keep inhaler handy. Children & elderly: limit outdoor exertion 11am–4pm.</div>
        </div>
      </div>

      {/* Schemes */}
      <div style={{ display:'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 16 }}>
        <div className="card" style={{ padding: 20, background:'color-mix(in oklab, var(--saffron-500) 10%, white)', borderColor:'var(--saffron-300)' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 14, marginBottom: 12 }}>
            <DD_ color="var(--saffron-700)" glyph={icc.shield} size={56} isz={28}/>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--indigo-900)' }}>Ayushman Bharat · PMJAY</div>
              <div className="meta">Free cover up to ₹5 lakh / family / year</div>
            </div>
          </div>
          <div className="receipt-row"><span className="k">Cardholder</span><span className="v">Aruna Devi + 4</span></div>
          <div className="receipt-row"><span className="k">Used this year</span><span className="v">₹ 18,200 of ₹ 5,00,000</span></div>
          <button className="btn btn-acc" style={{ width: '100%', marginTop: 14, minHeight: 64, fontSize: 18 }}><II d={icc.qr} size={22}/> Show e-card</button>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="label-tag">QUICK ACCESS</div>
          <div style={{ display:'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <button className="btn btn-quiet" style={{ justifyContent:'flex-start', minHeight: 60, fontSize: 17 }}><II d={icc.calendar} size={20}/> Book OPD</button>
            <button className="btn btn-quiet" style={{ justifyContent:'flex-start', minHeight: 60, fontSize: 17 }}><II d={icc.pill} size={20}/> Order medicine</button>
            <button className="btn btn-quiet" style={{ justifyContent:'flex-start', minHeight: 60, fontSize: 17 }}><II d={icc.doc} size={20}/> Health records</button>
            <button className="btn btn-quiet" style={{ justifyContent:'flex-start', minHeight: 60, fontSize: 17, background:'color-mix(in oklab, var(--err) 12%, white)', color: 'var(--err)' }}><II d={icc.phone} size={20}/> Call 108 ambulance</button>
          </div>
        </div>
      </div>

      {/* Hospital list */}
      <div className="label-tag" style={{ marginBottom: 10 }}>NEARBY HOSPITALS · LIVE OPD WAIT</div>
      <div style={{ display:'flex', flexDirection: 'column', gap: 10 }}>
        {hospitals.map(h => (
          <button key={h.n} className="card" style={{ padding: 18, display:'flex', alignItems:'center', gap: 18, cursor:'pointer' }}>
            <DD_ color="var(--dept-health)" glyph={icc.heart} size={56} isz={28}/>
            <div style={{ flex: 1, textAlign:'left' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color:'var(--indigo-900)' }}>{h.n}</div>
              <div className="meta" style={{ marginTop: 2 }}>{h.t} · {h.d} away</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${h.tone}`}>WAIT {h.wait}</span>
              <div className="meta" style={{ marginTop: 6, fontFamily:'var(--font-mono)' }}>{h.beds}</div>
            </div>
          </button>
        ))}
      </div>
    </VK_>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 25. TRANSPORT
// ═══════════════════════════════════════════════════════════════════
function VTransport() {
  const services = [
    { name: 'Driving Licence', desc: 'New · renewal · address change', g: icc.card, c: 'var(--dept-trans)' },
    { name: 'Vehicle RC', desc: 'Transfer · renewal · NoC', g: icc.doc, c: 'var(--indigo-700)' },
    { name: 'Pay Challan', desc: 'Traffic e-challan · open dues', g: icc.bell, c: 'var(--err)' },
    { name: 'Bus Pass', desc: 'Student · senior · monthly', g: icc.bus, c: 'var(--saffron-700)' },
    { name: 'PUC Certificate', desc: 'Pollution under control', g: icc.leaf, c: 'var(--ok)' },
    { name: 'Permits', desc: 'Commercial · goods · contract', g: icc.cog, c: 'var(--dept-water)' },
  ];
  return (
    <VK_ name="Aruna">
      <div style={{ marginBottom: 16, display:'flex', alignItems:'center', gap: 18 }}>
        <DD_ color="var(--dept-trans)" glyph={icc.bus} size={80} isz={40}/>
        <div>
          <div className="label-tag">TRANSPORT · RTO ASSAM</div>
          <h2 className="h3" style={{ marginTop: 4 }}>Vehicle & Licence</h2>
        </div>
      </div>

      {/* My licence */}
      <div className="card" style={{ padding: 22, marginBottom: 14, background: 'linear-gradient(135deg, var(--indigo-900) 0%, var(--indigo-700) 100%)', color: 'white', borderColor: 'transparent' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--saffron-500)', fontFamily:'var(--font-mono)', textTransform:'uppercase' }}>DIGITAL DRIVING LICENCE</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>Aruna Devi</div>
          </div>
          <span className="badge" style={{ background:'var(--saffron-500)', color:'var(--indigo-900)', fontSize: 11 }}>LMV · MCWG</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'oklch(0.74 0.04 270)', letterSpacing:'0.14em', fontFamily:'var(--font-mono)' }}>DL NO.</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize: 18, fontWeight: 700, marginTop: 4 }}>AS01 2018 0091782</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'oklch(0.74 0.04 270)', letterSpacing:'0.14em', fontFamily:'var(--font-mono)' }}>VALID TO</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize: 18, fontWeight: 700, marginTop: 4 }}>2038 · 11 · 04</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'oklch(0.74 0.04 270)', letterSpacing:'0.14em', fontFamily:'var(--font-mono)' }}>BLOOD</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize: 18, fontWeight: 700, marginTop: 4 }}>B+</div>
          </div>
        </div>
      </div>

      {/* Outstanding challans */}
      <div className="card" style={{ padding: 18, display:'flex', alignItems:'center', gap: 16, marginBottom: 16, borderColor:'var(--err)', borderWidth: 2, background:'color-mix(in oklab, var(--err) 7%, white)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background:'var(--err)', color:'white', display:'grid', placeItems:'center' }}><II d={icc.bell} size={28}/></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color:'var(--err)' }}>1 e-challan pending · ₹ 500</div>
          <div className="meta" style={{ marginTop: 2 }}>AS01 PB 4471 · Helmet violation · 12 Apr · Paltan Bazar</div>
        </div>
        <button className="btn btn-err" style={{ minHeight: 60, fontSize: 18 }}>Pay now</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 12 }}>
        {services.map(s => (
          <button key={s.name} className="tile" style={{ minHeight: 170, padding: 22, gap: 14 }}>
            <DD_ color={s.c} glyph={s.g} size={60} isz={30}/>
            <div>
              <div className="nm" style={{ fontSize: 22 }}>{s.name}</div>
              <div className="sub" style={{ marginTop: 4, fontSize: 16 }}>{s.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </VK_>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 26. SANITATION
// ═══════════════════════════════════════════════════════════════════
function VSanitation() {
  return (
    <VK_ name="Aruna" bg="var(--cream)">
      <div style={{ marginBottom: 16, display:'flex', alignItems:'center', gap: 18 }}>
        <DD_ color="var(--dept-waste)" glyph={icc.trash} size={80} isz={40}/>
        <div>
          <div className="label-tag">SANITATION · GMC SWACHHATA</div>
          <h2 className="h3" style={{ marginTop: 4 }}>Garbage & Sanitation</h2>
        </div>
      </div>

      {/* Today's pickup */}
      <div className="card" style={{ padding: 22, marginBottom: 14, background:'color-mix(in oklab, var(--dept-waste) 9%, white)', borderColor:'var(--dept-waste)' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background:'var(--dept-waste)', color:'white', display:'grid', placeItems:'center' }}><II d={icc.trash} size={32}/></div>
          <div style={{ flex: 1 }}>
            <div className="label-tag" style={{ color: 'var(--dept-waste)' }}>TODAY · WED 29 APR</div>
            <div style={{ fontSize: 26, fontWeight: 800, color:'var(--indigo-900)', marginTop: 4 }}>Wet waste pickup · 09:30</div>
            <div className="meta" style={{ marginTop: 2 }}>Truck GMC-T-1142 · Driver Ramesh · Lane 3 → your gate</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize: 28, fontWeight: 800, color:'var(--dept-waste)', letterSpacing:'-0.02em' }}>in 47 min</div>
            <span className="badge b-ok" style={{ marginTop: 6 }}><II d={icc.dot} size={10}/> ON ROUTE</span>
          </div>
        </div>
      </div>

      {/* Weekly schedule */}
      <div className="card" style={{ padding: 22, marginBottom: 14 }}>
        <div className="label-tag" style={{ marginBottom: 12 }}>YOUR PICKUP SCHEDULE · WARD 14</div>
        <div style={{ display:'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {[
            { d: 'Mon', t: 'Wet', c: 'var(--ok)' },
            { d: 'Tue', t: 'Dry', c: 'var(--saffron-700)' },
            { d: 'Wed', t: 'Wet', c: 'var(--ok)', today: true },
            { d: 'Thu', t: '—', c: 'var(--ink-500)' },
            { d: 'Fri', t: 'Wet', c: 'var(--ok)' },
            { d: 'Sat', t: 'Recyclables', c: 'var(--indigo-700)' },
            { d: 'Sun', t: '—', c: 'var(--ink-500)' },
          ].map(d => (
            <div key={d.d} style={{ background: d.today ? 'var(--indigo-700)' : 'var(--surface-1)', color: d.today ? 'white' : 'var(--ink-700)', borderRadius: 14, padding: '14px 8px', textAlign:'center', border: `1.5px solid ${d.today ? 'var(--indigo-700)' : 'var(--line)'}` }}>
              <div style={{ fontSize: 13, fontFamily:'var(--font-mono)', letterSpacing:'0.12em', textTransform:'uppercase', opacity: 0.7 }}>{d.d}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6, color: d.today ? 'var(--saffron-500)' : d.c }}>{d.t}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 12, marginBottom: 14 }}>
        <button className="tile" style={{ minHeight: 160, padding: 22, gap: 14 }}>
          <DD_ color="var(--err)" glyph={icc.bell} size={60} isz={30}/>
          <div>
            <div className="nm" style={{ fontSize: 22 }}>Report missed pickup</div>
            <div className="sub" style={{ marginTop: 4, fontSize: 16 }}>Photo + GPS · auto-routed to supervisor</div>
          </div>
        </button>
        <button className="tile" style={{ minHeight: 160, padding: 22, gap: 14 }}>
          <DD_ color="var(--saffron-700)" glyph={icc.plus} size={60} isz={30}/>
          <div>
            <div className="nm" style={{ fontSize: 22 }}>Schedule bulk waste</div>
            <div className="sub" style={{ marginTop: 4, fontSize: 16 }}>Old furniture · garden waste · debris</div>
          </div>
        </button>
        <button className="tile" style={{ minHeight: 160, padding: 22, gap: 14 }}>
          <DD_ color="var(--indigo-700)" glyph={icc.pin} size={60} isz={30}/>
          <div>
            <div className="nm" style={{ fontSize: 22 }}>Find nearest dustbin</div>
            <div className="sub" style={{ marginTop: 4, fontSize: 16 }}>Live map · segregation guide</div>
          </div>
        </button>
        <button className="tile" style={{ minHeight: 160, padding: 22, gap: 14 }}>
          <DD_ color="var(--ok)" glyph={icc.star} size={60} isz={30}/>
          <div>
            <div className="nm" style={{ fontSize: 22 }}>Rate today's pickup</div>
            <div className="sub" style={{ marginTop: 4, fontSize: 16 }}>Help improve service · 5-star rating</div>
          </div>
        </button>
      </div>
    </VK_>
  );
}

Object.assign(window, { VGasMenu, VGasBill, VMunicipal, VPropertyTax, VWater, VHealth, VTransport, VSanitation });
