import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Row,
  Column,
} from '@react-email/components';

export default function InquiryEmail({ 
  fullName, 
  email, 
  phoneNumber, 
  company, 
  position, 
  preferredStartDate 
}) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>New Virtual Office Inquiry</Heading>
            <Text style={subtitle}>
              You have received a new virtual office inquiry
            </Text>
          </Section>

          <Section style={content}>
            <Row>
              <Column>
                <Text style={label}>Full Name:</Text>
              </Column>
              <Column>
                <Text style={value}>{fullName}</Text>
              </Column>
            </Row>
            <Hr style={divider} />
            
            <Row>
              <Column>
                <Text style={label}>Email:</Text>
              </Column>
              <Column>
                <Text style={value}>{email}</Text>
              </Column>
            </Row>
            <Hr style={divider} />
            
            <Row>
              <Column>
                <Text style={label}>Phone Number:</Text>
              </Column>
              <Column>
                <Text style={value}>{phoneNumber}</Text>
              </Column>
            </Row>
            <Hr style={divider} />
            
            <Row>
              <Column>
                <Text style={label}>Company:</Text>
              </Column>
              <Column>
                <Text style={value}>{company || 'N/A'}</Text>
              </Column>
            </Row>
            <Hr style={divider} />
            
            <Row>
              <Column>
                <Text style={label}>Position:</Text>
              </Column>
              <Column>
                <Text style={value}>{position || 'N/A'}</Text>
              </Column>
            </Row>
            <Hr style={divider} />
            
            <Row>
              <Column>
                <Text style={label}>Preferred Start Date:</Text>
              </Column>
              <Column>
                <Text style={value}>{preferredStartDate || 'Not specified'}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This inquiry was submitted through the Inspire Hub website.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 24px',
  backgroundColor: '#0F766E',
  color: '#ffffff',
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  textAlign: 'center',
};

const subtitle = {
  color: '#e0f2f1',
  fontSize: '14px',
  margin: '0',
  textAlign: 'center',
};

const content = {
  padding: '24px',
};

const label = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const value = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '12px 0',
};

const footer = {
  padding: '24px',
  textAlign: 'center',
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
};
