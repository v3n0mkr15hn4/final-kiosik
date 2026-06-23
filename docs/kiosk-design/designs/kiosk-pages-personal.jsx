// ────────────────────────────────────────────────────────────────────
// SUVIDHA Vertical Kiosk · Personal pages
// Dashboard, Consumer Profile, Family Profile, Mobile Upload,
// Voice Assistant overlay, SOS / Emergency
// ────────────────────────────────────────────────────────────────────
const { I, ic, VK, DD, PhotoStub, Logo } = window;

// ═══════════════════════════════════════════════════════════════════
// 13. DASHBOARD — Personal hub (post-login summary)
// ═══════════════════════════════════════════════════════════════════
function VDashboard() {
  const active = [
    { ref: 'SUV-EL-2026-018472', s: 'New Electricity Connection', step: 'Site inspection · Mar 16', pct: 60, status: 'IN PROGRESS', tone: 'b-warn', c: 'var(--dept-elec)', g: ic.bolt },
    { ref: 'SUV-MN-2026-009127', s: 'Pothole · GS Road junction', step: 'Assigned to JE · Mar 14', pct: 35, status: 'ASSIGNED', tone: 'b-info', c: 'var(--dept-water)', g: ic.drop },
  ];
  const dues = [
    { dept: 'Electricity', amt: 1284, due: 'Apr 28', units: 'APDCL 12-units', c: 'var(--dept-elec)', g: ic.bolt, late: false },
    { dept: 'Water', amt: 412, due: 'May 04', units: 'GMC W-2241', c: 'var(--dept-water)', g: ic.drop, late: false },
    { dept: 'Gas refill', amt: 1090, due: 'Booking', units: 'Cyl · 14.2 kg', c: 'var(--dept-gas)', g: ic.flame, late: false },
  ];
  return (
    <VK name="Aruna" bg="var(--cream)" status={{ aqi: 132, temp: 28 }}>
      {/* Welcome */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: 22 }}>
        <div>
          <div className="label-tag" style={{ color: 'var(--saffron-700)' }}>স্বাগতম · WELCOME BACK</div>
          <h1 className="h2" style={{ marginTop: 8 }}>Hello, Aruna</h1>
          <p className="body-l" style={{ marginTop: 6 }}>You have <strong style={{color:'var(--indigo-700)'}}>2 active requests</strong> and <strong style={{color:'var(--err)'}}>3 bills due</strong></p>
        </div>
        <div style={{ display:'flex', gap: 10 }}>
          <span className="badge b-info"><I d={ic.dot} size={10}/> SESSION · 04:21</span>
        </div>
      </div>

      {/* Air quality alert because AQI=132 (Moderate) */}
      <div className="card" style={{ padding: 18, display:'flex', alignItems:'center', gap: 16, marginBottom: 18, borderColor:'oklch(0.74 0.15 75)', background: 'color-mix(in oklab, var(--warn) 10%, white)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background:'oklch(0.74 0.15 75)', color:'white', display:'grid', placeItems:'center', flexShrink:0 }}><I d={ic.leaf} size={28}/></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'oklch(0.45 0.12 75)' }}>Air quality is Moderate today</div>
          <div className="meta" style={{ marginTop: 2 }}>Sensitive groups should reduce prolonged outdoor exertion. Source: CPCB · Guwahati</div>
        </div>
        <button className="btn btn-ghost" style={{ minHeight: 56, fontSize: 16, padding: '14px 22px' }}>Health tips</button>
      </div>

      {/* Active requests */}
      <div className="label-tag" style={{ marginBottom: 12 }}>YOUR ACTIVE REQUESTS</div>
      <div style={{ display: 'flex', flexDirection:'column', gap: 14, marginBottom: 24 }}>
        {active.map(a => (
          <div key={a.ref} className="card" style={{ padding: 22, display: 'flex', gap: 20, alignItems:'center', borderLeft: `6px solid ${a.c}` }}>
            <DD color={a.c} glyph={a.g} size={72} isz={36}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems:'baseline', gap: 12 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color:'var(--indigo-900)' }}>{a.s}</div>
                <span className={`badge ${a.tone}`} style={{ fontSize: 11 }}>{a.status}</span>
              </div>
              <div className="meta" style={{ fontFamily:'var(--font-mono)', marginTop: 4 }}>{a.ref} · {a.step}</div>
              <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, marginTop: 12, overflow:'hidden' }}>
                <div style={{ height: '100%', width: `${a.pct}%`, background: a.c, borderRadius: 4 }}/>
              </div>
            </div>
            <I d={ic.arrow} size={32}/>
          </div>
        ))}
      </div>

      {/* Bills due */}
      <div className="label-tag" style={{ marginBottom: 12 }}>BILLS DUE</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
        {dues.map(d => (
          <div key={d.dept} className="card" style={{ padding: 22, display:'flex', flexDirection:'column', gap: 12, cursor:'pointer' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <DD color={d.c} glyph={d.g} size={56} isz={28}/>
              <span className="label-tag">DUE {d.due}</span>
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize: 30, fontWeight: 800, color:'var(--indigo-900)', letterSpacing:'-0.02em' }}>₹ {d.amt.toLocaleString('en-IN')}</div>
              <div className="meta" style={{ marginTop: 2 }}>{d.dept} · {d.units}</div>
            </div>
            <button className="btn btn-pri" style={{ minHeight: 60, fontSize: 18, padding: '14px 20px' }}>Pay <I d={ic.arrow} size={20}/></button>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="label-tag" style={{ marginBottom: 12 }}>QUICK ACTIONS</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 12 }}>
        {[
          { l: 'All services', g: ic.cog, c: 'var(--indigo-700)' },
          { l: 'File complaint', g: ic.bell, c: 'var(--err)' },
          { l: 'Schemes', g: ic.star, c: 'var(--saffron-700)' },
          { l: 'Family', g: ic.family, c: 'var(--dept-health)' },
        ].map(q => (
          <button key={q.l} className="card" style={{ padding: 20, display:'flex', flexDirection:'column', alignItems:'flex-start', gap: 12, cursor:'pointer', minHeight: 130 }}>
            <DD color={q.c} glyph={q.g} size={56} isz={28}/>
            <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--indigo-900)' }}>{q.l}</div>
          </button>
        ))}
      </div>
    </VK>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 14. CONSUMER PROFILE — Personal details (editable view)
