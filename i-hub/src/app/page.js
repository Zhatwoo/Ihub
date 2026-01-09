import Header from './landingpage/components/header';
import Hero from './landingpage/hero';
import TrustedPartners from './landingpage/components/trustedPartners';
import FlexibleWorkspace from './landingpage/components/flexibleworkspace';
import AboutInspire from './landingpage/components/aboutInspire';
import './landingpage/globals.css';
import AvailableRentals from './landingpage/components/availableRentals';
import LocationCta from './landingpage/components/locationCta';
import Footer from './landingpage/components/footer';
export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <TrustedPartners />
      <FlexibleWorkspace />
      <AvailableRentals />
      <AboutInspire />
      <LocationCta />
      <Footer />
    </div>
  );
}
