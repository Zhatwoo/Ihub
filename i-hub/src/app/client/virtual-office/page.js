import VirtualOfficeHero from './components/virtualOffice';
import VirtualOfficeHeader from './components/header';
import WhatYouGot from './components/whatYouGot';
import InquiryForm from './components/inquiryForm';
import Footer from '../../landingpage/components/footer';

export default function VirtualOfficePage() {
  return (
    <>
      <VirtualOfficeHeader />
      <VirtualOfficeHero />
      <WhatYouGot>
      </WhatYouGot>
      <InquiryForm />
      <Footer />
    </>
  );
}