// ═══════════════════════════════════════════════════════════════════
function VProfile() {
  const linked = [
    { c: 'var(--dept-elec)', g: ic.bolt, name: 'APDCL · Bhangagarh', no: 'CA No. 41202277831', ok: true },
    { c: 'var(--dept-water)', g: ic.drop, name: 'GMC Water · W-2241', no: 'Conn 2017-W-77129', ok: true },
    { c: 'var(--dept-gas)', g: ic.flame, name: 'Assam Gas · Dom-14.2', no: 'Cons. 9012-77', ok: true },
    { c: 'var(--dept-health)', g: ic.heart, name: 'PMJAY · Ayushman card', no: 'AYU 4112-9981-2203', ok: true },
  ];
  return (
    <VK name="Aruna">
      <div style={{ marginBottom: 18 }}>
        <div className="label-tag">YOUR PROFILE</div>
        <h2 className="h3" style={{ marginTop: 6 }}>Personal Details</h2>
      </div>

      {/* Identity card */}
      <div className="card" style={{ padding: 28, display:'flex', alignItems:'center', gap: 24, marginBottom: 18 }}>
        <div style={{ width: 132, height: 132, borderRadius: 28, background:'var(--saffron-100)', border:'2px solid var(--saffron-300)', display:'grid', placeItems:'center', flexShrink:0, color:'var(--saffron-700)', fontWeight: 800, fontSize: 56, fontFamily:'var(--font-ui)' }}>AD</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color:'var(--indigo-900)', letterSpacing:'-0.01em' }}>Aruna Devi</div>
          <div className="body" style={{ marginTop: 4 }}>Age 34 · Female · Married</div>
          <div className="meta" style={{ marginTop: 8, fontFamily:'var(--font-mono)' }}>Aadhaar XXXX-XXXX-7777 · Verified · DPDP-compliant lookup</div>
          <div style={{ display:'flex', gap: 10, marginTop: 12 }}>
            <span className="badge b-ok"><I d={ic.check} size={14}/> KYC VERIFIED</span>
            <span className="badge b-info">৬ ভাষা · 6 LANGUAGES</span>
          </div>
        </div>
        <button className="btn btn-ghost" style={{ minHeight: 60, fontSize: 18, padding:'14px 22px' }}><I d={ic.edit} size={20}/> Edit</button>
      </div>

      {/* Address + Contact */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="label-tag">RESIDENTIAL ADDRESS</div>
          <div style={{ fontSize: 22, fontWeight: 600, color:'var(--ink-900)', marginTop: 8, lineHeight: 1.35 }}>House 24, GS Road,<br/>Bhangagarh, Guwahati<br/>Assam — 781005</div>
          <div className="meta" style={{ marginTop: 10, fontFamily:'var(--font-mono)' }}>26.1445° N · 91.7362° E</div>
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div className="label-tag">CONTACT</div>
          <div style={{ display:'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background:'var(--surface-2)', color:'var(--ink-700)', display:'grid', placeItems:'center' }}><I d={ic.phone} size={18}/></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 20, fontFamily:'var(--font-mono)' }}>+91 98765 41234</div>
                <div className="meta">Primary · SMS enabled</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background:'var(--surface-2)', color:'var(--ink-700)', display:'grid', placeItems:'center' }}><I d={ic.bell} size={18}/></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 20 }}>aruna.devi@dakghar.in</div>
                <div className="meta">DigiLocker linked</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Linked services */}
      <div className="label-tag" style={{ marginBottom: 10 }}>LINKED SERVICE ACCOUNTS · 4</div>
      <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        {linked.map(l => (
          <div key={l.no} className="card" style={{ padding: 18, display:'flex', gap: 14, alignItems:'center' }}>
            <DD color={l.c} glyph={l.g} size={52} isz={26}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color:'var(--indigo-900)' }}>{l.name}</div>
              <div className="meta" style={{ fontFamily:'var(--font-mono)', marginTop: 2, fontSize: 13 }}>{l.no}</div>
            </div>
            <I d={ic.check} size={20} sw={3}/>
          </div>
        ))}
      </div>

      {/* Privacy strip */}
      <div className="card" style={{ padding: 18, display:'flex', alignItems:'center', gap: 16, background:'var(--indigo-100)', borderColor:'var(--indigo-300)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background:'var(--indigo-700)', color:'white', display:'grid', placeItems:'center' }}><I d={ic.shield} size={24}/></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color:'var(--indigo-900)' }}>Your data is encrypted & private</div>
          <div className="meta" style={{ marginTop: 2 }}>DPDP Act 2023 compliant · Session erases on logout · No third-party sharing</div>
        </div>
      </div>
    </VK>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 15. FAMILY PROFILE — Linked dependents
// ═══════════════════════════════════════════════════════════════════
function VFamily() {
  const fam = [
    { name: 'Bipul Devi', rel: 'Spouse', age: 38, link: 'XXXX-XXXX-3382', avatar: 'BD', schemes: 2, c: 'var(--indigo-700)' },
    { name: 'Anushka', rel: 'Daughter', age: 9, link: 'XXXX-XXXX-9912', avatar: 'AN', schemes: 1, c: 'var(--saffron-700)' },
    { name: 'Rohan',   rel: 'Son',     age: 6, link: 'XXXX-XXXX-4471', avatar: 'RO', schemes: 1, c: 'var(--dept-water)' },
    { name: 'Lalita Devi', rel: 'Mother-in-law', age: 67, link: 'XXXX-XXXX-2210', avatar: 'LD', schemes: 4, c: 'var(--dept-health)' },
  ];
  return (
    <VK name="Aruna" bg="var(--cream)">
      <div style={{ marginBottom: 18 }}>
        <div className="label-tag">পরিবার · YOUR FAMILY</div>
        <h2 className="h3" style={{ marginTop: 6 }}>Linked Dependents</h2>
        <p className="body" style={{ marginTop: 6 }}>Manage profiles, file requests on their behalf, see eligibility</p>
      </div>

      {/* Self */}
      <div className="card" style={{ padding: 20, display:'flex', alignItems:'center', gap: 18, marginBottom: 16, background: 'color-mix(in oklab, var(--saffron-500) 8%, white)', borderColor: 'var(--saffron-300)' }}>
        <div style={{ width: 80, height: 80, borderRadius: 22, background:'var(--saffron-500)', color:'var(--indigo-900)', display:'grid', placeItems:'center', flexShrink:0, fontWeight: 800, fontSize: 32 }}>AD</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color:'var(--indigo-900)' }}>Aruna Devi <span className="badge b-ok" style={{ fontSize: 11, marginLeft: 10 }}>YOU · HEAD</span></div>
          <div className="meta" style={{ marginTop: 4 }}>34 · Female · Aadhaar verified · Eligible for 6 schemes</div>
        </div>
        <button className="btn btn-ghost" style={{ minHeight: 56, fontSize: 16, padding:'14px 22px' }}>View self</button>
      </div>

      {/* Family grid */}
      <div className="label-tag" style={{ marginBottom: 10 }}>{fam.length} LINKED MEMBERS</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14, marginBottom: 18 }}>
        {fam.map(m => (
          <button key={m.name} className="card" style={{ padding: 20, display:'flex', alignItems:'center', gap: 16, cursor:'pointer', textAlign:'left' }}>
            <div style={{ width: 70, height: 70, borderRadius: 18, background: `color-mix(in oklab, ${m.c} 22%, white)`, color: m.c, display:'grid', placeItems:'center', flexShrink:0, fontWeight: 800, fontSize: 26 }}>{m.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color:'var(--indigo-900)' }}>{m.name}</div>
              <div className="meta" style={{ marginTop: 2 }}>{m.rel} · {m.age} yrs</div>
              <div className="meta" style={{ fontFamily:'var(--font-mono)', fontSize: 13, marginTop: 4 }}>{m.link}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize: 24, fontWeight: 800, color: m.c }}>{m.schemes}</div>
              <div className="label-tag" style={{ fontSize: 10 }}>SCHEMES</div>
            </div>
          </button>
        ))}
        {/* Add */}
        <button className="card" style={{ padding: 20, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap: 10, cursor:'pointer', border:'2.5px dashed var(--indigo-300)', background:'var(--indigo-100)', color:'var(--indigo-700)', minHeight: 130 }}>
          <I d={ic.plus} size={40}/>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Link a family member</div>
          <div className="meta" style={{ color:'var(--indigo-700)' }}>via Aadhaar or birth certificate</div>
        </button>
      </div>

      {/* Combined eligibility */}
      <div className="card" style={{ padding: 22, display:'flex', alignItems:'center', gap: 18, background:'var(--indigo-900)', color:'white', borderColor:'transparent' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background:'var(--saffron-500)', color:'var(--indigo-900)', display:'grid', placeItems:'center' }}><I d={ic.star} size={32}/></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 20 }}>Household eligible for <span style={{ color: 'var(--saffron-500)' }}>14 schemes</span></div>
          <div style={{ marginTop: 4, color: 'oklch(0.80 0.04 270)', fontSize: 16 }}>Combined family income & dependents qualify you for additional benefits</div>
        </div>
        <button className="btn btn-acc" style={{ minHeight: 60, fontSize: 18 }}>View all <I d={ic.arrow} size={20}/></button>
      </div>
    </VK>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 16. MOBILE UPLOAD — Phone-companion QR for documents
