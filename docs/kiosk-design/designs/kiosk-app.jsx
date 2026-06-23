// ────────────────────────────────────────────────────────────────────
// SUVIDHA Vertical Kiosk · App composer
// ────────────────────────────────────────────────────────────────────
const { DesignCanvas, DCSection, DCArtboard } = window;
const {
  VDashboard, VProfile, VFamily, VMobileUpload, VVoice, VSOS,
  VGasMenu, VGasBill, VMunicipal, VPropertyTax, VWater, VHealth,
  VTransport, VSanitation,
} = window;

function App() {
  const W = 1080, H = 1920;
  return (
    <DesignCanvas
      title="SUVIDHA — Extended Vertical Kiosk · v2"
      subtitle="1080×1920 portrait · Weather + AQI status row · 14 new pages completing the feature set"
    >
      <DCSection id="personal" title="01. Personal · Post-login hub">
        <DCArtboard id="dashboard" label="Dashboard · Active requests · Bills · AQI advisory" width={W} height={H}><VDashboard/></DCArtboard>
        <DCArtboard id="profile"   label="Consumer profile · linked services" width={W} height={H}><VProfile/></DCArtboard>
        <DCArtboard id="family"    label="Family · linked dependents · household eligibility" width={W} height={H}><VFamily/></DCArtboard>
      </DCSection>

      <DCSection id="municipal" title="02. Municipal services">
        <DCArtboard id="municipal"   label="Municipal menu · property · water · certificates" width={W} height={H}><VMunicipal/></DCArtboard>
        <DCArtboard id="property-tax" label="Property tax · assessment & payment" width={W} height={H}><VPropertyTax/></DCArtboard>
        <DCArtboard id="water"       label="Water · usage chart & bill" width={W} height={H}><VWater/></DCArtboard>
        <DCArtboard id="sanitation"  label="Sanitation · live pickup tracking" width={W} height={H}><VSanitation/></DCArtboard>
      </DCSection>

      <DCSection id="utilities" title="03. Gas, Health, Transport">
        <DCArtboard id="gas-menu"   label="Gas menu · refill, bill, safety" width={W} height={H}><VGasMenu/></DCArtboard>
        <DCArtboard id="gas-bill"   label="Gas bill payment" width={W} height={H}><VGasBill/></DCArtboard>
        <DCArtboard id="health"     label="Healthcare · PMJAY · hospital wait" width={W} height={H}><VHealth/></DCArtboard>
        <DCArtboard id="transport"  label="Transport · DL card · challan · permits" width={W} height={H}><VTransport/></DCArtboard>
      </DCSection>

      <DCSection id="system" title="04. System · Cross-cutting flows">
        <DCArtboard id="mobile-upload" label="Mobile upload · phone-companion QR" width={W} height={H}><VMobileUpload/></DCArtboard>
        <DCArtboard id="voice"       label="Voice assistant · listening state" width={W} height={H}><VVoice/></DCArtboard>
        <DCArtboard id="sos"         label="Emergency / SOS detail" width={W} height={H}><VSOS/></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
