import dynamic from 'next/dynamic';
import Header from './landingpage/components/header.jsx';
import Hero from './landingpage/hero.jsx';
import './landingpage/globals.css';

// Lazy load below-the-fold components for better performance
const TrustedPartners = dynamic(() => import('./landingpage/components/trustedPartners.jsx'), {
  loading: () => <div className="h-32" />,
});
const FlexibleWorkspace = dynamic(() => import('./landingpage/components/flexibleworkspace.jsx'), {
  loading: () => <div className="h-96" />,
});
const AvailableRentals = dynamic(() => import('./landingpage/components/availableRentals.jsx'), {
  loading: () => <div className="h-96" />,
});
const AboutInspire = dynamic(() => import('./landingpage/components/aboutInspire.jsx'), {
  loading: () => <div className="h-96" />,
});
const LocationCta = dynamic(() => import('./landingpage/components/locationCta.jsx'), {
  loading: () => <div className="h-96" />,
});
const Footer = dynamic(() => import('./landingpage/components/footer.jsx'), {
  loading: () => <div className="h-64" />,
});

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