// ═══════════════════════════════════════════════════════════════════
function VMobileUpload() {
  return (
    <VK name="Aruna">
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <span className="label-tag">SECURE COMPANION FLOW</span>
        <h2 className="h3" style={{ marginTop: 6 }}>Upload from your Phone</h2>
        <p className="body" style={{ marginTop: 8 }}>Scan the QR · use your phone camera · documents land directly in your application</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.05fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* QR card */}
        <div className="card" style={{ padding: 24, display:'flex', flexDirection:'column', alignItems:'center', gap: 16, background:'var(--indigo-100)', borderColor:'var(--indigo-300)' }}>
          <div style={{ width: 320, height: 320, borderRadius: 24, background: 'white', padding: 18, boxShadow: 'var(--shadow-2)' }}>
            {/* Stylized QR */}
            <div style={{ width: '100%', height: '100%', background: `
              radial-gradient(circle at 20% 20%, var(--indigo-900) 0 36px, transparent 36px),
              radial-gradient(circle at 80% 20%, var(--indigo-900) 0 36px, transparent 36px),
              radial-gradient(circle at 20% 80%, var(--indigo-900) 0 36px, transparent 36px),
              repeating-conic-gradient(var(--indigo-900) 0deg 35deg, white 35deg 70deg),
              repeating-linear-gradient(0deg, var(--indigo-900) 0 8px, white 8px 16px),
              repeating-linear-gradient(90deg, var(--indigo-900) 0 8px, white 8px 16px)
            `, backgroundBlendMode:'normal, normal, normal, multiply, screen, screen', borderRadius: 8, position:'relative' }}>
              {/* logo center */}
              <div style={{ position:'absolute', inset: 0, display:'grid', placeItems:'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: 14, background:'var(--saffron-500)', display:'grid', placeItems:'center', border:'4px solid white' }}>
                  <Logo size={40} primary="var(--indigo-900)" accent="white"/>
                </div>
              </div>
            </div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color:'var(--indigo-900)' }}>Code expires in <span style={{ fontFamily:'var(--font-mono)', color:'var(--err)' }}>04:21</span></div>
            <div className="meta" style={{ marginTop: 4, fontFamily:'var(--font-mono)' }}>SESSION · SUV-UPL-A41-7129</div>
          </div>
          <span className="badge b-ok"><I d={ic.shield} size={14}/> END-TO-END ENCRYPTED</span>
        </div>

        {/* Steps */}
        <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
          {[
            { n: '1', t: 'Open camera on your phone', s: 'No app needed — works with any phone camera or QR scanner' },
            { n: '2', t: 'Point at the QR on screen', s: 'A secure suvidha.gov.in link appears' },
            { n: '3', t: 'Pick or take photo of doc', s: 'PDF, JPG, or PNG · max 5 MB per file' },
            { n: '4', t: 'Upload finishes on kiosk', s: 'You stay on this screen — files arrive automatically' },
          ].map(s => (
            <div key={s.n} className="card" style={{ padding: 18, display:'flex', alignItems:'flex-start', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--indigo-700)', color:'white', display:'grid', placeItems:'center', flexShrink:0, fontFamily:'var(--font-mono)', fontWeight: 700, fontSize: 22 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color:'var(--indigo-900)' }}>{s.t}</div>
                <div className="meta" style={{ marginTop: 4 }}>{s.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload progress */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
          <div className="label-tag">DOCUMENTS RECEIVED · 3 of 5</div>
          <span className="badge b-info"><I d={ic.dot} size={10}/> WAITING FOR 2 MORE</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { n: 'Aadhaar.pdf', s: '1.2 MB', ok: true },
            { n: 'Property_deed.jpg', s: '2.4 MB', ok: true },
            { n: 'Electricity_bill_Mar26.pdf', s: '0.8 MB', ok: true },
            { n: 'Income certificate', s: 'Waiting…', ok: false },
            { n: 'Photograph', s: 'Waiting…', ok: false },
          ].map(d => (
            <div key={d.n} style={{ display: 'flex', alignItems:'center', gap: 14, padding: 12, background: d.ok ? 'color-mix(in oklab, var(--ok) 6%, white)' : 'var(--surface-1)', border: `1px solid ${d.ok ? 'color-mix(in oklab, var(--ok) 30%, white)' : 'var(--line)'}`, borderRadius: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: d.ok ? 'var(--ok)' : 'var(--surface-2)', color: d.ok ? 'white' : 'var(--ink-500)', display:'grid', placeItems:'center', flexShrink:0 }}>
                <I d={d.ok ? ic.check : ic.upload} size={20} sw={3}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 18, color: 'var(--ink-900)' }}>{d.n}</div>
                <div className="meta" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, marginTop: 2 }}>{d.s}</div>
              </div>
              {d.ok && <span className="badge b-ok" style={{ fontSize: 11 }}>VERIFIED</span>}
            </div>
          ))}
        </div>
      </div>
    </VK>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 17. VOICE ASSISTANT — full-screen listening state
