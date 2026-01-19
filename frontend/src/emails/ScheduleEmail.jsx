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

export default function ScheduleEmail({ fullName, email }) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>New Meeting Schedule Request</Heading>
            <Text style={subtitle}>
              Someone has requested to schedule a meeting
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
          </Section>

          <Section style={messageSection}>
            <Text style={messageText}>
              Please contact this person to schedule a meeting.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This request was submitted through the Inspire Hub website.
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

const messageSection = {
  padding: '20px 24px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  margin: '0 24px',
};

const messageText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center',
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
