'use strict';

// System templates. Each is a page spec (theme + ordered sections) rendered
// through the section library, so a template opens in the builder as normal
// editable components and AI can modify it like any other page.

const F = {
  name: { label: 'Full name', type: 'text', required: true, width: 'half' },
  phone: { label: 'Mobile number', type: 'tel', required: true, width: 'half' },
  email: { label: 'Email', type: 'email', required: true, width: 'half' },
  city: { label: 'City', type: 'text', required: false, width: 'half' },
  consent: { label: 'I agree to be contacted by phone, email or WhatsApp about this enquiry', name: 'consent', type: 'consent', required: true },
  message: { label: 'Message', type: 'textarea', required: false },
};

const BASE_TEMPLATES = [
  {
    key: 'real-estate',
    name: 'Luxury real estate launch',
    category: 'Real Estate',
    description: 'Project launch with highlights, amenities, gallery, location and a site-visit form.',
    theme: { primary: '#0B3D2E', accent: '#C9A227', dark: '#071F17', font: 'Inter', headingFont: 'Playfair Display' },
    sections: [
      { type: 'navbar', brandName: 'Aurelia Residences', items: [{ title: 'Highlights', href: '#features' }, { title: 'Amenities', href: '#amenities' }, { title: 'Location', href: '#location' }], ctaLabel: 'Book a site visit' },
      { type: 'hero', variant: 'split-form', background: 'gradient', eyebrow: 'New launch · Limited inventory', heading: 'Sky residences with a view that stays with you', subheading: '3 and 4 BHK homes with private decks, a 40,000 sq ft clubhouse and possession from December 2027.', items: [{ icon: '🏆', title: 'RERA registered' }, { icon: '🏦', title: 'Pre-approved loans' }], formTitle: 'Book a private site visit', formSubtitle: 'Our relationship manager will call you within 30 minutes.', formFields: [F.name, F.phone, F.email, { label: 'Preferred configuration', type: 'select', options: ['3 BHK', '4 BHK', 'Penthouse'], required: true }, F.consent], formSubmitLabel: 'Schedule my visit' },
      { type: 'stats', items: [{ value: '4.2 acres', label: 'Landscaped land' }, { value: '86%', label: 'Open space' }, { value: '2', label: 'Towers, 42 floors' }, { value: '₹2.9 Cr*', label: 'Starting price' }] },
      { type: 'features', heading: 'Project highlights', subheading: 'Designed for privacy, light and everyday comfort.', items: [{ icon: '🌇', title: 'Panoramic decks', text: 'Every home has a private deck facing the skyline or the greens.' }, { icon: '🔐', title: '5-tier security', text: 'Smart access, CCTV and a 24x7 command centre.' }, { icon: '⚡', title: 'Ready infrastructure', text: '100% power backup, EV charging and rainwater harvesting.' }] },
      { type: 'media_text', anchorId: 'amenities', variant: 'image-left', eyebrow: 'Amenities', heading: 'A clubhouse that feels like a resort', body: 'Spend weekends at home without missing a thing. The clubhouse is run by a hospitality partner, not a maintenance agency.', items: [{ title: 'Temperature-controlled infinity pool' }, { title: 'Gym, spa and yoga deck' }, { title: "Kids' adventure zone and co-working lounge" }], imagePrompt: 'luxury residential clubhouse infinity pool at dusk, modern architecture, warm lights', ctaLabel: 'Download brochure' },
      { type: 'gallery', heading: 'Take a look inside', items: [{ title: 'Living room', imagePrompt: 'luxury apartment living room with floor to ceiling windows and city view' }, { title: 'Master bedroom', imagePrompt: 'elegant master bedroom in a premium apartment, neutral tones' }, { title: 'Sky deck', imagePrompt: 'private balcony deck of a high rise apartment at sunset' }] },
      { type: 'testimonials', heading: 'What our homeowners say', items: [{ text: 'The site visit was handled beautifully and the pricing was clear from day one.', author: 'Rohan Mehta', role: 'Booked a 4 BHK' }, { text: 'We compared six projects. Aurelia was the only one with this much open space.', author: 'Neha & Arjun', role: 'Homeowners, Tower A' }] },
      { type: 'location', heading: 'Where you will live', address: 'Baner–Pashan Link Road, Pune', body: 'Ten minutes to the IT corridor, close to schools, hospitals and the new metro line.', items: [{ title: 'Metro station: 1.2 km' }, { title: 'International school: 2 km' }, { title: 'Hospital: 3 km' }] },
      { type: 'faq', heading: 'Frequently asked questions', items: [{ title: 'When is possession?', text: 'Tower A possession is scheduled for December 2027 as per the RERA timeline.' }, { title: 'Are home loans available?', text: 'Yes, the project is pre-approved by leading banks.' }, { title: 'Can I visit on weekends?', text: 'Site visits run all seven days from 10 am to 7 pm.' }] },
      { type: 'footer', brandName: 'Aurelia Residences', body: 'RERA No. P52100099999. *Prices are indicative and exclusive of taxes.', items: [{ title: 'Privacy policy' }, { title: 'Terms' }] },
    ],
  },
  {
    key: 'product-launch',
    name: 'Product launch',
    category: 'Product Launch',
    description: 'Bold launch page with features, social proof, pricing and early-access signup.',
    theme: { primary: '#5B21B6', accent: '#22D3EE', dark: '#1E0B3C', font: 'Outfit', headingFont: 'Outfit' },
    sections: [
      { type: 'navbar', brandName: 'Nova', items: [{ title: 'Features', href: '#features' }, { title: 'Pricing', href: '#pricing' }, { title: 'FAQ', href: '#faq' }], ctaLabel: 'Get early access' },
      { type: 'hero', variant: 'split-image', background: 'light', eyebrow: 'Launching this month', heading: 'The smart home hub that just works', subheading: 'Control lights, locks and appliances from one beautiful device. Set up in five minutes, no electrician needed.', ctaLabel: 'Reserve yours', secondaryCtaLabel: 'See features', imagePrompt: 'sleek minimal smart home hub device on a wooden table, soft studio lighting, purple accent' },
      { type: 'logos', heading: 'Works with what you already own', items: [{ title: 'Alexa' }, { title: 'Google Home' }, { title: 'HomeKit' }, { title: 'Philips Hue' }, { title: 'Tuya' }] },
      { type: 'features', heading: 'Everything in one place', items: [{ icon: '⚡', title: '5-minute setup', text: 'Plug it in, scan the code, done.' }, { icon: '🔒', title: 'Private by design', text: 'Automations run locally, not in the cloud.' }, { icon: '🔋', title: 'Saves energy', text: 'Smart schedules cut electricity bills by up to 18%.' }, { icon: '📱', title: 'One app', text: 'Every brand, every room, one app.' }] },
      { type: 'media_text', variant: 'image-right', eyebrow: 'Designed for families', heading: 'Simple enough for everyone at home', body: 'Large tiles, voice control and shared access mean grandparents and kids can use it too.', items: [{ title: 'Guest access in one tap' }, { title: 'Works offline' }, { title: 'Two-year warranty' }], imagePrompt: 'family using a smart home app on a phone in a cozy modern living room' },
      { type: 'pricing', heading: 'Choose your kit', items: [{ title: 'Starter', price: '₹7,999', text: 'Hub + 2 smart plugs', features: ['Hub', '2 smart plugs', 'App access'] }, { title: 'Home', price: '₹14,999', text: 'Best for 2-3 BHK', features: ['Hub', '4 smart plugs', '2 motion sensors', 'Priority support'], featured: true }, { title: 'Pro', price: '₹24,999', text: 'Whole-home automation', features: ['Hub', '8 smart plugs', 'Door lock', 'Installation visit'] }], ctaLabel: 'Reserve' },
      { type: 'lead_form', variant: 'card', heading: 'Get early-bird pricing', subheading: 'Reserve now with no payment. We will confirm your slot by email.', formTitle: 'Reserve your Nova', formFields: [F.name, F.email, F.phone, { label: 'Kit', type: 'select', options: ['Starter', 'Home', 'Pro'], required: true, width: 'half' }, F.consent], formSubmitLabel: 'Reserve now' },
      { type: 'faq', heading: 'Questions', items: [{ title: 'When does it ship?', text: 'First deliveries start in four weeks.' }, { title: 'Is there a subscription?', text: 'No. All features are included.' }] },
      { type: 'footer', brandName: 'Nova Home', body: 'Smart living made simple.' },
    ],
  },
  {
    key: 'event-registration',
    name: 'Event registration',
    category: 'Event Registration',
    description: 'Conference or meetup page with agenda, speakers, countdown and registration.',
    theme: { primary: '#DB2777', accent: '#FBBF24', dark: '#1F0A1A', font: 'Poppins', headingFont: 'Poppins' },
    sections: [
      { type: 'navbar', brandName: 'GrowthCon 2026', items: [{ title: 'Agenda', href: '#features' }, { title: 'Speakers', href: '#speakers' }, { title: 'Venue', href: '#location' }], ctaLabel: 'Register' },
      { type: 'hero', variant: 'background-image', eyebrow: '14 November 2026 · Mumbai', heading: "India's most practical marketing conference", subheading: 'One day, 20 speakers, zero fluff. Leave with playbooks you can use on Monday.', ctaLabel: 'Register now', secondaryCtaLabel: 'View agenda', imagePrompt: 'conference stage with speaker and large audience, dramatic pink and purple lighting' },
      { type: 'countdown', heading: 'Early-bird pricing ends soon', subheading: 'Save 30% on passes booked before the deadline.', ctaLabel: 'Grab early-bird pass' },
      { type: 'features', heading: 'What you will learn', items: [{ icon: '🎯', title: 'Performance marketing', text: 'Campaign structures that cut CAC.' }, { icon: '🤖', title: 'AI in marketing', text: 'Real workflows, not demos.' }, { icon: '📈', title: 'Growth loops', text: 'Retention and referral systems that compound.' }] },
      { type: 'team', anchorId: 'speakers', heading: 'Speakers', items: [{ title: 'Ananya Rao', label: 'CMO, Finverse', imagePrompt: 'professional portrait of an indian woman marketing executive, studio' }, { title: 'Karan Shah', label: 'Head of Growth, Shopwise', imagePrompt: 'professional portrait of an indian man in a blazer, studio' }, { title: 'Meera Iyer', label: 'Founder, Brandcraft', imagePrompt: 'professional portrait of a smiling woman founder, studio' }, { title: 'Dev Malhotra', label: 'VP Marketing, Cloudly', imagePrompt: 'professional portrait of a man tech executive, studio' }] },
      { type: 'lead_form', variant: 'split-text', heading: 'Reserve your seat', body: 'Seats are limited to 600. Your pass includes lunch, networking and all session recordings.', items: [{ title: 'Full-day access' }, { title: 'Networking lunch' }, { title: 'Session recordings' }], formTitle: 'Register', formFields: [F.name, F.email, F.phone, { label: 'Company', type: 'text', required: false, width: 'half' }, { label: 'Pass type', type: 'radio', options: ['Standard', 'VIP'], required: true }, F.consent], formSubmitLabel: 'Confirm registration' },
      { type: 'location', heading: 'Venue', address: 'Jio World Convention Centre, Mumbai', body: 'Bandra Kurla Complex. Parking is available on site.' },
      { type: 'footer', brandName: 'GrowthCon', body: 'Organised by the Growth Collective.' },
    ],
  },
  {
    key: 'webinar',
    name: 'Webinar signup',
    category: 'Webinar',
    description: 'Focused webinar registration with takeaways, host bio and a short form.',
    theme: { primary: '#004AAD', accent: '#F59E0B', font: 'Inter', headingFont: 'Inter' },
    sections: [
      { type: 'hero', variant: 'split-form', background: 'light', eyebrow: 'Free live webinar · Thu, 7 pm IST', heading: 'GST changes for 2026: what every CA firm must do now', subheading: 'A 45-minute walkthrough with a working checklist, plus live Q&A.', items: [{ icon: '🎓', title: 'CPE eligible' }, { icon: '🎥', title: 'Recording included' }], formTitle: 'Save your seat', formFields: [F.name, F.email, F.phone, { label: 'Firm name', type: 'text', required: false, width: 'half' }, F.consent], formSubmitLabel: 'Register free' },
      { type: 'features', heading: "What you'll take away", items: [{ icon: '✅', title: 'Compliance checklist', text: 'A ready template for every client.' }, { icon: '📅', title: 'Filing timeline', text: 'Every new due date, in one view.' }, { icon: '💬', title: 'Live Q&A', text: 'Bring your trickiest client cases.' }] },
      { type: 'media_text', variant: 'image-left', eyebrow: 'Your host', heading: 'CA Priya Nair', body: '15 years in indirect tax and advisor to 300+ firms. Priya has trained over 20,000 professionals on GST.', imagePrompt: 'professional portrait of an indian woman chartered accountant in an office' },
      { type: 'cta', variant: 'band', heading: 'Seats fill up fast', subheading: 'Register now and get the recording even if you miss it live.', ctaLabel: 'Register free' },
      { type: 'footer', brandName: 'TaxPro Academy' },
    ],
  },
  {
    key: 'corporate',
    name: 'Corporate services',
    category: 'Corporate',
    description: 'Clean corporate profile with services, numbers, clients and a contact form.',
    theme: { primary: '#0F3D91', accent: '#10B981', dark: '#0A1A33', font: 'DM Sans', headingFont: 'DM Sans' },
    sections: [
      { type: 'navbar', brandName: 'Meridian Consulting', items: [{ title: 'Services', href: '#features' }, { title: 'About', href: '#about' }, { title: 'Contact', href: '#contact' }], ctaLabel: 'Talk to us' },
      { type: 'hero', variant: 'split-image', background: 'light', eyebrow: 'Strategy · Technology · Operations', heading: 'We help enterprises move faster with less risk', subheading: 'Advisory and delivery teams that have run transformations for 120+ companies across 14 countries.', ctaLabel: 'Book a consultation', secondaryCtaLabel: 'Our services', imagePrompt: 'modern corporate office building glass facade at sunset' },
      { type: 'logos', heading: 'Trusted by leading teams', items: [{ title: 'Tata' }, { title: 'Infosys' }, { title: 'HDFC' }, { title: 'Mahindra' }, { title: 'Wipro' }] },
      { type: 'features', heading: 'Services', items: [{ icon: '🧭', title: 'Strategy', text: 'Market entry, portfolio and growth strategy.' }, { icon: '☁️', title: 'Digital & cloud', text: 'Modernisation without disrupting operations.' }, { icon: '⚙️', title: 'Operations', text: 'Cost, process and supply-chain excellence.' }] },
      { type: 'stats', background: 'primary', items: [{ value: '120+', label: 'Enterprise clients' }, { value: '14', label: 'Countries' }, { value: '25 yrs', label: 'Experience' }, { value: '96%', label: 'Repeat business' }] },
      { type: 'media_text', anchorId: 'about', variant: 'image-right', heading: 'Senior people on every engagement', body: 'Our partners stay hands-on from kickoff to handover. No bait-and-switch with junior teams.', imagePrompt: 'diverse business team in a meeting room discussing strategy on a whiteboard' },
      { type: 'lead_form', variant: 'split-text', heading: 'Start a conversation', body: 'Tell us about your challenge. A partner will respond within one business day.', formTitle: 'Contact us', formFields: [F.name, { label: 'Work email', type: 'email', required: true, width: 'half' }, { label: 'Company', type: 'text', required: true, width: 'half' }, F.phone, F.message, F.consent], formSubmitLabel: 'Send enquiry' },
      { type: 'footer', brandName: 'Meridian Consulting', body: 'Mumbai · Bengaluru · Singapore · London' },
    ],
  },
  {
    key: 'healthcare',
    name: 'Clinic appointment',
    category: 'Healthcare',
    description: 'Healthcare camp or clinic page with doctors, process and booking slots.',
    theme: { primary: '#0E7490', accent: '#F97316', dark: '#083344', font: 'Lato', headingFont: 'Poppins' },
    sections: [
      { type: 'navbar', brandName: 'Meridian Clinics', items: [{ title: 'Services', href: '#features' }, { title: 'Doctors', href: '#doctors' }, { title: 'Location', href: '#location' }], ctaLabel: 'Book appointment' },
      { type: 'hero', variant: 'split-form', background: 'alt', eyebrow: 'Free checkup camp · This Saturday', heading: 'Free dental checkup for your whole family', subheading: 'Walk in between 9 am and 5 pm, or book a slot now and skip the queue.', items: [{ icon: '⭐', title: '4.8 rating' }, { icon: '🦷', title: '9,400+ patients' }], formTitle: 'Book your slot', formSubtitle: 'Confirmation on WhatsApp right away.', formFields: [F.name, { label: 'WhatsApp number', type: 'tel', required: true, width: 'half', otp: true }, { label: 'Clinic', type: 'select', options: ['Kothrud', 'Baner', 'Viman Nagar'], required: true, width: 'half' }, { label: 'Preferred day', type: 'date', required: true, width: 'half' }, F.consent], formSubmitLabel: 'Confirm booking' },
      { type: 'steps', heading: 'How the camp works', items: [{ title: 'Book a slot', text: 'Pick a clinic and a time that suits you.' }, { title: 'Walk in', text: 'Show the WhatsApp confirmation at the desk.' }, { title: 'Get your report', text: 'A written report the same day, free.' }] },
      { type: 'features', heading: 'What the checkup covers', items: [{ icon: '🔍', title: 'Full oral exam', text: 'Cavity, gum and hygiene check by a senior dentist.' }, { icon: '🩻', title: 'Digital X-ray', text: 'One free X-ray if the dentist asks for it.' }, { icon: '📋', title: 'Treatment quote', text: 'A clear price before anything is done.' }] },
      { type: 'team', anchorId: 'doctors', heading: 'Our doctors', items: [{ title: 'Dr. Anil Bhave', label: 'Orthodontist, 18 yrs', imagePrompt: 'portrait of an indian male dentist in a white coat in a clinic' }, { title: 'Dr. Sana Qureshi', label: 'Endodontist, 12 yrs', imagePrompt: 'portrait of an indian female dentist smiling in a clinic' }, { title: 'Dr. Rahul Joshi', label: 'Pediatric dentist, 9 yrs', imagePrompt: 'portrait of a young male pediatric dentist with friendly smile' }] },
      { type: 'testimonials', items: [{ text: 'Booked on WhatsApp in a minute and walked in without waiting. The report came the same evening.', author: 'Anita Deshmukh', role: 'Patient, Kothrud' }, { text: 'Very gentle with my kids and explained everything clearly.', author: 'Imran Shaikh', role: 'Parent, Baner' }] },
      { type: 'faq', heading: 'Common questions', items: [{ title: 'Is the checkup really free?', text: 'Yes. Treatment is priced separately and always quoted first.' }, { title: 'Can I bring my parents?', text: 'Please book one slot per person so the dentist has time for each.' }] },
      { type: 'location', heading: 'Our clinics', address: 'Kothrud, Pune', body: 'Kothrud, Baner and Viman Nagar. Open 9 am to 8 pm, all days.' },
      { type: 'footer', brandName: 'Meridian Clinics', body: 'Registered with the Maharashtra Dental Council.' },
    ],
  },
  {
    key: 'education',
    name: 'Course admissions',
    category: 'Education',
    description: 'Admissions page with program outcomes, curriculum, fees and counselling form.',
    theme: { primary: '#1D4ED8', accent: '#F59E0B', dark: '#0B1A3F', font: 'Poppins', headingFont: 'Poppins' },
    sections: [
      { type: 'navbar', brandName: 'Brightpath Academy', items: [{ title: 'Program', href: '#features' }, { title: 'Fees', href: '#pricing' }, { title: 'FAQ', href: '#faq' }], ctaLabel: 'Apply now' },
      { type: 'hero', variant: 'split-image', background: 'light', eyebrow: 'Admissions open · Batch starts 1 Dec', heading: 'Become a job-ready data analyst in 6 months', subheading: 'Live classes, real projects and placement support with 200+ hiring partners.', ctaLabel: 'Book free counselling', secondaryCtaLabel: 'Download syllabus', imagePrompt: 'students learning data analytics in a modern classroom with laptops' },
      { type: 'stats', items: [{ value: '4,800+', label: 'Alumni placed' }, { value: '₹7.2 LPA', label: 'Average package' }, { value: '200+', label: 'Hiring partners' }, { value: '4.7/5', label: 'Learner rating' }] },
      { type: 'features', heading: 'What you will master', items: [{ icon: '📊', title: 'Excel & SQL', text: 'Clean, query and model real business data.' }, { icon: '🐍', title: 'Python', text: 'Automate analysis with pandas and notebooks.' }, { icon: '📈', title: 'Power BI', text: 'Dashboards hiring managers want to see.' }] },
      { type: 'pricing', heading: 'Program fees', items: [{ title: 'Self-paced', price: '₹29,999', text: 'Recorded + doubt support', features: ['All recordings', 'Projects', 'Certificate'] }, { title: 'Live cohort', price: '₹59,999', text: 'Most chosen', features: ['Live classes', 'Mentor reviews', 'Placement support'], featured: true }], ctaLabel: 'Enroll' },
      { type: 'lead_form', variant: 'split-text', heading: 'Talk to a career counsellor', body: 'Get a personalised plan based on your background. EMI options available.', formTitle: 'Book free counselling', formFields: [F.name, F.phone, F.email, { label: 'Current status', type: 'select', options: ['Student', 'Working professional', 'Career break'], required: true, width: 'half' }, F.consent], formSubmitLabel: 'Book my session', formSteps: [] },
      { type: 'faq', heading: 'FAQ', items: [{ title: 'Do I need a coding background?', text: 'No. We start from the basics.' }, { title: 'Is there an EMI option?', text: 'Yes, no-cost EMI up to 12 months.' }] },
      { type: 'footer', brandName: 'Brightpath Academy' },
    ],
  },
  {
    key: 'lead-generation',
    name: 'Loan enquiry (multi-step)',
    category: 'Lead Generation',
    description: 'High-converting multi-step lead form for financial products with trust signals.',
    theme: { primary: '#004AAD', accent: '#16A34A', dark: '#04172F', font: 'Inter', headingFont: 'Inter' },
    sections: [
      { type: 'hero', variant: 'split-form', background: 'gradient', eyebrow: 'Personal loans up to ₹25 lakh', heading: 'Instant approval. Money in your account in 24 hours.', subheading: 'Interest from 10.49% p.a. Minimal documents, 100% digital process.', items: [{ icon: '⚡', title: 'Approval in 10 min' }, { icon: '🔒', title: 'Bank-grade security' }], formTitle: 'Check your eligibility', formSubtitle: 'It takes less than a minute and does not affect your credit score.', formSteps: ['About you', 'Loan details'], formFields: [{ ...F.name, step: 1 }, { label: 'Mobile number', type: 'tel', required: true, width: 'half', otp: true, step: 1 }, { label: 'Pincode', type: 'pincode', required: true, width: 'half', step: 1 }, { label: 'Loan amount', type: 'select', options: ['Up to ₹2 lakh', '₹2–5 lakh', '₹5–10 lakh', 'Above ₹10 lakh'], required: true, step: 2 }, { label: 'Employment type', type: 'radio', options: ['Salaried', 'Self-employed'], required: true, step: 2 }, { label: 'Monthly income', type: 'number', required: true, width: 'half', step: 2 }, { ...F.consent, step: 2 }], formSubmitLabel: 'Check eligibility' },
      { type: 'steps', heading: 'Three steps to your loan', items: [{ title: 'Check eligibility', text: 'Share basic details in under a minute.' }, { title: 'Upload documents', text: 'PAN, Aadhaar and salary slips, all online.' }, { title: 'Get the money', text: 'Funds are disbursed within 24 hours of approval.' }] },
      { type: 'features', heading: 'Why borrowers choose us', items: [{ icon: '💸', title: 'No hidden charges', text: 'Every fee shown upfront.' }, { icon: '📆', title: 'Flexible tenure', text: 'Repay in 12 to 60 months.' }, { icon: '🏦', title: 'RBI-registered', text: 'Regulated NBFC partners.' }] },
      { type: 'testimonials', items: [{ text: 'Got approved the same day and the EMI fits my budget.', author: 'Sandeep K.', role: 'Salaried, Pune' }, { text: 'No branch visits at all. Everything was on my phone.', author: 'Farah S.', role: 'Business owner, Mumbai' }] },
      { type: 'faq', heading: 'FAQ', items: [{ title: 'Will checking eligibility affect my credit score?', text: 'No. We run a soft check only.' }, { title: 'What documents are needed?', text: 'PAN, Aadhaar, and income proof.' }] },
      { type: 'footer', brandName: 'QuickCredit', body: 'Loans are provided by RBI-registered lending partners subject to credit approval.' },
    ],
  },
  {
    key: 'service-business',
    name: 'Local service business',
    category: 'Service Business',
    description: 'For service providers: services, process, reviews, service areas and a callback form.',
    theme: { primary: '#B45309', accent: '#0EA5E9', dark: '#2A1606', font: 'Montserrat', headingFont: 'Montserrat' },
    sections: [
      { type: 'navbar', brandName: 'SparkleHome Services', items: [{ title: 'Services', href: '#features' }, { title: 'Reviews', href: '#reviews' }], ctaLabel: 'Get a quote' },
      { type: 'hero', variant: 'split-image', background: 'light', eyebrow: 'Same-day service across the city', heading: 'Home cleaning and repairs by verified professionals', subheading: 'Background-checked experts, fixed prices and a 30-day service guarantee.', ctaLabel: 'Book a service', secondaryCtaLabel: 'View services', imagePrompt: 'professional home cleaner in uniform cleaning a bright modern kitchen' },
      { type: 'features', heading: 'Our services', items: [{ icon: '🧽', title: 'Deep cleaning', text: 'Kitchen, bathroom and full-home packages.' }, { icon: '🔧', title: 'Plumbing', text: 'Leaks, fittings and installations.' }, { icon: '💡', title: 'Electrical', text: 'Wiring, fans, lights and appliances.' }, { icon: '🎨', title: 'Painting', text: 'Interior painting with a free colour consult.' }] },
      { type: 'steps', heading: 'How it works', items: [{ title: 'Request a quote', text: 'Tell us what you need.' }, { title: 'Confirm the slot', text: 'Choose a time that suits you.' }, { title: 'Relax', text: 'Our expert arrives on time, every time.' }] },
      { type: 'testimonials', anchorId: 'reviews', heading: '4.9 stars from 12,000+ customers', items: [{ text: 'They were on time, polite and the kitchen looks brand new.', author: 'Kavya R.', role: 'Indiranagar' }, { text: 'Fixed a leak other plumbers could not find. Fair price.', author: 'Mohit G.', role: 'Whitefield' }, { text: 'Booked at 9 am, done by 2 pm. Amazing.', author: 'Lakshmi P.', role: 'HSR Layout' }] },
      { type: 'lead_form', variant: 'split-text', heading: 'Get a free quote in minutes', body: 'Share the job and we will call back with a fixed price.', items: [{ title: 'No visiting charges' }, { title: '30-day guarantee' }], formTitle: 'Request a callback', formFields: [F.name, F.phone, { label: 'Service', type: 'select', options: ['Deep cleaning', 'Plumbing', 'Electrical', 'Painting'], required: true, width: 'half' }, { label: 'Area / locality', type: 'text', required: true, width: 'half' }, F.consent], formSubmitLabel: 'Call me back' },
      { type: 'footer', brandName: 'SparkleHome Services' },
    ],
  },
  {
    key: 'promo-campaign',
    name: 'Festive offer campaign',
    category: 'Promotional Campaign',
    description: 'Urgency-driven offer page with countdown, product picks and coupon signup.',
    theme: { primary: '#DC2626', accent: '#FACC15', dark: '#2B0606', font: 'Poppins', headingFont: 'Poppins' },
    sections: [
      { type: 'hero', variant: 'background-image', eyebrow: 'Festive sale · This week only', heading: 'Flat 30% off everything you love', subheading: 'Plus an extra 10% for the first 500 customers who claim the coupon.', ctaLabel: 'Claim my coupon', imagePrompt: 'festive diwali sale shopping scene with lights and gift boxes, warm red and gold' },
      { type: 'countdown', heading: 'Offer ends in', subheading: 'The coupon expires at midnight on the last day.', ctaLabel: 'Claim now' },
      { type: 'gallery', heading: 'Bestsellers on sale', items: [{ title: 'Home decor', imagePrompt: 'festive home decor items, lamps and cushions, product photography' }, { title: 'Gift hampers', imagePrompt: 'premium festive gift hamper with sweets and dry fruits' }, { title: 'Ethnic wear', imagePrompt: 'colourful indian ethnic wear on display, product photography' }] },
      { type: 'lead_form', variant: 'card', heading: 'Get your extra 10% coupon', subheading: 'We will send the code by WhatsApp and email instantly.', formTitle: 'Claim coupon', formFields: [F.name, F.phone, F.email, F.consent], formSubmitLabel: 'Send my coupon', successMessage: 'Your coupon is on its way! Check WhatsApp in a minute.' },
      { type: 'faq', heading: 'Offer terms', items: [{ title: 'Can I combine coupons?', text: 'The extra 10% applies on top of the 30% sale price.' }, { title: 'Is it valid in stores?', text: 'Yes, show the coupon at any store billing counter.' }] },
      { type: 'footer', brandName: 'Shopwise', legal: 'T&C apply. Offer valid while stocks last.' },
    ],
  },
];

// Two more per category (generated once, stored as data).
const TEMPLATES = [...BASE_TEMPLATES, ...require('./templates.extra'), ...require('./templates.banking')];

const list = () =>
  TEMPLATES.map(({ key, name, category, description, theme, sections }) => ({
    key,
    name,
    category,
    description,
    theme,
    sectionTypes: sections.map((s) => s.type),
  }));

const get = (key) => TEMPLATES.find((t) => t.key === key) || null;

module.exports = { TEMPLATES, list, get };