// ═══════════════════════════════════════════════════════════════════
function VVoice() {
  return (
    <VK name="Aruna" bg="var(--indigo-900)" showBottom={false}>
      <div style={{ flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-between', color: 'white' }}>
        <div>
          <div className="label-tag" style={{ color: 'var(--saffron-500)' }}>WAKE WORD ACTIVE · TAP TO STOP</div>
          <div style={{ fontSize: 38, fontWeight: 700, color:'white', marginTop: 16, letterSpacing:'-0.01em' }}>"Suvidha, mujhe<br/>bijli ka bill bharna<br/>hai…"</div>
          <div style={{ fontFamily:'Noto Sans Devanagari', color:'oklch(0.80 0.04 270)', fontSize: 26, marginTop: 18, lineHeight: 1.4 }}>"সুবিধা, mujhe bijli ka bill bharna hai…"</div>
        </div>

        {/* Big mic + waves */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 28, padding: '40px 0' }}>
          <div style={{ position:'relative', width: 280, height: 280, display:'grid', placeItems:'center' }}>
            <div style={{ position:'absolute', inset: 0, border:'3px solid color-mix(in oklab, var(--saffron-500) 36%, transparent)', borderRadius:'50%' }}/>
            <div style={{ position:'absolute', inset: 28, border:'3px solid color-mix(in oklab, var(--saffron-500) 56%, transparent)', borderRadius:'50%' }}/>
            <div style={{ position:'absolute', inset: 60, border:'3px solid color-mix(in oklab, var(--saffron-500) 80%, transparent)', borderRadius:'50%' }}/>
            <div style={{ width: 160, height: 160, borderRadius: '50%', background:'var(--saffron-500)', color: 'var(--indigo-900)', display:'grid', placeItems:'center', boxShadow: '0 30px 80px color-mix(in oklab, var(--saffron-500) 40%, transparent)' }}>
              <I d={ic.voice} size={80} sw={2}/>
            </div>
          </div>
          {/* Wave bars */}
          <div style={{ display:'flex', gap: 8, alignItems:'center', height: 56 }}>
            {[24, 38, 56, 30, 48, 56, 22, 40, 34, 52, 28, 42].map((h, i) => (
              <div key={i} style={{ width: 8, height: h, background: 'var(--saffron-500)', borderRadius: 4, opacity: 0.6 + (i%3)*0.13 }}/>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <div className="label-tag" style={{ color: 'oklch(0.74 0.04 270)' }}>YOU CAN ALSO ASK</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {[
              '"Track my last complaint"',
              '"Find nearest gas office"',
              '"What schemes am I eligible for?"',
              '"मेरा घर का बिजली का बिल कितना है"',
            ].map((s, i) => (
              <div key={i} style={{ background: 'color-mix(in oklab, white 8%, transparent)', border: '1.5px solid color-mix(in oklab, white 18%, transparent)', borderRadius: 18, padding: '16px 22px', fontSize: 22, color: 'white', display:'flex', alignItems:'center', gap: 14 }}>
                <I d={ic.voice} size={20}/> {s}
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions inline (no bottom bar because dark) */}
        <div style={{ display:'flex', gap: 12, marginTop: 22 }}>
          <button className="btn btn-acc" style={{ flex: 1, minHeight: 80, fontSize: 20 }}><I d={ic.x} size={22}/> Stop listening</button>
          <button className="btn" style={{ flex: 1, background: 'color-mix(in oklab, white 12%, transparent)', color: 'white', minHeight: 80, fontSize: 20 }}><I d={ic.type} size={22}/> Type instead</button>
        </div>
      </div>
    </VK>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 18. EMERGENCY / SOS detail
// ═══════════════════════════════════════════════════════════════════
function VSOS() {
  return (
    <VK name="Aruna" bg="color-mix(in oklab, var(--err) 7%, white)" showStatus={false} showBottom={false}>
      <div style={{ marginBottom: 16, display:'flex', alignItems:'center', gap: 16 }}>
        <div style={{ width: 80, height: 80, borderRadius:'50%', background: 'var(--err)', color: 'white', display:'grid', placeItems:'center', boxShadow:'0 12px 40px color-mix(in oklab, var(--err) 40%, transparent)' }}>
          <I d={ic.sos} size={44}/>
        </div>
        <div>
          <div className="label-tag" style={{ color: 'var(--err)' }}>EMERGENCY · একটি জরুরি কল করুন</div>
          <h2 className="h3" style={{ color: 'var(--err)', marginTop: 4 }}>Need help now?</h2>
        </div>
      </div>

      {/* Hot lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
        {[
          { n: '112', t: 'Unified Emergency (Police · Fire · Medical)', c: 'var(--err)' },
          { n: '108', t: 'Ambulance', c: 'var(--dept-health)' },
          { n: '101', t: 'Fire Service', c: 'oklch(0.62 0.18 35)' },
          { n: '1091', t: 'Women Helpline · 24×7', c: 'var(--saffron-700)' },
          { n: '1098', t: 'Childline', c: 'var(--indigo-700)' },
        ].map(c => (
          <div key={c.n} className="card" style={{ padding: 20, display:'flex', alignItems:'center', gap: 20, borderLeft: `8px solid ${c.c}` }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: c.c, color:'white', display:'grid', placeItems:'center' }}><I d={ic.phone} size={36}/></div>
            <div style={{ flex: 1, textAlign:'left' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize: 36, fontWeight: 800, color: c.c, letterSpacing:'-0.02em' }}>{c.n}</div>
              <div className="meta" style={{ marginTop: 2 }}>{c.t}</div>
            </div>
            <button className="btn btn-pri" style={{ minHeight: 64, fontSize: 18, padding:'16px 24px' }}>Call now <I d={ic.arrow} size={20}/></button>
          </div>
        ))}
      </div>

      {/* Share location panel */}
      <div className="card" style={{ padding: 22, background:'var(--indigo-900)', color:'white', borderColor:'transparent' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 16, marginBottom: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background:'var(--saffron-500)', color:'var(--indigo-900)', display:'grid', placeItems:'center' }}><I d={ic.pin} size={28}/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 22 }}>Your live location is ready to share</div>
            <div style={{ fontSize: 15, color:'oklch(0.74 0.04 270)', marginTop: 4, fontFamily:'var(--font-mono)' }}>26.1445° N · 91.7362° E · Kiosk #BHN-014 · Bhangagarh</div>
          </div>
        </div>
        <div style={{ display:'flex', gap: 10 }}>
          <button className="btn btn-acc" style={{ flex: 1, minHeight: 64, fontSize: 18 }}><I d={ic.phone} size={20}/> SMS to family</button>
          <button className="btn" style={{ flex: 1, background:'color-mix(in oklab, white 12%, transparent)', color:'white', minHeight: 64, fontSize: 18 }}><I d={ic.qr} size={20}/> Show QR for responder</button>
        </div>
      </div>

      <div style={{ marginTop: 18, display:'flex', gap: 12 }}>
        <button className="btn btn-quiet" style={{ flex: 1, minHeight: 76 }}><I d={ic.back} size={22}/> Back to home</button>
        <button className="btn btn-ghost" style={{ flex: 1, minHeight: 76 }}><I d={ic.voice} size={22}/> Voice assistance</button>
      </div>
    </VK>
  );
}

Object.assign(window, { VDashboard, VProfile, VFamily, VMobileUpload, VVoice, VSOS });
