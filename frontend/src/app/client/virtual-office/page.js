import VirtualOfficeHeader from './components/header.jsx';
import VirtualOfficeHero from './components/virtualOffice.jsx';
import WhatYouGot from './components/whatYouGot.jsx';
import InquiryForm from './components/inquiryForm.jsx';
import Footer from '../../landingpage/components/footer.jsx';

export default function VirtualOfficePage() {
  return (
    <>
      <VirtualOfficeHeader />
      <VirtualOfficeHero />
      <WhatYouGot>
        <InquiryForm />
      </WhatYouGot>
      <Footer />
    </>
  );
}
