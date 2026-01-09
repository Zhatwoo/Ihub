import Header from './landingpage/components/header';
import Hero from './landingpage/hero';
import TrustedPartners from './landingpage/components/trustedPartners';
import FlexibleWorkspace from './landingpage/components/flexibleworkspace';
import './landingpage/globals.css';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <TrustedPartners />
      <FlexibleWorkspace />
    </div>
  );
}
