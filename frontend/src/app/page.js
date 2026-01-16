import dynamic from 'next/dynamic';
import Header from './landingpage/components/header';
import Hero from './landingpage/hero';
import './landingpage/globals.css';

// Lazy load below-the-fold components for better performance
const TrustedPartners = dynamic(() => import('./landingpage/components/trustedPartners'), {
  loading: () => <div className="h-32" />,
});
const FlexibleWorkspace = dynamic(() => import('./landingpage/components/flexibleworkspace'), {
  loading: () => <div className="h-96" />,
});
const AvailableRentals = dynamic(() => import('./landingpage/components/availableRentals'), {
  loading: () => <div className="h-96" />,
});
const AboutInspire = dynamic(() => import('./landingpage/components/aboutInspire'), {
  loading: () => <div className="h-96" />,
});
const LocationCta = dynamic(() => import('./landingpage/components/locationCta'), {
  loading: () => <div className="h-96" />,
});
const Footer = dynamic(() => import('./landingpage/components/footer'), {
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
