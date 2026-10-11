'use strict';

// Additional system templates: two per category on top of templates.js.
// Generated once with Gemini 2.5 Pro through the app's own page generator
// (see services/ai/pageGeneration.service.js), validated by the same rules,
// then reviewed and stored here as static data. Gemini is not called when
// these are used.

module.exports = [
  {
    "key": "real-estate-township",
    "name": "Vistara Homes Pune",
    "category": "Real Estate",
    "description": "Discover affordable 2 and 3 BHK homes in a premium township near Hinjewadi IT Park. Featuring a modern clubhouse, lush green spaces, and att",
    "theme": {
      "primary": "#0D47A1",
      "accent": "#F9A825",
      "dark": "#1A202C",
      "font": "Poppins",
      "headingFont": "Poppins",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "Vistara Homes",
        "items": [
          {
            "title": "Amenities",
            "href": "#amenities"
          },
          {
            "title": "Gallery",
            "href": "#gallery"
          },
          {
            "title": "Location",
            "href": "#location"
          }
        ],
        "ctaLabel": "Book Site Visit",
        "ctaHref": "#lead-form",
        "variant": "simple"
      },
      {
        "type": "hero",
        "variant": "split-form",
        "background": "gradient",
        "eyebrow": "PREMIUM TOWNSHIP LIVING IN PUNE",
        "heading": "Your Dream 2 & 3 BHK Home, Minutes from Hinjewadi IT Park",
        "subheading": "Experience an unmatched lifestyle with a world-class clubhouse, lush landscapes, and exclusive pre-launch EMI offers. Secure your future in Pune's fastest-growing residential hub.",
        "imagePrompt": "A cheerful young Indian couple with a child standing on the spacious balcony of a modern, high-rise apartment. The background shows a sunset over a green, well-planned township. The mood is happy and aspirational.",
        "formId": "lead-form",
        "formTitle": "Schedule Your Site Visit",
        "formSubtitle": "Fill in your details to get a callback and book your exclusive tour.",
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "full"
          },
          {
            "label": "Mobile Number",
            "type": "tel",
            "required": true,
            "width": "half"
          },
          {
            "label": "Email Address",
            "type": "email",
            "required": true,
            "width": "half"
          },
          {
            "label": "I'm interested in",
            "type": "select",
            "required": true,
            "options": [
              "2 BHK Apartment",
              "3 BHK Apartment",
              "Just seeking information"
            ],
            "width": "full"
          },
          {
            "label": "I agree to be contacted by Vistara Homes regarding my enquiry.",
            "type": "consent",
            "required": true,
            "width": "full"
          }
        ],
        "formSubmitLabel": "Book My Visit",
        "successMessage": "Thank you! Our team will contact you shortly to confirm your site visit."
      },
      {
        "type": "logos",
        "background": "alt",
        "heading": "Our Approved Home Loan Partners",
        "items": [
          {
            "title": "HDFC Home Loans"
          },
          {
            "title": "ICICI Bank"
          },
          {
            "title": "State Bank of India"
          },
          {
            "title": "Axis Bank"
          },
          {
            "title": "Bajaj Finserv"
          }
        ]
      },
      {
        "type": "features",
        "variant": "bento",
        "background": "light",
        "heading": "A Lifestyle Designed For You",
        "subheading": "Discover the thoughtfully crafted features that make Vistara Homes the perfect place to live and grow.",
        "items": [
          {
            "icon": "🏢",
            "title": "Close to IT Hubs",
            "text": "Enjoy a shorter commute with Hinjewadi & Baner IT parks just a few minutes' drive away."
          },
          {
            "icon": "🏊",
            "title": "Grand Clubhouse",
            "text": "Unwind at our 25,000 sq.ft. clubhouse with a swimming pool, gym, and indoor games."
          },
          {
            "icon": "🌳",
            "title": "70% Open Space",
            "text": "Breathe easy with acres of landscaped gardens, jogging tracks, and serene green zones."
          },
          {
            "icon": "💳",
            "title": "Flexible EMI Offers",
            "text": "Owning your dream home is easier than ever with our attractive payment plans."
          },
          {
            "icon": "🛡️",
            "title": "Multi-Layer Security",
            "text": "Live with peace of mind thanks to 24/7 CCTV surveillance and gated community security."
          },
          {
            "icon": "🛍️",
            "title": "Convenience at Doorstep",
            "text": "With planned retail spaces and daily necessities within the township, life is simpler here."
          }
        ]
      },
      {
        "type": "media_text",
        "variant": "image-right",
        "background": "alt",
        "id": "amenities",
        "eyebrow": "RESORT-STYLE LIVING",
        "heading": "Every Day Feels Like a Vacation",
        "body": "At Vistara Homes, we believe in providing more than just a home. Our extensive list of amenities is designed to cater to every member of your family, ensuring a life of comfort, recreation, and community bonding.",
        "items": [
          {
            "title": "State-of-the-art Gymnasium"
          },
          {
            "title": "Temperature-controlled Swimming Pool"
          },
          {
            "title": "Dedicated Kids' Play Area & Crèche"
          },
          {
            "title": "Multipurpose Hall for Events"
          },
          {
            "title": "Senior Citizen Sit-out Areas"
          }
        ],
        "imagePrompt": "A stunning photograph of a modern residential clubhouse exterior at dusk, with warm lights glowing from within. The swimming pool in front reflects the building and the sky. A few people are relaxing on lounge chairs.",
        "ctaLabel": "Download Brochure",
        "ctaHref": "#lead-form"
      },
      {
        "type": "gallery",
        "background": "light",
        "id": "gallery",
        "heading": "Step Inside Your Future Home",
        "items": [
          {
            "title": "Spacious Living Room",
            "imagePrompt": "Interior of a bright and airy living room in a modern apartment, with contemporary furniture, large windows showing a green view, and tasteful decor. Natural morning light fills the room."
          },
          {
            "title": "Elegant Master Bedroom",
            "imagePrompt": "A beautifully designed master bedroom with a king-sized bed, elegant lighting fixtures, a walk-in closet space, and a large window with a view of the city skyline at dawn."
          },
          {
            "title": "Modern Modular Kitchen",
            "imagePrompt": "A sleek, modular kitchen with high-end appliances, granite countertops, and ample storage. The space is well-lit and spotlessly clean."
          },
          {
            "title": "Grand Tower Elevation",
            "imagePrompt": "An architectural shot of the modern residential towers from a low angle, highlighting their impressive height and contemporary design against a clear blue sky."
          },
          {
            "title": "Landscaped Gardens",
            "imagePrompt": "A lush, manicured garden within the residential complex, featuring a walking path, colorful flower beds, and benches under shady trees. A family is enjoying a walk."
          },
          {
            "title": "Children's Play Area",
            "imagePrompt": "A safe and vibrant outdoor children's play area with modern equipment like swings and slides. Children are playing happily under the supervision of their parents."
          }
        ]
      },
      {
        "type": "testimonials",
        "background": "dark",
        "heading": "What Our Residents Say",
        "items": [
          {
            "text": "The best decision we made was moving to Vistara Homes. My commute to Hinjewadi is now just 10 minutes! The amenities are fantastic, and my family loves the green, open spaces.",
            "author": "Rohan Sharma",
            "role": "IT Professional & Resident"
          },
          {
            "text": "As a family, we were looking for a safe and community-oriented place. We found it here. The security is top-notch, and the clubhouse is where we spend our weekends. Highly recommended.",
            "author": "Priya Deshpande",
            "role": "Homemaker & Resident"
          },
          {
            "text": "The entire process, from booking to getting our loan approved, was seamless. The sales team was very helpful. The quality of construction is excellent for the price point.",
            "author": "Ankit Gupta",
            "role": "Finance Manager & Resident"
          }
        ]
      },
      {
        "type": "location",
        "background": "light",
        "id": "location",
        "heading": "Perfectly Located for Work-Life Balance",
        "address": "Vistara Homes, Near Maan Village, Hinjewadi Phase 3, Pune, Maharashtra 411057",
        "body": "Strategically located to offer excellent connectivity to Pune's major IT hubs, educational institutions, hospitals, and entertainment zones, while being nestled in a serene, green environment.",
        "items": [
          {
            "title": "Hinjewadi IT Park: 5 Mins"
          },
          {
            "title": "Mumbai-Pune Expressway: 10 Mins"
          },
          {
            "title": "Pristine International School: 12 Mins"
          },
          {
            "title": "LifePoint Multispeciality Hospital: 15 Mins"
          }
        ]
      },
      {
        "type": "faq",
        "background": "alt",
        "heading": "Your Questions, Answered",
        "items": [
          {
            "title": "Is the project RERA registered?",
            "text": "Yes, Vistara Homes is a fully RERA compliant project. The RERA registration number is available on the official Maharashtra RERA portal and will be provided during your site visit."
          },
          {
            "title": "What are the apartment configurations available?",
            "text": "We offer spacious and well-designed 2 BHK and 3 BHK apartments with multiple layout options to suit your family's needs."
          },
          {
            "title": "Do you provide assistance with home loans?",
            "text": "Absolutely. We have tie-ups with all major national banks and financial institutions to help you get the best home loan offers with a hassle-free process."
          },
          {
            "title": "What is the expected possession date?",
            "text": "The project is being developed in phases. Please contact our sales team or schedule a site visit for the most current information on possession dates for different towers."
          },
          {
            "title": "What are the monthly maintenance charges?",
            "text": "The maintenance charges are competitively priced to ensure the upkeep of our world-class amenities and common areas. The exact details will be provided in the allotment letter."
          }
        ]
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "Vistara Homes",
        "body": "Vistara Homes is a project by [Developer Name], committed to creating vibrant communities and quality living spaces in Pune.",
        "legal": "© 2023 Vistara Homes. All Rights Reserved. The content is for informational purposes only. RERA No: P521000XXXXX",
        "items": [
          {
            "title": "Home",
            "href": "#"
          },
          {
            "title": "Amenities",
            "href": "#amenities"
          },
          {
            "title": "Privacy Policy",
            "href": "#"
          },
          {
            "title": "Contact",
            "href": "#lead-form"
          }
        ],
        "variant": "columns"
      }
    ]
  },
  {
    "key": "real-estate-office",
    "name": "Gurugram Office Spaces",
    "category": "Real Estate",
    "description": "Discover premium, fully-managed office spaces in the heart of Gurugram. Designed for ambitious startups and enterprises. Schedule your exclu",
    "theme": {
      "primary": "#D4AF37",
      "accent": "#F0C44D",
      "dark": "#111111",
      "font": "Inter",
      "headingFont": "Outfit",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "dark",
        "brandName": "Prestige Offices",
        "items": [
          {
            "title": "Our Spaces",
            "href": "#gallery"
          },
          {
            "title": "Amenities",
            "href": "#features"
          },
          {
            "title": "Pricing",
            "href": "#lead-form"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Schedule Tour",
        "variant": "centered"
      },
      {
        "type": "hero",
        "variant": "background-image",
        "background": "dark",
        "eyebrow": "PREMIUM OFFICE SPACES IN GURUGRAM",
        "heading": "Your Business Deserves a Better Address",
        "subheading": "Elevate your brand with Grade-A managed offices in Gurugram's most coveted business district. Scalable, secure, and fully serviced.",
        "ctaLabel": "Schedule a Tour",
        "ctaHref": "#lead-form",
        "imagePrompt": "A stunning, wide-angle photograph of a luxurious and modern office building lobby at dusk, with warm interior lighting spilling out onto a sleek, wet pavement. The mood is sophisticated and exclusive."
      },
      {
        "type": "logos",
        "background": "dark",
        "heading": "Powering Gurugram's Most Ambitious Companies",
        "items": [
          {
            "title": "Innovatech"
          },
          {
            "title": "QuantumLeap"
          },
          {
            "title": "FinSolutions"
          },
          {
            "title": "NextGen AI"
          },
          {
            "title": "Growth Partners"
          }
        ]
      },
      {
        "type": "features",
        "variant": "icons",
        "background": "alt",
        "heading": "An Ecosystem Designed for Growth",
        "subheading": "We provide more than just four walls. Our all-inclusive amenities ensure your team can focus on what matters most.",
        "items": [
          {
            "icon": "📍",
            "title": "Prime Location",
            "text": "Situated in the heart of Gurugram's Cyber City, with excellent connectivity and metro access."
          },
          {
            "icon": "🏢",
            "title": "Scalable Spaces",
            "text": "From private cabins for startups to custom-built floors for large enterprises, grow with us."
          },
          {
            "icon": "☕",
            "title": "All-Inclusive Amenities",
            "text": "High-speed internet, gourmet coffee, meeting rooms, and breakout zones are all included."
          },
          {
            "icon": "💻",
            "title": "Tech-Enabled",
            "text": "Seamlessly book resources, manage access, and connect with the community via our app."
          },
          {
            "icon": "🔒",
            "title": "Enterprise-Grade Security",
            "text": "24/7 CCTV surveillance, biometric access, and on-site security personnel for your peace of mind."
          },
          {
            "icon": "🤝",
            "title": "Networking Events",
            "text": "Exclusive access to curated events, workshops, and a community of industry leaders."
          }
        ]
      },
      {
        "type": "media_text",
        "variant": "image-right",
        "background": "light",
        "eyebrow": "FOCUS ON YOUR BUSINESS",
        "heading": "The Ultimate Hassle-Free Managed Office",
        "body": "Forget the complexities of a traditional lease. Our managed offices provide a complete, ready-to-use workspace solution. We handle everything from daily operations and IT infrastructure to housekeeping and utilities, so you can concentrate on driving your business forward from day one.",
        "items": [
          {
            "title": "Fully furnished, premium interiors"
          },
          {
            "title": "Personalized branding and layout options"
          },
          {
            "title": "Dedicated on-site support team"
          },
          {
            "title": "Single, transparent monthly invoice"
          }
        ],
        "ctaLabel": "Enquire Now",
        "ctaHref": "#lead-form",
        "imagePrompt": "A bright, professional photograph of a modern, well-lit private office cabin with ergonomic chairs, clean desks with laptops, and a large window showing a blurred city view. The mood is productive and serene."
      },
      {
        "type": "stats",
        "background": "dark",
        "items": [
          {
            "value": "99.9%",
            "label": "Network Uptime"
          },
          {
            "value": "5 Min",
            "label": "Walk to Metro"
          },
          {
            "value": "150+",
            "label": "Businesses Hosted"
          },
          {
            "value": "24/7",
            "label": "On-site Support"
          }
        ]
      },
      {
        "type": "gallery",
        "background": "alt",
        "heading": "Explore Our World-Class Environment",
        "items": [
          {
            "title": "Collaborative Breakout Zone",
            "imagePrompt": "A vibrant and stylish office breakout area with comfortable lounge seating, modern coffee tables, and indoor plants, with natural light streaming in. People are casually collaborating."
          },
          {
            "title": "State-of-the-Art Conference Room",
            "imagePrompt": "A sleek, professional conference room with a long polished table, high-back leather chairs, and a large screen for presentations. The room has a panoramic view of the city skyline."
          },
          {
            "title": "Gourmet Cafeteria",
            "imagePrompt": "A chic and spacious office cafeteria with a variety of food stations, communal dining tables, and pendant lighting. The atmosphere is bustling and friendly."
          }
        ]
      },
      {
        "type": "lead_form",
        "variant": "split-text",
        "background": "light",
        "anchor": "lead-form",
        "heading": "Find Your Perfect Workspace Today",
        "body": "Take the first step towards your new office. Schedule a personalized tour with one of our workspace consultants to experience the difference firsthand. See the spaces, meet the community, and find the perfect fit for your team.",
        "items": [
          {
            "title": "Receive a custom quote"
          },
          {
            "title": "Explore flexible term options"
          },
          {
            "title": "Get all your questions answered"
          }
        ],
        "formTitle": "Schedule a Tour",
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Company Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Work Email",
            "type": "email",
            "required": true,
            "width": "half"
          },
          {
            "label": "Phone Number",
            "type": "tel",
            "required": true,
            "width": "half"
          },
          {
            "label": "Team Size",
            "type": "select",
            "required": true,
            "options": [
              "1-10",
              "11-25",
              "26-50",
              "50+"
            ]
          },
          {
            "label": "I agree to be contacted about my enquiry and to receive marketing communications.",
            "type": "consent",
            "required": true
          }
        ],
        "formSubmitLabel": "Book My Tour",
        "successMessage": "Thank you! We've received your request and will contact you shortly to confirm your tour."
      },
      {
        "type": "faq",
        "background": "alt",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "What are the lease terms?",
            "text": "We offer flexible terms ranging from 6 months to 5 years. We can customize an agreement that aligns with your business goals."
          },
          {
            "title": "Can we customize our office space?",
            "text": "Absolutely. For larger teams and longer commitments, we offer custom-built solutions where you can design the layout, branding, and furniture to match your company's culture."
          },
          {
            "title": "What is included in the monthly fee?",
            "text": "Your monthly fee is all-inclusive, covering rent, utilities, high-speed internet, maintenance, security, cleaning, and access to all common areas and amenities like coffee, tea, and printing."
          },
          {
            "title": "Is there parking available?",
            "text": "Yes, we offer dedicated on-site parking for tenants. Please discuss your specific requirements with our sales team during your tour."
          },
          {
            "title": "What kind of IT support do you provide?",
            "text": "We provide enterprise-grade IT infrastructure with a dedicated on-site team to assist with setup and ongoing support, ensuring your operations run smoothly."
          }
        ],
        "variant": "split"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "Prestige Offices",
        "body": "Grade-A commercial office spaces and managed offices in Gurugram for startups and enterprises.",
        "legal": "© 2023 Prestige Offices. All rights reserved.",
        "items": [
          {
            "title": "Privacy Policy",
            "href": "#"
          },
          {
            "title": "Terms of Service",
            "href": "#"
          }
        ],
        "variant": "simple"
      }
    ]
  },
  {
    "key": "product-smartwatch",
    "name": "AuraFit Pulse Smartwatch Launch",
    "category": "Product Launch",
    "description": "Introducing the AuraFit Pulse smartwatch with a 14-day battery, stunning AMOLED display, and SpO2 monitoring. Pre-order now for an exclusive",
    "theme": {
      "primary": "#FF6B00",
      "accent": "#00C2FF",
      "dark": "#0D1117",
      "font": "Outfit",
      "headingFont": "Outfit",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "dark",
        "brandName": "AuraFit",
        "items": [
          {
            "title": "Features",
            "href": "#features"
          },
          {
            "title": "Gallery",
            "href": "#gallery"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Pre-order Now",
        "ctaHref": "#lead-form",
        "variant": "simple"
      },
      {
        "type": "hero",
        "variant": "split-form",
        "background": "gradient",
        "eyebrow": "INTRODUCING THE AURAFIT PULSE",
        "heading": "14-Day Power. Brilliant Display. Unmatched Insight.",
        "subheading": "The revolutionary smart fitness watch is here. Pre-order today to lock in your exclusive 30% launch discount and redefine your fitness journey.",
        "imagePrompt": "Close-up hero shot of a sleek, black smartwatch on an athlete's wrist, the vibrant AMOLED screen displaying a colorful fitness dashboard. The background is dark and moody, with a single stream of dynamic orange light streaking past, conveying energy and speed.",
        "formAnchor": "lead-form",
        "formTitle": "Claim Your 30% Discount",
        "formSubtitle": "Be the first to own the AuraFit Pulse. Fill in your details to secure your pre-order.",
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "full"
          },
          {
            "label": "Email Address",
            "type": "email",
            "required": true,
            "width": "full"
          },
          {
            "label": "Choose Your Color",
            "type": "select",
            "required": true,
            "options": [
              "Midnight Black",
              "Silver Sky",
              "Rose Gold"
            ],
            "width": "full"
          },
          {
            "label": "I agree to be contacted about my pre-order and receive marketing updates.",
            "type": "consent",
            "required": true,
            "width": "full"
          }
        ],
        "formSubmitLabel": "Pre-order My Watch",
        "successMessage": "Thanks! Your pre-order is confirmed. We'll email you with payment details and shipping updates soon."
      },
      {
        "type": "logos",
        "background": "alt",
        "heading": "Making Waves in the Tech World",
        "items": [
          {
            "title": "TechInsider"
          },
          {
            "title": "GadgetFlow"
          },
          {
            "title": "The Verge"
          },
          {
            "title": "Wired"
          },
          {
            "title": "Digital Trends"
          }
        ]
      },
      {
        "type": "features",
        "variant": "icons",
        "background": "light",
        "anchor": "features",
        "heading": "Engineered for Your Peak Performance",
        "subheading": "Every feature is designed to empower your health and fitness goals without compromise.",
        "items": [
          {
            "icon": "🔋",
            "title": "14-Day Marathon Battery",
            "text": "Charge less, do more. Our hyper-efficient battery powers your life for two full weeks on a single charge."
          },
          {
            "icon": "✨",
            "title": "Vivid AMOLED Display",
            "text": "See your stats and notifications in stunning clarity, even in bright sunlight, on the edge-to-edge screen."
          },
          {
            "icon": "❤️‍🩹",
            "title": "Advanced SpO2 Monitoring",
            "text": "Track your blood oxygen levels day and night for a deeper understanding of your body's wellness and recovery."
          }
        ]
      },
      {
        "type": "media_text",
        "variant": "image-left",
        "background": "dark",
        "eyebrow": "NEVER MISS A BEAT",
        "heading": "From Morning Runs to Midnight Oil",
        "body": "The AuraFit Pulse is more than a fitness tracker; it's your 24/7 companion. With a feather-light design and robust durability, it's built to keep up with your most demanding days and help you recover during your restful nights.",
        "items": [
          {
            "title": "Over 100+ specialized workout modes"
          },
          {
            "title": "In-depth sleep and stress tracking"
          },
          {
            "title": "Smart notifications directly on your wrist"
          }
        ],
        "imagePrompt": "A female trail runner pausing on a mountain peak at sunrise, looking at her AuraFit smartwatch with a smile. The lighting is golden and warm, conveying a sense of achievement and freedom. The watch face is clearly visible.",
        "ctaLabel": "Pre-order & Save 30%",
        "ctaHref": "#lead-form"
      },
      {
        "type": "testimonials",
        "background": "alt",
        "heading": "Early Adopters Love the AuraFit Pulse",
        "items": [
          {
            "text": "The battery life is a game-changer. I went on a week-long hiking trip and didn't even pack the charger. The display is gorgeous, and the data is incredibly insightful.",
            "author": "Marcus L.",
            "role": "Beta Tester & Athlete"
          },
          {
            "text": "Finally, a smart watch that looks as good as it performs. The AMOLED screen is ridiculously bright and crisp. It feels premium and has replaced my old watch completely.",
            "author": "Jenna S.",
            "role": "Tech Reviewer"
          }
        ]
      },
      {
        "type": "gallery",
        "background": "light",
        "anchor": "gallery",
        "heading": "Designed for Every Aspect of Your Life",
        "items": [
          {
            "title": "Urban Commute",
            "imagePrompt": "A stylish person in business casual attire on a city street, checking notifications on their silver AuraFit Pulse watch. The background shows a bustling urban environment."
          },
          {
            "title": "Poolside Tracking",
            "imagePrompt": "An underwater shot of a person swimming laps in a clear blue pool, with the AuraFit Pulse on their wrist, its screen glowing faintly. Sunbeams filter through the water."
          },
          {
            "title": "Focused Workout",
            "imagePrompt": "A close-up action shot of a person lifting weights in a modern gym, sweat beading on their arm. The focus is on the AuraFit Pulse tracking the workout intensity."
          }
        ]
      },
      {
        "type": "faq",
        "background": "alt",
        "anchor": "faq",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "When will my pre-order ship?",
            "text": "Pre-orders are scheduled to ship in 4-6 weeks after the pre-order window closes. You'll receive a confirmation email with tracking information as soon as it's on its way."
          },
          {
            "title": "What devices is the AuraFit Pulse compatible with?",
            "text": "The watch is compatible with Android 8.0+ and iOS 14.0+ via our dedicated AuraFit app, available on the Google Play Store and Apple App Store."
          },
          {
            "title": "Is the watch water-resistant?",
            "text": "Yes, the AuraFit Pulse has a 5ATM water resistance rating, making it suitable for swimming and showering."
          },
          {
            "title": "How do I claim the 30% launch discount?",
            "text": "The discount is automatically applied when you complete the pre-order form on this page. No code is needed! This offer is for a limited time only."
          }
        ]
      },
      {
        "type": "cta",
        "variant": "band",
        "background": "primary",
        "heading": "Your Ultimate Fitness Partner Awaits",
        "subheading": "Don't miss out on the exclusive 30% launch discount. Pre-order your AuraFit Pulse now.",
        "ctaLabel": "Secure My Pre-order",
        "ctaHref": "#lead-form"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "AuraFit",
        "body": "Redefining the connection between you and your fitness.",
        "legal": "© 2024 AuraFit Inc. All rights reserved.",
        "items": [
          {
            "title": "Instagram",
            "href": "#"
          },
          {
            "title": "Twitter",
            "href": "#"
          },
          {
            "title": "Privacy Policy",
            "href": "#"
          }
        ],
        "variant": "centered"
      }
    ]
  },
  {
    "key": "product-saas",
    "name": "SaaS Analytics Early Access",
    "category": "Product Launch",
    "description": "Stop switching tabs. Get a single view of your Shopify, ads, and CRM data to unlock real growth insights. Sign up for early access to our po",
    "theme": {
      "primary": "#4F46E5",
      "accent": "#10B981",
      "dark": "#111827",
      "font": "Inter",
      "headingFont": "Inter",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "Synoptic",
        "items": [
          {
            "title": "Features",
            "href": "#features"
          },
          {
            "title": "How It Works",
            "href": "#how-it-works"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Join Waitlist",
        "ctaHref": "#lead-form",
        "variant": "dark"
      },
      {
        "type": "hero",
        "variant": "split-form",
        "background": "gradient",
        "eyebrow": "🚀 FOR AMBITIOUS D2C BRANDS",
        "heading": "The Single Source of Truth for Your D2C Data.",
        "subheading": "Stop juggling spreadsheets. Synoptic unifies your Shopify, Ads, and CRM data into one powerful dashboard. Make smarter decisions, faster. Join the early access list.",
        "formAnchor": "lead-form",
        "formTitle": "Get Early Access",
        "formSubtitle": "Be the first to experience unified analytics. Limited spots available.",
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Work Email",
            "type": "email",
            "required": true,
            "width": "half"
          },
          {
            "label": "Company Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Shopify Store URL",
            "type": "text",
            "required": false,
            "width": "half"
          },
          {
            "label": "Your biggest analytics challenge?",
            "type": "textarea",
            "required": false
          },
          {
            "label": "I agree to be contacted about early access and future product updates.",
            "type": "consent",
            "required": true
          }
        ],
        "formSubmitLabel": "Secure My Spot",
        "successMessage": "Thanks! You're on the list. We'll be in touch soon.",
        "items": [
          {
            "icon": "🔗",
            "title": "Shopify Integration"
          },
          {
            "icon": "📊",
            "title": "Ad Platform Sync"
          },
          {
            "icon": "👥",
            "title": "CRM Connection"
          }
        ]
      },
      {
        "type": "logos",
        "background": "alt",
        "heading": "Powering the next generation of D2C leaders",
        "items": [
          {
            "title": "Aura Skincare"
          },
          {
            "title": "Nomad Gear"
          },
          {
            "title": "The Daily Grind Coffee"
          },
          {
            "title": "Petal & Stem"
          },
          {
            "title": "Crafted Goods Co."
          }
        ]
      },
      {
        "type": "features",
        "variant": "bento",
        "background": "light",
        "anchor": "features",
        "heading": "From Fragmented Data to Actionable Insights",
        "subheading": "Synoptic gives you the clarity to grow your brand profitably, without the complexity.",
        "items": [
          {
            "icon": "🛍️",
            "title": "Unified Shopify Dashboard",
            "text": "See sales, AOV, LTV, and inventory data in one place, updated in real-time."
          },
          {
            "icon": "🎯",
            "title": "True Ad Attribution",
            "text": "Connect Meta, Google, and TikTok Ads to finally understand your true ROAS and CPA."
          },
          {
            "icon": "📈",
            "title": "Customer Journey Mapping",
            "text": "Track customer cohorts from first click to repeat purchase by linking ad data with CRM profiles."
          },
          {
            "icon": "🤖",
            "title": "AI-Powered Insights",
            "text": "Our models automatically surface trends, anomalies, and growth opportunities you might miss."
          },
          {
            "icon": "📋",
            "title": "Customizable Reports",
            "text": "Build and share beautiful, automated reports that answer your most important questions."
          },
          {
            "icon": "🔌",
            "title": "One-Click Integrations",
            "text": "No-code setup. Securely connect your favorite tools in under 5 minutes."
          }
        ]
      },
      {
        "type": "media_text",
        "variant": "image-right",
        "background": "alt",
        "eyebrow": "SEE THE FULL PICTURE",
        "heading": "Connect Ad Spend to Customer Lifetime Value",
        "body": "Tired of guessing which campaigns drive your most valuable customers? Synoptic links your ad platform data directly to your Shopify and CRM records. Finally, you can see the complete customer journey and optimize for long-term profit, not just first-time sales.",
        "items": [
          {
            "title": "Attribute revenue to specific ads, campaigns, and channels."
          },
          {
            "title": "Identify your most profitable customer cohorts."
          },
          {
            "title": "Calculate true, blended Customer Acquisition Cost (CAC)."
          }
        ],
        "imagePrompt": "A clean, modern SaaS dashboard on a laptop screen, showing colorful charts and graphs with metrics like ROAS, LTV, and CAC. The background is a minimalist, well-lit office. The mood is focused and professional.",
        "ctaLabel": "Join the Waitlist",
        "ctaHref": "#lead-form"
      },
      {
        "type": "steps",
        "background": "dark",
        "anchor": "how-it-works",
        "heading": "Go Live in 3 Simple Steps",
        "items": [
          {
            "title": "1. Secure Your Spot",
            "text": "Sign up for early access. We're onboarding new brands every week based on the waitlist."
          },
          {
            "title": "2. Connect Your Data Sources",
            "text": "Easily and securely link your Shopify, Ads, and CRM accounts with our one-click integrations."
          },
          {
            "title": "3. Unlock Your Insights",
            "text": "Your unified dashboard will be ready in minutes. Start exploring your data and making smarter decisions."
          }
        ]
      },
      {
        "type": "testimonials",
        "background": "light",
        "heading": "What D2C Founders are Saying",
        "items": [
          {
            "text": "Synoptic is the dashboard I've been dreaming of. For the first time, I can see exactly how my Meta ads are impacting customer lifetime value without spending hours in spreadsheets. It's a game-changer.",
            "author": "Jenna Carter",
            "role": "Founder, Aura Skincare"
          },
          {
            "text": "We were able to identify our most profitable ad channel within the first week of using Synoptic. The setup was incredibly simple, and the insights are already paying for the platform many times over.",
            "author": "Mark Chen",
            "role": "Head of Growth, Nomad Gear"
          }
        ]
      },
      {
        "type": "faq",
        "background": "alt",
        "anchor": "faq",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "Which integrations do you support?",
            "text": "For our early access launch, we support Shopify, Meta (Facebook & Instagram) Ads, Google Ads, and Klaviyo. We are rapidly adding more, including TikTok Ads, Attentive, and more."
          },
          {
            "title": "Is my data secure?",
            "text": "Absolutely. We use industry-standard encryption and secure, read-only API connections. We are fully GDPR and CCPA compliant. You own your data, always."
          },
          {
            "title": "What is the pricing for early access members?",
            "text": "Early access members will receive a significant lifetime discount on all future plans. We will share detailed pricing information closer to the public launch."
          },
          {
            "title": "Who is this platform for?",
            "text": "Synoptic is built specifically for founders, marketers, and operators at D2C ecommerce brands who want to make data-driven decisions without needing a dedicated data science team."
          }
        ],
        "variant": "split"
      },
      {
        "type": "cta",
        "variant": "band",
        "background": "primary",
        "heading": "Ready to See Your Data Clearly?",
        "subheading": "Join the waitlist and be the first to get the unified analytics dashboard your D2C brand deserves.",
        "ctaLabel": "Get Early Access Now",
        "ctaHref": "#lead-form"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "Synoptic",
        "body": "The single source of truth for D2C analytics.",
        "legal": "© 2024 Synoptic Inc. All rights reserved.",
        "items": [
          {
            "title": "Features",
            "href": "#features"
          },
          {
            "title": "Contact",
            "href": "mailto:hello@synoptic.com"
          },
          {
            "title": "Privacy",
            "href": "#"
          }
        ],
        "variant": "columns"
      }
    ]
  },
  {
    "key": "event-techfest",
    "name": "TechFest 2024 Landing Page",
    "category": "Event Registration",
    "description": "Join us for a three-day extravaganza of tech, creativity, and fun! Featuring a 24-hour hackathon, hands-on workshops, and a massive concert ",
    "theme": {
      "primary": "#7F56D9",
      "accent": "#FF6B6B",
      "dark": "#1E1B2E",
      "font": "Poppins",
      "headingFont": "Outfit",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "dark",
        "brandName": "TechFest '24",
        "items": [
          {
            "title": "Events",
            "href": "#events"
          },
          {
            "title": "Hackathon",
            "href": "#hackathon"
          },
          {
            "title": "Workshops",
            "href": "#workshops"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Register Now",
        "ctaHref": "#lead-form",
        "variant": "simple"
      },
      {
        "type": "hero",
        "variant": "split-form",
        "background": "gradient",
        "eyebrow": "3 DAYS OF INNOVATION, CODE, AND MUSIC",
        "heading": "Unleash Your Inner Tech Genius at TechFest '24",
        "subheading": "Experience a whirlwind of coding, learning, and entertainment. Compete in our 24-hour hackathon, level up your skills in exclusive workshops, and rock out at our concert night.",
        "formTitle": "Register Your Team",
        "formSubtitle": "Limited spots available. Secure your place now!",
        "formFields": [
          {
            "label": "Team Name",
            "type": "text",
            "required": true,
            "width": "full"
          },
          {
            "label": "Team Leader Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Team Leader Email",
            "type": "email",
            "required": true,
            "width": "half"
          },
          {
            "label": "Mobile Number",
            "type": "tel",
            "required": true,
            "width": "half"
          },
          {
            "label": "Number of Members",
            "type": "select",
            "required": true,
            "options": [
              "2 Members",
              "3 Members",
              "4 Members"
            ],
            "width": "half"
          },
          {
            "label": "I agree to be contacted about this enquiry and future events.",
            "type": "consent",
            "required": true
          }
        ],
        "formSubmitLabel": "Register My Team",
        "successMessage": "Awesome! Your team is registered. Check your email for confirmation and payment details."
      },
      {
        "type": "logos",
        "background": "alt",
        "heading": "Proudly Sponsored By",
        "items": [
          {
            "title": "Innovate Corp"
          },
          {
            "title": "CodeStream"
          },
          {
            "title": "Synth AI"
          },
          {
            "title": "NextGen Solutions"
          },
          {
            "title": "Digital Forge"
          },
          {
            "title": "QuantumLeap"
          }
        ]
      },
      {
        "type": "features",
        "variant": "icons",
        "background": "light",
        "id": "events",
        "heading": "What's Happening at TechFest '24?",
        "subheading": "Dive into a packed schedule of events designed to challenge, inspire, and entertain.",
        "items": [
          {
            "icon": "💻",
            "title": "24-Hour Hackathon",
            "text": "Build, break, and innovate. Compete for amazing prizes and bragging rights in our flagship event."
          },
          {
            "icon": "🛠️",
            "title": "Hands-On Workshops",
            "text": "Learn from industry experts on hot topics like AI, Web3, and Cybersecurity in interactive sessions."
          },
          {
            "icon": "🎸",
            "title": "Epic Concert Night",
            "text": "Unwind after a long day of coding with a live performance from a top artist. It's time to party!"
          },
          {
            "icon": "🎤",
            "title": "Inspiring Tech Talks",
            "text": "Hear from visionaries and leaders who are shaping the future of technology right now."
          },
          {
            "icon": "🤝",
            "title": "Networking Zones",
            "text": "Connect with fellow students, recruiters from top companies, and seasoned tech professionals."
          },
          {
            "icon": "🏆",
            "title": "Exciting Competitions",
            "text": "Showcase your skills in fast-paced coding challenges, robotics duels, and more."
          }
        ]
      },
      {
        "type": "media_text",
        "variant": "image-right",
        "background": "alt",
        "id": "hackathon",
        "eyebrow": "The Ultimate Challenge",
        "heading": "The 24-Hour Non-Stop Hackathon",
        "body": "Fuelled by caffeine and creativity, your team will have 24 hours to build a project from scratch that solves a real-world problem. Mentors from top tech companies will be on hand to guide you, and our judges are looking for the next big thing.",
        "items": [
          {
            "title": "Win cash prizes up to $5,000"
          },
          {
            "title": "Exclusive internship opportunities"
          },
          {
            "title": "Free swag and premium developer tools for all participants"
          }
        ],
        "imagePrompt": "A diverse group of college students intensely focused on their laptops in a large, modern hall during a hackathon. The atmosphere is energetic and collaborative, with low ambient lighting, neon purple accents, and the glow of screens on their faces.",
        "ctaLabel": "Register for the Hackathon",
        "ctaHref": "#lead-form"
      },
      {
        "type": "gallery",
        "background": "dark",
        "heading": "Vibes From Last Year's Fest",
        "items": [
          {
            "title": "Winning Team Celebration",
            "imagePrompt": "A young, diverse team of four students celebrating on a stage, holding a large glass trophy, with purple and white confetti falling around them. They are ecstatic. Bright, dynamic stage lighting."
          },
          {
            "title": "Workshop in Action",
            "imagePrompt": "An over-the-shoulder shot of a workshop where students are gathered around a table, working on a robotics project. The instructor is pointing at a component on a circuit board. Bright, focused classroom lighting."
          },
          {
            "title": "Concert Night Energy",
            "imagePrompt": "A wide shot from behind the crowd at an outdoor college concert at night. The stage is brightly lit with purple and blue lasers, and the crowd has their hands and phones in the air. Energetic and vibrant mood."
          }
        ]
      },
      {
        "type": "faq",
        "background": "light",
        "id": "faq",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "Who can participate?",
            "text": "The event is open to all undergraduate and postgraduate students from any college or university. You just need a valid student ID."
          },
          {
            "title": "What is the team size for the hackathon?",
            "text": "Teams can consist of 2 to 4 members. You can register as a team or sign up as an individual and we'll help you find a team at the event."
          },
          {
            "title": "Are there any registration fees?",
            "text": "Yes, there is a nominal registration fee per team which covers access to all events, workshops, concert, and food during the hackathon. Details are sent via email after you register your interest."
          },
          {
            "title": "What should I bring for the hackathon?",
            "text": "Bring your laptop, chargers, any required hardware, and a whole lot of enthusiasm! We'll provide the high-speed Wi-Fi, power outlets, food, and drinks to keep you going."
          },
          {
            "title": "Will accommodation be provided?",
            "text": "For out-of-station participants, we have limited, shared accommodation available on a first-come, first-served basis for a small additional fee. Please indicate your requirement after registration."
          }
        ]
      },
      {
        "type": "cta",
        "variant": "band",
        "background": "primary",
        "heading": "Ready to Code, Learn, and Celebrate?",
        "subheading": "Don't miss out on the biggest college tech fest of the year. Register your team now!",
        "ctaLabel": "Secure My Spot",
        "ctaHref": "#lead-form"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "TechFest '24",
        "body": "Organized by the students of the National Institute of Technology. A celebration of technology, innovation, and community.",
        "items": [
          {
            "title": "Instagram",
            "href": "#"
          },
          {
            "title": "LinkedIn",
            "href": "#"
          },
          {
            "title": "Email Us",
            "href": "#"
          }
        ],
        "legal": "© 2024 TechFest. All rights reserved. ",
        "variant": "simple"
      }
    ]
  },
  {
    "key": "event-expo",
    "name": "Elysian Wedding & Lifestyle Expo",
    "category": "Event Registration",
    "description": "Join the most anticipated wedding and lifestyle expo. Meet 200+ top vendors, discover the latest trends, and get exclusive deals. Register f",
    "theme": {
      "primary": "#C0A080",
      "accent": "#F5EFE6",
      "dark": "#2C2C2C",
      "font": "Inter",
      "headingFont": "Playfair Display",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "Elysian Expo",
        "items": [
          {
            "title": "Exhibitors",
            "href": "#exhibitors"
          },
          {
            "title": "Highlights",
            "href": "#highlights"
          },
          {
            "title": "Gallery",
            "href": "#gallery"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Get Free Pass",
        "ctaHref": "#lead-form",
        "variant": "centered"
      },
      {
        "type": "hero",
        "variant": "split-form",
        "background": "gradient",
        "eyebrow": "THE WEDDING & LIFESTYLE EXPO OF THE YEAR",
        "heading": "Your Dream Wedding Begins Here",
        "subheading": "Join us for an unforgettable experience with over 200 premium exhibitors. Plan your perfect day and discover endless inspiration. Register now for your complimentary entry pass!",
        "imagePrompt": "A breathtakingly elegant wedding reception hall, bathed in soft, warm light. Tables are set with fine china, gold cutlery, and lush floral centerpieces. In the background, large arched windows overlook a serene garden at dusk. The mood is romantic and luxurious.",
        "formTitle": "Get Your Free Pass",
        "formSubtitle": "Limited passes available. Register today!",
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Email Address",
            "type": "email",
            "required": true,
            "width": "half"
          },
          {
            "label": "Mobile Number",
            "type": "tel",
            "required": true,
            "width": "half"
          },
          {
            "label": "Planned Wedding Date",
            "type": "date",
            "required": false,
            "width": "half"
          },
          {
            "label": "I agree to be contacted about this enquiry and receive event updates.",
            "type": "consent",
            "required": true
          }
        ],
        "formSubmitLabel": "Register for Free",
        "successMessage": "Thank you! Your free pass has been sent to your email."
      },
      {
        "type": "logos",
        "background": "alt",
        "heading": "Meet 200+ Premium Exhibitors",
        "items": [
          {
            "title": "Vera Wang"
          },
          {
            "title": "Tiffany & Co."
          },
          {
            "title": "Four Seasons Hotels"
          },
          {
            "title": "Bloom & Petal Florists"
          },
          {
            "title": "Gourmet Catering Co."
          },
          {
            "title": "Prestige Planners"
          }
        ]
      },
      {
        "type": "features",
        "variant": "icons",
        "background": "light",
        "heading": "An Unforgettable Experience Awaits",
        "subheading": "Discover everything you need to plan your perfect day under one roof.",
        "items": [
          {
            "icon": "💎",
            "title": "Meet Top-Tier Vendors",
            "text": "Connect face-to-face with the industry's best wedding planners, photographers, florists, and more."
          },
          {
            "icon": "✨",
            "title": "Discover Latest Trends",
            "text": "From bridal couture to decor innovations, get inspired by the latest styles and ideas for your special day."
          },
          {
            "icon": "🎁",
            "title": "Unlock Exclusive Offers",
            "text": "Access special expo-only discounts, deals, and packages that you won't find anywhere else."
          }
        ]
      },
      {
        "type": "media_text",
        "variant": "image-left",
        "background": "alt",
        "eyebrow": "EVENT HIGHLIGHT",
        "heading": "The Bridal Couture Runway",
        "body": "Witness a spectacular showcase of the latest bridal collections from world-renowned and emerging designers. Find the dress of your dreams as it comes to life on the runway.",
        "items": [
          {
            "title": "Hourly Fashion Shows"
          },
          {
            "title": "Designer Meet & Greets"
          },
          {
            "title": "Exclusive Trunk Show Previews"
          }
        ],
        "imagePrompt": "A graceful model walks down a brightly lit runway in a stunning, intricate lace wedding gown. The audience on either side is softly blurred, focusing all attention on the dress. The atmosphere is high-fashion and elegant.",
        "ctaLabel": "See The Schedule",
        "ctaHref": "#lead-form"
      },
      {
        "type": "stats",
        "background": "dark",
        "items": [
          {
            "value": "200+",
            "label": "Exhibitors"
          },
          {
            "value": "30+",
            "label": "Wedding Categories"
          },
          {
            "value": "100s",
            "label": "Exclusive Deals"
          },
          {
            "value": "2",
            "label": "Days of Inspiration"
          }
        ]
      },
      {
        "type": "gallery",
        "background": "light",
        "heading": "Glimpses From Our Previous Expo",
        "items": [
          {
            "title": "Happy Couple Consulting a Planner",
            "imagePrompt": "A cheerful young couple sits at a beautifully decorated booth, laughing and talking with a wedding planner. The scene is candid and full of positive energy."
          },
          {
            "title": "Elaborate Cake Tasting Station",
            "imagePrompt": "A close-up shot of an elaborate cake tasting station, featuring several multi-tiered wedding cakes with intricate sugar flowers. Guests are sampling different flavors. The lighting is bright and appetizing."
          },
          {
            "title": "Busy Expo Hall Floor",
            "imagePrompt": "A wide-angle shot of a bustling expo hall from a slightly elevated view. Attendees are exploring various vendor booths, creating a vibrant and exciting atmosphere."
          }
        ]
      },
      {
        "type": "faq",
        "background": "alt",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "When and where is the expo being held?",
            "text": "The Elysian Wedding & Lifestyle Expo will be held on October 26-27, 2024, at the Grand Convention Centre, 123 Exhibition Way."
          },
          {
            "title": "Is the entry really free?",
            "text": "Yes! Entry is completely free when you register online in advance. A nominal fee will be charged for on-the-spot registrations at the venue."
          },
          {
            "title": "What can I expect at the expo?",
            "text": "You can expect to meet over 200 of the best wedding and lifestyle vendors, attend fashion shows, participate in workshops, enjoy food tastings, and get access to exclusive discounts."
          },
          {
            "title": "Is parking available at the venue?",
            "text": "Yes, ample paid parking is available at the Grand Convention Centre. We recommend arriving early to secure a spot."
          }
        ],
        "variant": "split"
      },
      {
        "type": "cta",
        "variant": "band",
        "background": "primary",
        "heading": "Your Forever Starts With A Single Step",
        "subheading": "Don't miss the ultimate wedding planning event of the year. Claim your free pass now and step into a world of inspiration.",
        "ctaLabel": "Register for FREE Entry",
        "ctaHref": "#lead-form"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "Elysian Expo",
        "body": "The premier wedding and lifestyle exhibition for creating your perfect day.",
        "legal": "© 2024 Elysian Events Inc. All rights reserved.",
        "items": [
          {
            "title": "Privacy Policy",
            "href": "#"
          },
          {
            "title": "Terms of Use",
            "href": "#"
          },
          {
            "title": "Contact",
            "href": "#"
          }
        ],
        "variant": "centered"
      }
    ]
  },
  {
    "key": "webinar-finance",
    "name": "Personal Finance Masterclass Landing Page",
    "category": "Webinar",
    "description": "Join our free live masterclass for young professionals. Learn personal finance essentials, understand mutual funds, and start building wealt",
    "theme": {
      "primary": "#0052CC",
      "accent": "#FFAB00",
      "dark": "#172B4D",
      "font": "Inter",
      "headingFont": "Poppins",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "WealthWise Academy",
        "items": [
          {
            "title": "What You'll Learn",
            "href": "#learn"
          },
          {
            "title": "Instructor",
            "href": "#instructor"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Save My Seat",
        "ctaHref": "#lead-form",
        "variant": "simple"
      },
      {
        "type": "hero",
        "variant": "split-form",
        "background": "gradient",
        "eyebrow": "FREE LIVE MASTERCLASS",
        "heading": "Stop Guessing With Your Money. Start Building Real Wealth.",
        "subheading": "Join our exclusive masterclass for young professionals and learn the fundamentals of personal finance and how to confidently invest in mutual funds.",
        "items": [
          {
            "icon": "🎟️",
            "title": "Limited Spots Available"
          },
          {
            "icon": "✅",
            "title": "100% Free to Attend"
          },
          {
            "icon": "💬",
            "title": "Live Q&A Session"
          }
        ],
        "formAnchor": "lead-form",
        "formTitle": "Save Your Free Seat",
        "formSubtitle": "Spots are filling up fast. Register now!",
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Email Address",
            "type": "email",
            "required": true,
            "width": "half"
          },
          {
            "label": "Mobile Number",
            "type": "tel",
            "required": true
          },
          {
            "label": "Your Profession",
            "type": "select",
            "required": false,
            "options": [
              "Salaried Professional",
              "Business Owner",
              "Student",
              "Other"
            ]
          },
          {
            "label": "I agree to be contacted about this masterclass and receive updates.",
            "type": "consent",
            "required": true
          }
        ],
        "formSubmitLabel": "Register for Free",
        "successMessage": "Great! You're registered. Check your email for the masterclass link."
      },
      {
        "type": "logos",
        "background": "alt",
        "heading": "Trusted by Young Professionals from Leading Companies",
        "items": [
          {
            "title": "Google"
          },
          {
            "title": "Microsoft"
          },
          {
            "title": "Deloitte"
          },
          {
            "title": "Amazon"
          },
          {
            "title": "Infosys"
          },
          {
            "title": "Tata"
          }
        ]
      },
      {
        "type": "features",
        "variant": "bento",
        "background": "light",
        "anchor": "learn",
        "heading": "What You'll Learn in 90 Minutes",
        "subheading": "Unlock the practical knowledge you need to take control of your financial future, explained in simple terms.",
        "items": [
          {
            "icon": "💰",
            "title": "Budgeting That Works",
            "text": "Learn the 50/30/20 rule and create a simple, effective budget you can actually stick to without giving up your lifestyle."
          },
          {
            "icon": "📈",
            "title": "Intro to Mutual Funds",
            "text": "Demystify mutual funds. Understand what they are, how they work, and why they are a great starting point for investors."
          },
          {
            "icon": "🎯",
            "title": "Smart Fund Selection",
            "text": "Discover the key parameters to look for when choosing the right mutual funds that align with your financial goals."
          },
          {
            "icon": "💸",
            "title": "Debt Demystified",
            "text": "Understand the difference between good and bad debt, and learn practical strategies to manage loans and credit cards effectively."
          },
          {
            "icon": "📜",
            "title": "Tax-Saving Investments",
            "text": "Get an introduction to ELSS and other tax-efficient investment options that help you save money while you grow it."
          },
          {
            "icon": "🗺️",
            "title": "Goal-Based Investing",
            "text": "Define your financial goals and create a clear roadmap to achieve them, whether it's for travel, a new home, or early retirement."
          }
        ]
      },
      {
        "type": "team",
        "background": "alt",
        "anchor": "instructor",
        "heading": "Meet Your Instructor",
        "items": [
          {
            "title": "Aarav Sharma",
            "label": "SEBI Registered Investment Advisor, 12+ Years Experience",
            "imagePrompt": "A professional headshot of a smiling, confident Indian man in his late 30s, wearing a smart business casual shirt, against a blurred office background. The lighting is soft and professional."
          }
        ]
      },
      {
        "type": "testimonials",
        "background": "dark",
        "heading": "What Past Attendees Are Saying",
        "items": [
          {
            "text": "This masterclass was a game-changer. I finally understand where my money is going and how to make it grow. Aarav explains complex topics so simply and clearly.",
            "author": "Priya K.",
            "role": "Software Engineer"
          },
          {
            "text": "I always found investing intimidating and didn't know where to start. After this session, I made my first mutual fund investment with confidence. Highly recommended!",
            "author": "Rohan S.",
            "role": "Marketing Manager"
          },
          {
            "text": "The best 90 minutes I've spent on my finances. The content is practical, actionable, and perfect for beginners. The live Q&A was incredibly helpful.",
            "author": "Anjali M.",
            "role": "Graphic Designer"
          }
        ]
      },
      {
        "type": "faq",
        "background": "light",
        "anchor": "faq",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "Is this masterclass really free?",
            "text": "Yes, it is 100% free. Our goal is to spread financial literacy. There are no hidden charges."
          },
          {
            "title": "Is this a live session?",
            "text": "Absolutely. This is a live, interactive masterclass, not a pre-recorded video. You will have the opportunity to ask questions during the dedicated Q&A segment at the end."
          },
          {
            "title": "Will I get a recording if I can't attend live?",
            "text": "Yes, all registered participants will receive a link to the replay of the masterclass via email within 24 hours of the live session."
          },
          {
            "title": "Who is this masterclass for?",
            "text": "This session is specifically designed for young professionals, students, and anyone who is at the beginning of their personal finance journey and wants to learn in a simple, structured way."
          },
          {
            "title": "Do I need any prior financial knowledge?",
            "text": "Not at all. We start from the absolute basics and build up from there. This masterclass is completely beginner-friendly."
          }
        ]
      },
      {
        "type": "cta",
        "variant": "band",
        "background": "primary",
        "heading": "Ready to Take Control of Your Finances?",
        "subheading": "Your journey to financial freedom starts here. Limited seats available.",
        "ctaLabel": "Save My Free Seat Now",
        "ctaHref": "#lead-form"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "WealthWise Academy",
        "body": "Empowering young professionals to achieve financial independence through practical education.",
        "legal": "© 2024 WealthWise Academy. All Rights Reserved. Mutual fund investments are subject to market risks. This masterclass is for educational purposes only and is not investment advice.",
        "items": [
          {
            "title": "LinkedIn",
            "href": "#"
          },
          {
            "title": "Twitter",
            "href": "#"
          }
        ],
        "variant": "columns"
      }
    ]
  },
  {
    "key": "webinar-hr",
    "name": "AI in Recruitment Webinar",
    "category": "Webinar",
    "description": "Join our exclusive webinar with a panel of top CHROs to learn how to leverage AI to transform your talent acquisition strategy. Reserve your",
    "theme": {
      "primary": "#1E3A8A",
      "accent": "#F59E0B",
      "dark": "#111827",
      "font": "Inter",
      "headingFont": "Poppins",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "HR Innovate Live",
        "items": [
          {
            "title": "About",
            "href": "#about"
          },
          {
            "title": "Speakers",
            "href": "#speakers"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Reserve Your Seat",
        "ctaHref": "#lead-form",
        "variant": "dark"
      },
      {
        "type": "hero",
        "variant": "split-form",
        "background": "gradient",
        "eyebrow": "EXCLUSIVE WEBINAR FOR HR LEADERS",
        "heading": "AI in Recruitment: From Hype to Hire",
        "subheading": "Join our panel of top CHROs and discover how to leverage artificial intelligence to attract, screen, and hire top talent faster and with less bias.",
        "items": [
          {
            "icon": "📅",
            "title": "Live on October 26th"
          },
          {
            "icon": "💻",
            "title": "100% Virtual"
          },
          {
            "icon": "✅",
            "title": "Completely Free"
          }
        ],
        "formTitle": "Reserve Your Free Seat",
        "formSubtitle": "Spots are limited. Sign up now to secure your place.",
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Company Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Work Email",
            "type": "email",
            "required": true
          },
          {
            "label": "Job Title",
            "type": "select",
            "required": true,
            "options": [
              "CHRO / CPO",
              "VP of HR / People",
              "Director of HR / Talent",
              "HR Manager",
              "Recruiter",
              "Other"
            ]
          },
          {
            "label": "I agree to be contacted about this webinar and other relevant events.",
            "type": "consent",
            "required": true
          }
        ],
        "formSubmitLabel": "Confirm My Registration"
      },
      {
        "type": "logos",
        "background": "alt",
        "heading": "Join HR leaders from world-class organizations",
        "items": [
          {
            "title": "Innovate Corp"
          },
          {
            "title": "GlobalTech Solutions"
          },
          {
            "title": "Quantum Dynamics"
          },
          {
            "title": "Pinnacle Enterprises"
          },
          {
            "title": "Synergy Group"
          },
          {
            "title": "Apex Industries"
          }
        ]
      },
      {
        "type": "media_text",
        "variant": "image-left",
        "background": "light",
        "id": "about",
        "eyebrow": "ACTIONABLE INSIGHTS",
        "heading": "What You'll Learn in 60 Minutes",
        "body": "This isn't just theory. Our panel will provide practical strategies and real-world case studies to help you implement AI effectively and ethically in your hiring process.",
        "items": [
          {
            "title": "Automate Sourcing: Find qualified, passive candidates at scale."
          },
          {
            "title": "Enhance Candidate Experience: Use AI to create personalized, engaging journeys."
          },
          {
            "title": "Reduce Bias: Learn how to use AI tools to ensure fair and equitable hiring."
          },
          {
            "title": "Measure ROI: Understand the key metrics to track for AI recruitment success."
          }
        ],
        "imagePrompt": "A diverse group of corporate professionals engaged in a collaborative discussion in a modern, sunlit office boardroom. They are looking at a tablet screen with charts. The mood is focused and innovative.",
        "ctaLabel": "Save My Seat",
        "ctaHref": "#lead-form"
      },
      {
        "type": "team",
        "background": "dark",
        "id": "speakers",
        "heading": "Meet Your Expert Panel",
        "items": [
          {
            "title": "Jasmine Chen",
            "label": "Chief People Officer, Innovate Corp",
            "imagePrompt": "Professional headshot of an East Asian woman in her 40s with a warm, confident smile. She is wearing a dark blue blazer against a neutral, out-of-focus office background. Studio lighting."
          },
          {
            "title": "Marcus Thorne",
            "label": "CHRO, GlobalTech Solutions",
            "imagePrompt": "Professional headshot of a Black man in his 50s with a thoughtful expression. He is wearing a grey suit and tie, against a blurred background of a modern office interior. Soft lighting."
          },
          {
            "title": "Eleanor Vance",
            "label": "VP of Global Talent, Quantum Dynamics",
            "imagePrompt": "Professional headshot of a Caucasian woman in her late 40s with short blonde hair and a friendly smile. She is wearing professional attire against a simple, light grey background. Bright, even lighting."
          }
        ]
      },
      {
        "type": "stats",
        "background": "alt",
        "items": [
          {
            "value": "45%",
            "label": "Reduction in Time-to-Hire"
          },
          {
            "value": "3x",
            "label": "More Qualified Candidates"
          },
          {
            "value": "75%",
            "label": "Less Time Spent on Screening"
          },
          {
            "value": "24/7",
            "label": "Candidate Engagement"
          }
        ]
      },
      {
        "type": "faq",
        "background": "light",
        "id": "faq",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "Who should attend this webinar?",
            "text": "This webinar is designed for CHROs, VPs of HR, Talent Acquisition Directors, and other senior HR leaders who are responsible for recruitment strategy and technology."
          },
          {
            "title": "Is this webinar free?",
            "text": "Yes, attendance is completely free of charge. We believe in sharing knowledge to move the industry forward."
          },
          {
            "title": "What if I can't make the live session?",
            "text": "Register anyway! All registered attendees will receive a link to the on-demand recording and a copy of the presentation slides after the event."
          },
          {
            "title": "What technology will I need?",
            "text": "The webinar will be hosted on a standard platform accessible via your web browser. No special software is required. You will receive a link to join after you register."
          },
          {
            "title": "Will there be a Q&A session?",
            "text": "Absolutely. We have allocated the final 15 minutes of the webinar for a live Q&A session with our panel of experts."
          }
        ],
        "variant": "split"
      },
      {
        "type": "cta",
        "variant": "banner",
        "background": "primary",
        "heading": "Ready to Transform Your Recruitment Strategy?",
        "subheading": "Don't miss this opportunity to learn from the best in the industry. Secure your spot now before they're all gone.",
        "ctaLabel": "Reserve My Free Seat Today",
        "ctaHref": "#lead-form"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "HR Innovate Live",
        "body": "Empowering HR leaders through technology and innovation.",
        "legal": "© 2023 HR Innovate Live. All rights reserved.",
        "items": [
          {
            "title": "Privacy Policy",
            "href": "#"
          },
          {
            "title": "Terms of Service",
            "href": "#"
          },
          {
            "title": "Contact",
            "href": "#"
          }
        ],
        "variant": "simple"
      }
    ]
  },
  {
    "key": "corporate-cloud",
    "name": "CloudPinnacle IT Services",
    "category": "Corporate",
    "description": "Expert IT services for enterprise. We specialize in seamless cloud migration, accelerated DevOps, and proactive managed services to moderniz",
    "theme": {
      "primary": "#0D47A1",
      "accent": "#42A5F5",
      "dark": "#1A202C",
      "font": "Inter",
      "headingFont": "Poppins",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "CloudPinnacle",
        "items": [
          {
            "title": "Services",
            "href": "#services"
          },
          {
            "title": "Why Us",
            "href": "#why-us"
          },
          {
            "title": "Testimonials",
            "href": "#testimonials"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Get a Consultation",
        "ctaHref": "#lead-form",
        "variant": "simple"
      },
      {
        "type": "hero",
        "variant": "split-form",
        "background": "gradient",
        "eyebrow": "ENTERPRISE IT & CLOUD SOLUTIONS",
        "heading": "Modernize Your Infrastructure. Accelerate Your Growth.",
        "subheading": "Leverage our expertise in cloud migration, DevOps, and managed services to build a resilient, scalable, and secure IT foundation for your business.",
        "imagePrompt": "A diverse team of IT engineers collaborating in a modern, brightly lit control room with large screens showing data dashboards and network topology.",
        "formTitle": "Schedule Your Free Consultation",
        "formSubtitle": "Fill out the form and our experts will be in touch shortly.",
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Company Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Work Email",
            "type": "email",
            "required": true
          },
          {
            "label": "Phone Number",
            "type": "tel",
            "required": true
          },
          {
            "label": "Service of Interest",
            "type": "select",
            "required": true,
            "options": [
              "Cloud Migration",
              "DevOps & Automation",
              "Managed IT Services",
              "Other"
            ]
          },
          {
            "label": "I agree to be contacted by CloudPinnacle about this enquiry.",
            "type": "consent",
            "required": true
          }
        ],
        "formSubmitLabel": "Request Consultation",
        "successMessage": "Thank you! We've received your request and will be in touch soon."
      },
      {
        "type": "logos",
        "background": "light",
        "heading": "Trusted by Industry-Leading Enterprises",
        "items": [
          {
            "title": "InnovateCorp"
          },
          {
            "title": "QuantumLeap"
          },
          {
            "title": "Apex Financial"
          },
          {
            "title": "Strive Logistics"
          },
          {
            "title": "NextGen Pharma"
          },
          {
            "title": "GlobalNet"
          }
        ]
      },
      {
        "type": "features",
        "variant": "icons",
        "background": "alt",
        "id": "services",
        "heading": "Our Core Service Pillars",
        "subheading": "End-to-end solutions designed for enterprise performance, security, and reliability.",
        "items": [
          {
            "icon": "☁️",
            "title": "Seamless Cloud Migration",
            "text": "We plan and execute your transition to the cloud with minimal downtime, ensuring a secure and optimized environment on AWS, Azure, or Google Cloud."
          },
          {
            "icon": "⚙️",
            "title": "DevOps & Automation",
            "text": "Accelerate your development lifecycle with our CI/CD pipeline implementation, infrastructure-as-code, and containerization expertise."
          },
          {
            "icon": "🛡️",
            "title": "Proactive Managed Services",
            "text": "Our 24/7 monitoring, management, and support services ensure your infrastructure is always performing, secure, and cost-effective."
          }
        ]
      },
      {
        "type": "media_text",
        "variant": "image-left",
        "background": "light",
        "id": "why-us",
        "eyebrow": "YOUR STRATEGIC PARTNER",
        "heading": "A Partnership Approach to Digital Transformation",
        "body": "We don't just provide services; we become an extension of your team. Our process begins with a deep dive into your business goals to architect solutions that deliver real, measurable value.",
        "items": [
          {
            "title": "Tailored strategy based on your unique needs"
          },
          {
            "title": "Transparent project management and communication"
          },
          {
            "title": "Focus on long-term scalability and cost-efficiency"
          }
        ],
        "ctaLabel": "Discuss Your Project",
        "ctaHref": "#lead-form",
        "imagePrompt": "A professional IT consultant drawing a cloud architecture diagram on a glass whiteboard for two attentive clients in a modern, sunlit conference room."
      },
      {
        "type": "stats",
        "background": "dark",
        "items": [
          {
            "value": "99.99%",
            "label": "Guaranteed Uptime SLA"
          },
          {
            "value": "40%",
            "label": "Average Reduction in IT Costs"
          },
          {
            "value": "24/7/365",
            "label": "Expert Support"
          },
          {
            "value": "150+",
            "label": "Successful Enterprise Migrations"
          }
        ],
        "variant": "cards"
      },
      {
        "type": "testimonials",
        "background": "alt",
        "id": "testimonials",
        "heading": "What Our Clients Say",
        "items": [
          {
            "text": "CloudPinnacle's migration process was flawless. They handled everything with precision, and the post-migration support has been outstanding. Our infrastructure is more robust and scalable than ever before.",
            "author": "Jane Foster",
            "role": "CTO, InnovateCorp"
          },
          {
            "text": "The DevOps transformation led by CloudPinnacle has fundamentally changed how we build and ship software. Our deployment frequency has tripled, and our team can now focus on innovation instead of operations.",
            "author": "Carlos Ramirez",
            "role": "VP of Engineering, QuantumLeap"
          },
          {
            "text": "As a financial institution, security is paramount. The managed services from CloudPinnacle give us peace of mind. Their proactive monitoring and rapid response are second to none.",
            "author": "Samantha Chen",
            "role": "Director of IT, Apex Financial"
          }
        ]
      },
      {
        "type": "faq",
        "background": "light",
        "id": "faq",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "How do you ensure data security during cloud migration?",
            "text": "We follow a multi-layered security protocol, including data encryption in transit and at rest, strict access controls, and compliance with industry standards like SOC 2 and ISO 27001. A detailed security plan is established before any migration begins."
          },
          {
            "title": "What kind of downtime can we expect?",
            "text": "Our migration strategies are designed to minimize or completely eliminate downtime. We utilize techniques like blue-green deployments and phased rollouts, scheduled during off-peak hours, to ensure a seamless transition for your users."
          },
          {
            "title": "How is pricing structured for your managed services?",
            "text": "We offer flexible pricing models, including flat-rate monthly fees and consumption-based pricing, depending on the scope of services. We work with you to find a predictable, cost-effective plan that aligns with your budget."
          },
          {
            "title": "Which cloud platforms do you support?",
            "text": "Our team holds expert-level certifications and has extensive experience with all major cloud providers, including Amazon Web Services (AWS), Microsoft Azure, and Google Cloud Platform (GCP)."
          }
        ]
      },
      {
        "type": "cta",
        "variant": "band",
        "background": "primary",
        "heading": "Ready to Elevate Your IT Infrastructure?",
        "subheading": "Schedule a free, no-obligation consultation with our cloud experts today.",
        "ctaLabel": "Talk to an Expert",
        "ctaHref": "#lead-form"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "CloudPinnacle",
        "body": "Your trusted partner for enterprise-grade cloud, DevOps, and managed IT services.",
        "legal": "© 2023 CloudPinnacle Inc. All rights reserved.",
        "items": [
          {
            "title": "Privacy Policy",
            "href": "#"
          },
          {
            "title": "Terms of Service",
            "href": "#"
          }
        ],
        "variant": "centered"
      }
    ]
  },
  {
    "key": "corporate-logistics",
    "name": "Apex Logistics Landing Page",
    "category": "Corporate",
    "description": "Get a competitive quote for reliable, pan-India logistics, warehousing, and express freight services. We are your trusted supply chain partn",
    "theme": {
      "primary": "#0052CC",
      "accent": "#00B8D9",
      "dark": "#071936",
      "font": "Inter",
      "headingFont": "Poppins",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "Apex Logistics",
        "items": [
          {
            "title": "Services",
            "href": "#services"
          },
          {
            "title": "Our Network",
            "href": "#network"
          },
          {
            "title": "Why Us",
            "href": "#why-us"
          }
        ],
        "ctaLabel": "Request a Quote",
        "ctaHref": "#lead-form",
        "variant": "centered"
      },
      {
        "type": "hero",
        "variant": "split-form",
        "background": "gradient",
        "eyebrow": "RELIABLE & EFFICIENT",
        "heading": "Your Pan-India Logistics Partner. Seamlessly Delivered.",
        "subheading": "Get reliable, on-time express freight and warehousing solutions across the nation. Fill out the form for a fast, competitive quote.",
        "imagePrompt": "A dynamic photograph of a fleet of modern, white and blue semi-trucks driving on a clean highway at sunrise, symbolizing speed and efficiency. The sky is clear with warm morning light.",
        "formTitle": "Get a Free Quote",
        "formSubtitle": "Tell us your needs and we'll reply within one business day.",
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Company Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Work Email",
            "type": "email",
            "required": true,
            "width": "half"
          },
          {
            "label": "Phone Number",
            "type": "tel",
            "required": true,
            "width": "half"
          },
          {
            "label": "Service Required",
            "type": "select",
            "required": true,
            "options": [
              "Express Freight",
              "Warehousing & Distribution",
              "Full Supply Chain Solution",
              "Other"
            ]
          },
          {
            "label": "I agree to be contacted about this enquiry.",
            "type": "consent",
            "required": true
          }
        ],
        "formSubmitLabel": "Request My Quote",
        "successMessage": "Thank you! Your quote request has been sent. Our team will contact you shortly."
      },
      {
        "type": "logos",
        "background": "alt",
        "heading": "Powering Growth for India's Leading Businesses",
        "items": [
          {
            "title": "Innovate Corp"
          },
          {
            "title": "Quantum Industries"
          },
          {
            "title": "Stellar Goods"
          },
          {
            "title": "Meridian Textiles"
          },
          {
            "title": "Global Exports"
          }
        ]
      },
      {
        "type": "features",
        "variant": "icons",
        "background": "light",
        "id": "services",
        "heading": "Comprehensive Supply Chain Solutions",
        "subheading": "From first mile to last, we provide end-to-end logistics services to streamline your operations.",
        "items": [
          {
            "icon": "🚚",
            "title": "Express Freight",
            "text": "Accelerate your deliveries with our time-definite express freight services, ensuring your goods arrive on schedule, every time."
          },
          {
            "icon": "📦",
            "title": "Secure Warehousing",
            "text": "Utilize our state-of-the-art, secure warehousing facilities for storage, inventory management, and order fulfillment."
          },
          {
            "icon": "🔗",
            "title": "Integrated Logistics",
            "text": "Optimize your entire supply chain with our integrated solutions, combining transport, warehousing, and technology for maximum efficiency."
          }
        ]
      },
      {
        "type": "media_text",
        "variant": "image-left",
        "background": "alt",
        "id": "network",
        "eyebrow": "NATIONWIDE REACH",
        "heading": "Connecting Every Corner of India",
        "body": "Our extensive network of strategically located hubs and a modern fleet ensures that we can deliver your shipments anywhere in the country, efficiently and reliably.",
        "items": [
          {
            "title": "Strategic hubs in all major metro cities"
          },
          {
            "title": "Advanced tracking for real-time visibility"
          },
          {
            "title": "Optimized routes for faster transit times"
          }
        ],
        "imagePrompt": "A high-angle photograph of a large, modern logistics warehouse interior. The space is clean, well-lit, and filled with neatly organized pallets on tall racks. A few forklifts are in motion, operated by uniformed workers.",
        "ctaLabel": "Get Your Quote",
        "ctaHref": "#lead-form"
      },
      {
        "type": "stats",
        "background": "dark",
        "items": [
          {
            "value": "50+",
            "label": "Cities Served"
          },
          {
            "value": "99.8%",
            "label": "On-Time Delivery"
          },
          {
            "value": "2M+",
            "label": "Sq. Ft. Warehousing"
          },
          {
            "value": "24/7",
            "label": "Customer Support"
          }
        ]
      },
      {
        "type": "steps",
        "background": "light",
        "heading": "Get Started in 3 Simple Steps",
        "items": [
          {
            "title": "1. Submit Your Requirement",
            "text": "Fill out our quick quote form with your logistics needs. It takes less than two minutes."
          },
          {
            "title": "2. Receive a Custom Quote",
            "text": "Our logistics experts will analyze your request and provide a competitive, tailored quote within one business day."
          },
          {
            "title": "3. Ship with Confidence",
            "text": "Once you approve, we'll handle the rest, providing seamless service and real-time tracking from pickup to delivery."
          }
        ]
      },
      {
        "type": "testimonials",
        "background": "alt",
        "id": "why-us",
        "heading": "What Our Clients Say",
        "items": [
          {
            "text": "Apex Logistics transformed our supply chain. Their express freight service is incredibly reliable, and the real-time tracking gives us complete peace of mind. Our delivery times have improved by 30%.",
            "author": "Ravi Kumar",
            "role": "Operations Head, Stellar Goods"
          },
          {
            "text": "The professionalism and support from the Apex team are second to none. Their warehousing solution is flexible and has scaled perfectly with our business growth. Highly recommended.",
            "author": "Priya Sharma",
            "role": "Supply Chain Manager, Quantum Industries"
          }
        ]
      },
      {
        "type": "faq",
        "background": "light",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "What areas do you service across India?",
            "text": "We have a pan-India network covering all major metropolitan areas, state capitals, and industrial zones. Please contact us with your specific origin and destination for confirmation."
          },
          {
            "title": "How can I track my shipment?",
            "text": "Once your shipment is dispatched, you will receive a tracking number and a link to our online portal where you can monitor its progress in real-time, 24/7."
          },
          {
            "title": "What types of goods can you handle?",
            "text": "We handle a wide range of goods, including electronics, textiles, pharmaceuticals, automotive parts, and general merchandise. We do not handle hazardous materials or perishable goods without prior special arrangement."
          },
          {
            "title": "What is the typical timeframe for receiving a quote?",
            "text": "Our team aims to provide a detailed, competitive quote within one business day of receiving your complete requirements."
          }
        ],
        "variant": "split"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "Apex Logistics",
        "body": "Your trusted partner for seamless, reliable, and efficient supply chain solutions across India.",
        "legal": "© 2023 Apex Logistics. All rights reserved.",
        "items": [
          {
            "title": "Privacy Policy",
            "href": "#"
          },
          {
            "title": "Terms of Service",
            "href": "#"
          }
        ],
        "variant": "columns"
      }
    ]
  },
  {
    "key": "healthcare-checkup",
    "name": "Health Check-up Packages",
    "category": "Healthcare",
    "description": "Book a full-body health check-up with convenient home sample collection. Get a clear picture of your health with our comprehensive packages.",
    "theme": {
      "primary": "#3B82F6",
      "accent": "#10B981",
      "dark": "#1E293B",
      "font": "Inter",
      "headingFont": "DM Sans",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "Wellness First Hospital",
        "items": [
          {
            "title": "Packages",
            "href": "#packages"
          },
          {
            "title": "How It Works",
            "href": "#process"
          },
          {
            "title": "Testimonials",
            "href": "#testimonials"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Book Now",
        "ctaHref": "#lead-form",
        "variant": "simple"
      },
      {
        "type": "hero",
        "variant": "split-form",
        "background": "gradient",
        "eyebrow": "PROACTIVE HEALTHCARE AT YOUR DOORSTEP",
        "heading": "Your Health, Your Home, Your Peace of Mind",
        "subheading": "Book a comprehensive full-body health check-up today. Our certified phlebotomists will collect your samples from the comfort of your home. Simple, safe, and stress-free.",
        "items": [
          {
            "icon": "🛡️",
            "title": "NABL Accredited Labs"
          },
          {
            "icon": "🏠",
            "title": "Convenient Home Collection"
          },
          {
            "icon": "👨‍⚕️",
            "title": "Doctor-Verified Reports"
          }
        ],
        "formTitle": "Schedule Your Home Visit",
        "formSubtitle": "Fill in your details and our care team will contact you to confirm your appointment.",
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Mobile Number",
            "type": "tel",
            "required": true,
            "width": "half"
          },
          {
            "label": "Email Address",
            "type": "email",
            "required": true
          },
          {
            "label": "Select a Package",
            "type": "select",
            "required": true,
            "options": [
              "Basic Wellness Check",
              "Advanced Health Screen",
              "Comprehensive Life Profile"
            ]
          },
          {
            "label": "I agree to be contacted about this enquiry and to the Terms of Service.",
            "type": "consent",
            "required": true
          }
        ],
        "formSubmitLabel": "Book My Check-up",
        "successMessage": "Thank you! We've received your request and will call you shortly to confirm."
      },
      {
        "type": "logos",
        "background": "alt",
        "heading": "Trusted by Thousands for Accurate, Reliable Results",
        "items": [
          {
            "title": "NABL"
          },
          {
            "title": "ISO 9001 Certified"
          },
          {
            "title": "Safe-Health"
          },
          {
            "title": "National Health Board"
          },
          {
            "title": "CAP Accredited"
          }
        ]
      },
      {
        "type": "features",
        "variant": "icons",
        "background": "light",
        "heading": "Why Choose Our Home Health Check-up?",
        "subheading": "We combine medical expertise with unparalleled convenience to make proactive healthcare accessible to everyone.",
        "items": [
          {
            "icon": "🏠",
            "title": "Ultimate Convenience",
            "text": "No travel, no waiting rooms. Our certified professionals come to you at your chosen time."
          },
          {
            "icon": "🧪",
            "title": "Comprehensive Testing",
            "text": "Our packages cover a wide range of tests for a complete overview of your vitals, organ function, and more."
          },
          {
            "icon": "🔒",
            "title": "Hygienic & Safe",
            "text": "We adhere to strict hygiene protocols, using single-use, sterile equipment for every collection."
          },
          {
            "icon": "📊",
            "title": "Clear, Actionable Reports",
            "text": "Receive your easy-to-understand results online within 48 hours, with a free doctor consultation."
          },
          {
            "icon": "❤️",
            "title": "Caring Professionals",
            "text": "Our phlebotomists are not just skilled, but also trained to be gentle and empathetic."
          },
          {
            "icon": "📅",
            "title": "Flexible Scheduling",
            "text": "Book your appointment online 24/7. We offer early morning and weekend slots for your convenience."
          }
        ]
      },
      {
        "type": "steps",
        "background": "alt",
        "id": "process",
        "heading": "Your Simple Path to Better Health",
        "items": [
          {
            "title": "1. Book Your Package",
            "text": "Choose the health check-up package that suits your needs and schedule a home visit in under 2 minutes using our simple online form."
          },
          {
            "title": "2. Home Sample Collection",
            "text": "A certified and trained phlebotomist will arrive at your scheduled time to collect your samples with care and professionalism."
          },
          {
            "title": "3. Receive Digital Reports",
            "text": "Get your comprehensive, doctor-verified reports delivered securely to your email within 48 hours."
          },
          {
            "title": "4. Free Doctor Consultation",
            "text": "Discuss your report with one of our experienced doctors over a tele-consultation to understand your health better."
          }
        ]
      },
      {
        "type": "pricing",
        "background": "light",
        "id": "packages",
        "heading": "Find the Right Package for You",
        "items": [
          {
            "title": "Basic Wellness",
            "price": "₹1,299",
            "period": "/person",
            "text": "Ideal for a routine annual check-up to monitor essential health parameters.",
            "features": [
              "Complete Blood Count (CBC)",
              "Blood Sugar (Fasting)",
              "Kidney Function Test (KFT)",
              "Liver Function Test (LFT)",
              "Lipid Profile"
            ],
            "featured": false
          },
          {
            "title": "Advanced Care",
            "price": "₹2,499",
            "period": "/person",
            "text": "Our most popular package for a detailed assessment of your overall health.",
            "features": [
              "All Basic Wellness tests",
              "Thyroid Profile (T3, T4, TSH)",
              "Uric Acid",
              "Vitamin D & B12",
              "Urine Routine Analysis"
            ],
            "featured": true
          },
          {
            "title": "Comprehensive Life",
            "price": "₹4,999",
            "period": "/person",
            "text": "An in-depth screening for a complete picture, including key vitamins and cardiac risk markers.",
            "features": [
              "All Advanced Care tests",
              "HbA1c (Diabetes Marker)",
              "Iron Profile",
              "Hs-CRP (Cardiac Risk Marker)",
              "Calcium & Phosphorus"
            ],
            "featured": false
          }
        ]
      },
      {
        "type": "testimonials",
        "background": "dark",
        "id": "testimonials",
        "heading": "Trusted By Patients Like You",
        "items": [
          {
            "text": "The home collection service was a blessing. The technician was so professional and gentle. I didn't have to take a day off work or wait in a queue. Reports came right on time. Highly recommended!",
            "author": "Anjali S.",
            "role": "Working Professional, Mumbai"
          },
          {
            "text": "I booked the advanced package for my elderly parents. The entire process was incredibly smooth and convenient for them. The care and patience shown by the staff was truly commendable.",
            "author": "Rajesh Kumar",
            "role": "Software Engineer, Bangalore"
          },
          {
            "text": "As someone who is always anxious about needles, I was dreading this. But the phlebotomist was so calming and skilled, I barely felt a thing. The convenience of doing it at home is unbeatable.",
            "author": "Priya Menon",
            "role": "Homemaker, Delhi"
          }
        ],
        "variant": "single"
      },
      {
        "type": "faq",
        "background": "light",
        "id": "faq",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "Do I need to fast before the sample collection?",
            "text": "Yes, for most of our packages, a 10-12 hour fasting period is required for accurate results, especially for blood sugar and lipid profile tests. You can drink plain water during this time."
          },
          {
            "title": "How and when will I receive my reports?",
            "text": "You will receive a secure link to your digital reports via email and SMS within 24-48 hours of your sample collection."
          },
          {
            "title": "Is the home sample collection service safe?",
            "text": "Absolutely. All our phlebotomists are certified professionals who use new, single-use, sterile kits for every collection and follow strict hygiene and safety protocols."
          },
          {
            "title": "Are there any additional charges for home collection?",
            "text": "No, the prices shown for our packages are all-inclusive. There are no hidden fees or extra charges for the home sample collection service."
          },
          {
            "title": "What if my test results are abnormal?",
            "text": "All our packages include a free tele-consultation with a doctor who will explain your report in detail and guide you on the next steps if any values are outside the normal range."
          }
        ]
      },
      {
        "type": "cta",
        "variant": "band",
        "background": "primary",
        "heading": "Take the First Step Towards a Healthier You",
        "subheading": "Don't wait for symptoms. Proactive care is the key to a long and healthy life. Book your convenient home health check-up today.",
        "ctaLabel": "Schedule My Check-up Now",
        "ctaHref": "#lead-form"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "Wellness First Hospital",
        "body": "Your trusted partner in proactive and preventive healthcare. We bring world-class diagnostics to your doorstep.",
        "legal": "© 2024 Wellness First Healthcare. All rights reserved.",
        "items": [
          {
            "title": "Privacy Policy",
            "href": "#"
          },
          {
            "title": "Terms of Service",
            "href": "#"
          },
          {
            "title": "Contact Us",
            "href": "#"
          }
        ],
        "variant": "simple"
      }
    ]
  },
  {
    "key": "healthcare-dermatology",
    "name": "ClearSkin Online",
    "category": "Healthcare",
    "description": "Get expert diagnosis and personalized treatment plans for acne, eczema, psoriasis, and more from certified dermatologists. Book your video c",
    "theme": {
      "primary": "#4A90E2",
      "accent": "#50E3C2",
      "dark": "#1A253C",
      "font": "Inter",
      "headingFont": "Poppins",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "ClearSkin Online",
        "items": [
          {
            "title": "How It Works",
            "href": "#how-it-works"
          },
          {
            "title": "Conditions",
            "href": "#conditions"
          },
          {
            "title": "Testimonials",
            "href": "#testimonials"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Book Now",
        "ctaHref": "#lead-form",
        "variant": "dark"
      },
      {
        "type": "hero",
        "variant": "split-form",
        "background": "gradient",
        "eyebrow": "Welcome to ClearSkin Online",
        "heading": "Expert Dermatologist Care, From the Comfort of Your Home",
        "subheading": "Skip the waiting room. Connect with a board-certified dermatologist via video call and get a personalized treatment plan in as little as 24 hours.",
        "imagePrompt": "A bright, airy photo of a diverse group of smiling people with healthy, clear skin, looking confidently at the camera. Soft, natural light.",
        "formTitle": "Book Your Consultation",
        "formSubtitle": "Fill in your details to get started.",
        "formId": "lead-form",
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "full"
          },
          {
            "label": "Email Address",
            "type": "email",
            "required": true,
            "width": "half"
          },
          {
            "label": "Mobile Number",
            "type": "tel",
            "required": true,
            "width": "half"
          },
          {
            "label": "Primary Skin Concern",
            "type": "select",
            "required": true,
            "options": [
              "Acne & Breakouts",
              "Eczema or Dermatitis",
              "Rosacea",
              "Psoriasis",
              "Anti-Aging & Wrinkles",
              "Hair Loss",
              "Mole Check",
              "Other"
            ],
            "width": "full"
          },
          {
            "label": "I agree to be contacted about this enquiry and accept the Privacy Policy.",
            "type": "consent",
            "required": true,
            "width": "full"
          }
        ],
        "formSubmitLabel": "Request My Consultation",
        "successMessage": "Thank you! We've received your request and will be in touch shortly to confirm your appointment."
      },
      {
        "type": "features",
        "variant": "icons",
        "background": "alt",
        "heading": "Why Choose Online Dermatology?",
        "subheading": "Experience a new standard of skin care that's built around your life.",
        "items": [
          {
            "icon": "👩‍⚕️",
            "title": "Certified Experts",
            "text": "All our consultations are with board-certified dermatologists with years of experience."
          },
          {
            "icon": "💻",
            "title": "Utmost Convenience",
            "text": "Connect from anywhere. All you need is a smartphone, tablet, or computer with a camera."
          },
          {
            "icon": "📝",
            "title": "Personalized Plans",
            "text": "Receive a custom treatment plan, including prescriptions sent directly to your local pharmacy."
          }
        ]
      },
      {
        "type": "steps",
        "background": "light",
        "id": "how-it-works",
        "heading": "Clearer Skin in 3 Simple Steps",
        "items": [
          {
            "title": "1. Book Your Spot",
            "text": "Fill out our simple form with your details and primary skin concern. Choose a time that works for you."
          },
          {
            "title": "2. Video Consultation",
            "text": "Have a secure, private video call with your dermatologist. Discuss your concerns and medical history."
          },
          {
            "title": "3. Get Your Plan",
            "text": "Receive your diagnosis and a personalized treatment plan within 24 hours. Prescriptions are sent to your pharmacy."
          }
        ]
      },
      {
        "type": "media_text",
        "variant": "image-right",
        "background": "alt",
        "id": "conditions",
        "eyebrow": "Comprehensive Care",
        "heading": "We Treat a Wide Range of Skin Conditions",
        "body": "Our expert dermatologists are equipped to diagnose and treat many common and complex skin, hair, and nail issues. Get the right care for your specific needs.",
        "items": [
          {
            "title": "Acne, Rosacea, and Eczema"
          },
          {
            "title": "Psoriasis and Dermatitis"
          },
          {
            "title": "Hair Loss and Scalp Conditions"
          },
          {
            "title": "Anti-Aging and Preventative Care"
          }
        ],
        "imagePrompt": "A friendly female dermatologist with a warm smile, sitting at a modern desk and speaking to a patient on her laptop screen during a video call. The setting is a clean, professional clinic office with soft lighting.",
        "ctaLabel": "See All Conditions",
        "ctaHref": "#faq"
      },
      {
        "type": "testimonials",
        "background": "dark",
        "id": "testimonials",
        "heading": "Trusted by Thousands of Patients",
        "items": [
          {
            "text": "I was skeptical about an online doctor, but it was so easy and professional. My dermatologist was fantastic and my skin has never looked better. Highly recommend!",
            "author": "Sarah J.",
            "role": "Acne Patient"
          },
          {
            "text": "As a busy professional, finding time for appointments is tough. ClearSkin Online was a lifesaver. I got an appointment quickly and a prescription the same day. So convenient.",
            "author": "Michael B.",
            "role": "Eczema Patient"
          },
          {
            "text": "The level of care and follow-up was amazing. The doctor really listened to my concerns and created a plan that actually worked for my sensitive skin.",
            "author": "Emily R.",
            "role": "Rosacea Patient"
          }
        ]
      },
      {
        "type": "faq",
        "background": "light",
        "id": "faq",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "Are your dermatologists board-certified?",
            "text": "Yes, every single one of our doctors is a board-certified dermatologist based in the country, ensuring you receive the highest standard of medical care."
          },
          {
            "title": "Is my personal information secure?",
            "text": "Absolutely. We use HIPAA-compliant, encrypted technology for all communication and data storage to protect your privacy and personal health information."
          },
          {
            "title": "Can you prescribe medication?",
            "text": "Yes. If your dermatologist determines a prescription is necessary for your treatment plan, they can send it electronically to your preferred local pharmacy for easy pickup."
          },
          {
            "title": "What if I need a follow-up appointment?",
            "text": "Follow-up appointments are easy to schedule through our platform. Many of our treatment plans include a follow-up to monitor your progress and make any necessary adjustments."
          },
          {
            "title": "Is online dermatology effective?",
            "text": "For many common skin conditions, teledermatology is just as effective as an in-person visit. It's a proven, convenient way to receive expert care for conditions like acne, rashes, eczema, and more."
          }
        ],
        "variant": "split"
      },
      {
        "type": "cta",
        "variant": "band",
        "background": "primary",
        "heading": "Ready for Healthier, Clearer Skin?",
        "subheading": "Your journey to better skin starts here. Book your online consultation today.",
        "ctaLabel": "Book My Consultation",
        "ctaHref": "#lead-form"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "ClearSkin Online",
        "body": "Providing accessible, professional dermatological care to help you feel confident in your own skin.",
        "legal": "© 2024 ClearSkin Online. All rights reserved. Medical services provided by independent professional associations.",
        "items": [
          {
            "title": "Privacy Policy",
            "href": "#"
          },
          {
            "title": "Terms of Service",
            "href": "#"
          },
          {
            "title": "Contact Us",
            "href": "#"
          }
        ],
        "variant": "centered"
      }
    ]
  },
  {
    "key": "education-datascience",
    "name": "Data Science Certification Program",
    "category": "Education",
    "description": "Launch your career with our top-rated online data science certification. Learn with live classes, build real-world projects, and get dedicat",
    "theme": {
      "primary": "#0A68F4",
      "accent": "#F9C851",
      "dark": "#0D1128",
      "font": "Inter",
      "headingFont": "Poppins",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "DataLeap Academy",
        "items": [
          {
            "title": "Program",
            "href": "#program"
          },
          {
            "title": "Projects",
            "href": "#projects"
          },
          {
            "title": "Testimonials",
            "href": "#testimonials"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Apply Now",
        "ctaHref": "#lead-form",
        "variant": "simple"
      },
      {
        "type": "hero",
        "variant": "split-image",
        "background": "gradient",
        "eyebrow": "BECOME A DATA SCIENTIST IN 24 WEEKS",
        "heading": "Launch Your Career in Data Science",
        "subheading": "Master in-demand skills with our intensive online certification program featuring live classes, hands-on projects, and dedicated placement support.",
        "ctaLabel": "Download Syllabus",
        "ctaHref": "#lead-form",
        "secondaryCtaLabel": "Talk to an Advisor",
        "secondaryCtaHref": "#lead-form",
        "imagePrompt": "A diverse group of young professionals collaborating around a large digital screen displaying complex data visualizations. The mood is focused and innovative, with modern office lighting.",
        "items": [
          {
            "icon": "Live Interactive Classes",
            "title": "Live Interactive Classes"
          },
          {
            "icon": "1-on-1 Mentorship",
            "title": "1-on-1 Mentorship"
          },
          {
            "icon": "100% Placement Assistance",
            "title": "100% Placement Assistance"
          }
        ]
      },
      {
        "type": "logos",
        "background": "alt",
        "heading": "Our Alumni Work at Leading Tech Companies",
        "items": [
          {
            "title": "Google"
          },
          {
            "title": "Amazon"
          },
          {
            "title": "Microsoft"
          },
          {
            "title": "Netflix"
          },
          {
            "title": "Spotify"
          },
          {
            "title": "Salesforce"
          }
        ]
      },
      {
        "type": "features",
        "variant": "icons",
        "background": "light",
        "id": "program",
        "heading": "The Complete Toolkit for a Data Science Career",
        "subheading": "We provide a comprehensive learning ecosystem designed for your success.",
        "items": [
          {
            "icon": "🎓",
            "title": "Expert-Led Live Classes",
            "text": "Learn complex concepts from industry veterans in real-time, ask questions, and collaborate with peers in an interactive online classroom."
          },
          {
            "icon": "💻",
            "title": "Real-World Project Portfolio",
            "text": "Go beyond theory by building and deploying machine learning models on datasets from top companies to create a portfolio that impresses recruiters."
          },
          {
            "icon": "🚀",
            "title": "Dedicated Placement Support",
            "text": "Get end-to-end career assistance, from resume building and mock interviews to exclusive access to our network of hiring partners."
          }
        ]
      },
      {
        "type": "media_text",
        "variant": "image-right",
        "background": "alt",
        "id": "projects",
        "eyebrow": "HANDS-ON LEARNING",
        "heading": "Build a Portfolio That Gets You Hired",
        "body": "Our curriculum is built around a project-based approach. You won't just watch videos; you'll build, test, and deploy machine learning models. This hands-on experience is critical for showcasing your skills to potential employers.\n\nKey learning areas include:",
        "items": [
          {
            "title": "Python for Data Science & SQL"
          },
          {
            "title": "Machine Learning & Predictive Modeling"
          },
          {
            "title": "Big Data Technologies & Cloud Deployment"
          },
          {
            "title": "Data Visualization with Tableau"
          }
        ],
        "imagePrompt": "A focused young woman coding on her laptop with complex data graphs and charts visible on a second monitor. The setting is a modern, well-lit home office, conveying a sense of productivity and deep work.",
        "ctaLabel": "See All Projects",
        "ctaHref": "#lead-form"
      },
      {
        "type": "testimonials",
        "variant": "cards",
        "background": "dark",
        "id": "testimonials",
        "heading": "Don't Just Take Our Word For It",
        "items": [
          {
            "text": "The project-based curriculum was a game-changer. I could confidently discuss my work in interviews and landed a Data Analyst role at a major startup within a month of graduating.",
            "author": "Priya Sharma",
            "role": "Data Analyst, FinTech Startup"
          },
          {
            "text": "The placement team was incredibly supportive. They helped me revamp my resume and conducted several mock interviews that prepared me for the real thing. I received two offers!",
            "author": "David Chen",
            "role": "Machine Learning Engineer, E-commerce Giant"
          },
          {
            "text": "Coming from a non-tech background, I was nervous. But the instructors and mentors were patient and the curriculum was structured perfectly. This program truly democratizes data science.",
            "author": "Aisha Khan",
            "role": "Data Scientist, Healthcare Inc."
          }
        ]
      },
      {
        "type": "lead_form",
        "variant": "split-text",
        "background": "light",
        "id": "lead-form",
        "heading": "Start Your Application Today",
        "subheading": "Take the first step towards your data science career.",
        "body": "Fill out the application to speak with an admissions counselor. We'll review your profile and get in touch within 24 hours to discuss your career goals and how our program can help you achieve them.",
        "items": [
          {
            "title": "Personalized career path guidance."
          },
          {
            "title": "Detailed program syllabus and structure."
          },
          {
            "title": "Information on financing and scholarship options."
          }
        ],
        "formTitle": "Apply Now",
        "formSubtitle": "It takes less than 60 seconds.",
        "formSteps": [
          "Personal Details",
          "Professional Background"
        ],
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "half",
            "step": 1
          },
          {
            "label": "Email Address",
            "type": "email",
            "required": true,
            "width": "half",
            "step": 1
          },
          {
            "label": "Mobile Number",
            "type": "tel",
            "required": true,
            "step": 1
          },
          {
            "label": "Highest Qualification",
            "type": "select",
            "required": true,
            "options": [
              "Bachelor's Degree",
              "Master's Degree",
              "PhD",
              "Other"
            ],
            "width": "half",
            "step": 2
          },
          {
            "label": "Years of Work Experience",
            "type": "select",
            "required": true,
            "options": [
              "Student / Fresher",
              "0-2 Years",
              "2-5 Years",
              "5+ Years"
            ],
            "width": "half",
            "step": 2
          },
          {
            "label": "What is your primary career goal?",
            "type": "textarea",
            "required": false,
            "step": 2
          },
          {
            "label": "I agree to be contacted by DataLeap Academy regarding my application.",
            "type": "consent",
            "required": true,
            "step": 2
          }
        ],
        "formSubmitLabel": "Submit Application",
        "successMessage": "Thank you! Your application has been received. Our team will contact you shortly."
      },
      {
        "type": "faq",
        "background": "alt",
        "id": "faq",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "Do I need a programming background to enroll?",
            "text": "No, you don't. The program is designed for beginners and starts with the fundamentals of Python and statistics before moving to advanced topics."
          },
          {
            "title": "Are the classes live or pre-recorded?",
            "text": "All our core classes are conducted live to ensure an interactive and engaging learning experience. Recordings are provided for you to review at any time."
          },
          {
            "title": "What kind of placement support do you offer?",
            "text": "We offer comprehensive placement support including resume and LinkedIn profile building, mock interviews with industry experts, and exclusive access to job openings from our network of 200+ hiring partners."
          },
          {
            "title": "Are there any financing or EMI options available?",
            "text": "Yes, we have several flexible EMI options and partnerships with leading financial institutions to make the program more accessible. Please mention this to your admissions counselor for details."
          },
          {
            "title": "How much time do I need to commit per week?",
            "text": "We recommend a commitment of 10-12 hours per week, which includes live classes, self-study, and project work, to get the most out of the program."
          }
        ]
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "DataLeap Academy",
        "body": "Empowering the next generation of data professionals.",
        "legal": "© 2023 DataLeap Academy. All rights reserved.",
        "items": [
          {
            "title": "Privacy Policy",
            "href": "#"
          },
          {
            "title": "Terms of Service",
            "href": "#"
          },
          {
            "title": "Contact Us",
            "href": "#"
          }
        ],
        "variant": "columns"
      }
    ]
  },
  {
    "key": "education-preschool",
    "name": "Blossom Buds Pre-School Landing Page",
    "category": "Education",
    "description": "Discover a warm, friendly pre-school with play-based learning and a safe campus. Admissions are now open. Book your personal campus tour tod",
    "theme": {
      "primary": "#FF6B6B",
      "accent": "#4ECDC4",
      "dark": "#2C3E50",
      "font": "Poppins",
      "headingFont": "Poppins",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "Blossom Buds",
        "items": [
          {
            "title": "Our Philosophy",
            "href": "#philosophy"
          },
          {
            "title": "Facilities",
            "href": "#facilities"
          },
          {
            "title": "Testimonials",
            "href": "#testimonials"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Book a Tour",
        "ctaHref": "#lead-form",
        "variant": "centered"
      },
      {
        "type": "hero",
        "variant": "split-form",
        "background": "gradient",
        "id": "lead-form",
        "eyebrow": "Admissions Open for 2024-2025",
        "heading": "A Joyful Start to a Lifelong Love of Learning",
        "subheading": "Welcome to Blossom Buds, a nurturing pre-school where your child's curiosity is celebrated. Discover our play-based approach in a safe, caring environment. Schedule your personal campus tour today!",
        "imagePrompt": "A bright, sunlit pre-school classroom with a small group of diverse, happy toddlers engaged in playing with colorful wooden blocks. A friendly female teacher is kneeling beside them, smiling warmly. The setting is modern, clean, and inviting.",
        "formTitle": "Book Your Campus Tour",
        "formSubtitle": "We can't wait to meet you!",
        "formFields": [
          {
            "label": "Parent's Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Child's Age",
            "type": "number",
            "required": true,
            "width": "half"
          },
          {
            "label": "Mobile Number",
            "type": "tel",
            "required": true,
            "width": "half"
          },
          {
            "label": "Email Address",
            "type": "email",
            "required": true,
            "width": "half"
          },
          {
            "label": "Preferred Tour Date",
            "type": "date",
            "required": false
          },
          {
            "label": "I agree to be contacted about my enquiry and receive updates from Blossom Buds.",
            "type": "consent",
            "required": true
          }
        ],
        "formSubmitLabel": "Schedule My Visit",
        "successMessage": "Thank you! We've received your request and will contact you shortly to confirm your tour."
      },
      {
        "type": "features",
        "variant": "icons",
        "background": "alt",
        "id": "philosophy",
        "heading": "The Foundation for a Bright Future",
        "subheading": "Our holistic approach is designed to nurture every aspect of your child's development in a warm and stimulating environment.",
        "items": [
          {
            "icon": "🎈",
            "title": "Play-Based Learning",
            "text": "We believe children learn best through play. Our curriculum sparks curiosity and creativity through hands-on activities."
          },
          {
            "icon": "🛡️",
            "title": "Safe & Secure Campus",
            "text": "Your child's safety is our top priority, with secure access, CCTV monitoring, and highly trained staff."
          },
          {
            "icon": "🧑‍🏫",
            "title": "Passionate Educators",
            "text": "Our team of experienced and caring teachers is dedicated to providing personalized attention to every child."
          },
          {
            "icon": "🍎",
            "title": "Nutritious Meals",
            "text": "We provide wholesome, balanced meals and snacks prepared fresh daily to fuel growing bodies and minds."
          },
          {
            "icon": "🎨",
            "title": "Creative Expression",
            "text": "From painting to music, we encourage children to express themselves and explore their artistic talents."
          },
          {
            "icon": "🌳",
            "title": "Outdoor Exploration",
            "text": "Our spacious play areas provide the perfect setting for physical development and a love for the outdoors."
          }
        ]
      },
      {
        "type": "media_text",
        "variant": "image-left",
        "background": "light",
        "id": "facilities",
        "eyebrow": "Our Environment",
        "heading": "A Nurturing Second Home for Your Child",
        "body": "We've created a space that feels like a home away from home. Every classroom is bright, spacious, and filled with age-appropriate learning materials. Our low student-to-teacher ratio ensures your child receives the individual attention they need to flourish.",
        "items": [
          {
            "title": "Bright, airy classrooms"
          },
          {
            "title": "Age-appropriate learning zones"
          },
          {
            "title": "Hygienic and child-friendly facilities"
          },
          {
            "title": "Dedicated nap and quiet areas"
          }
        ],
        "imagePrompt": "A wide-angle photograph of a modern pre-school library area. Soft, colorful beanbags are on the floor, and low shelves are filled with children's books. A young boy and girl are sitting together, looking at a picture book. The lighting is soft and natural from a large window.",
        "ctaLabel": "Book a Tour to See For Yourself",
        "ctaHref": "#lead-form"
      },
      {
        "type": "stats",
        "background": "dark",
        "items": [
          {
            "value": "1:5",
            "label": "Teacher-to-Child Ratio"
          },
          {
            "value": "10+",
            "label": "Years of Early Childhood Education"
          },
          {
            "value": "100%",
            "label": "Trained in First-Aid & Safety"
          },
          {
            "value": "500+",
            "label": "Happy Families Served"
          }
        ]
      },
      {
        "type": "testimonials",
        "variant": "single",
        "background": "alt",
        "id": "testimonials",
        "heading": "What Our Parents Say",
        "items": [
          {
            "text": "Sending our daughter to Blossom Buds was the best decision we've made. She has blossomed socially and academically. The teachers are so caring and provide wonderful updates. We couldn't be happier!",
            "author": "Sarah & Tom L.",
            "role": "Parents of Maya, 4"
          },
          {
            "text": "The campus is so safe and the play-based learning approach is fantastic. My son is excited to go to school every single morning, and he comes home full of stories about his day. Thank you, Blossom Buds team!",
            "author": "Priya Singh",
            "role": "Parent of Aarav, 3"
          }
        ]
      },
      {
        "type": "faq",
        "background": "light",
        "id": "faq",
        "heading": "Your Questions, Answered",
        "items": [
          {
            "title": "What is the admission process?",
            "text": "The first step is to book a campus tour using the form on this page. During the tour, you'll meet our team, see our facilities, and we'll guide you through the simple application and enrollment process."
          },
          {
            "title": "What are your safety and security protocols?",
            "text": "We have a comprehensive safety policy that includes controlled campus access, 24/7 CCTV surveillance, regular staff training in first-aid and emergency procedures, and strict hygiene standards."
          },
          {
            "title": "What is your educational philosophy?",
            "text": "We follow a play-based and inquiry-led curriculum. We believe that children are natural learners, and our role is to provide a stimulating environment where they can explore, experiment, and discover at their own pace."
          },
          {
            "title": "What are the school's timings and yearly calendar?",
            "text": "We offer flexible programs, including full-day and half-day options. Our standard hours are 9:00 AM to 3:00 PM, with extended daycare available. We'll provide a detailed calendar during your campus tour."
          }
        ],
        "variant": "split"
      },
      {
        "type": "cta",
        "variant": "band",
        "background": "primary",
        "heading": "Ready to See the Magic for Yourself?",
        "subheading": "Spaces are limited and filling up fast. Schedule your personal tour today to secure your child's place at Blossom Buds.",
        "ctaLabel": "Book Your Campus Tour Now",
        "ctaHref": "#lead-form"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "Blossom Buds Pre-School",
        "body": "A nurturing start for a lifetime of learning. We look forward to welcoming you to our family.",
        "legal": "© 2024 Blossom Buds Pre-School. All Rights Reserved.",
        "items": [
          {
            "title": "Privacy Policy",
            "href": "#"
          },
          {
            "title": "Terms of Service",
            "href": "#"
          }
        ],
        "variant": "simple"
      }
    ]
  },
  {
    "key": "leadgen-homeloan",
    "name": "Home Loan Balance Transfer",
    "category": "Lead Generation",
    "description": "Lower your EMIs by transferring your existing home loan to us. Check your eligibility online in 2 minutes with our simple process and get th",
    "theme": {
      "primary": "#1E88E5",
      "accent": "#FFB300",
      "dark": "#1A237E",
      "font": "Inter",
      "headingFont": "Poppins",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "LoanSwitch",
        "items": [
          {
            "title": "Benefits",
            "href": "#benefits"
          },
          {
            "title": "Process",
            "href": "#process"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Check Eligibility",
        "ctaHref": "#lead-form",
        "variant": "simple"
      },
      {
        "type": "hero",
        "variant": "split-form",
        "background": "gradient",
        "eyebrow": "STUCK WITH HIGH EMIS?",
        "heading": "Switch Your Home Loan, Unlock Huge Savings.",
        "subheading": "Transfer your existing home loan balance to a lower interest rate and reduce your monthly payments. Check your eligibility in just 2 minutes.",
        "items": [
          {
            "icon": "✅",
            "title": "Lower Interest Rates"
          },
          {
            "icon": "✅",
            "title": "Reduced Monthly EMI"
          },
          {
            "icon": "✅",
            "title": "Top-up Loan Available"
          }
        ],
        "formAnchor": "lead-form",
        "formTitle": "Check Your Eligibility",
        "formSteps": [
          "Loan Details",
          "Personal Details"
        ],
        "formFields": [
          {
            "label": "Outstanding Loan Amount (₹)",
            "type": "number",
            "required": true,
            "placeholder": "e.g., 5000000",
            "step": 1
          },
          {
            "label": "Current Interest Rate (%)",
            "type": "number",
            "required": true,
            "placeholder": "e.g., 9.5",
            "step": 1
          },
          {
            "label": "Employment Type",
            "type": "select",
            "required": true,
            "options": [
              "Salaried",
              "Self-Employed Professional",
              "Self-Employed Business"
            ],
            "step": 1
          },
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "placeholder": "Enter your full name",
            "step": 2,
            "width": "half"
          },
          {
            "label": "Mobile Number",
            "type": "tel",
            "required": true,
            "placeholder": "Enter 10-digit mobile number",
            "step": 2,
            "otp": true,
            "width": "half"
          },
          {
            "label": "Email Address",
            "type": "email",
            "required": true,
            "placeholder": "Enter your email",
            "step": 2
          },
          {
            "label": "I agree to be contacted by LoanSwitch and its partners.",
            "type": "consent",
            "required": true,
            "step": 2
          }
        ],
        "formSubmitLabel": "Get My Offers",
        "successMessage": "Thank you! Our loan expert will contact you shortly with the best offers."
      },
      {
        "type": "logos",
        "background": "alt",
        "heading": "Trusted by India's Leading Banks & Financial Institutions",
        "items": [
          {
            "title": "HDFC Bank"
          },
          {
            "title": "ICICI Bank"
          },
          {
            "title": "Axis Bank"
          },
          {
            "title": "State Bank of India"
          },
          {
            "title": "Bajaj Finserv"
          },
          {
            "title": "LIC Housing Finance"
          }
        ]
      },
      {
        "type": "features",
        "variant": "cards",
        "background": "light",
        "anchor": "benefits",
        "heading": "More Than Just Lower Rates",
        "subheading": "Discover the advantages of transferring your home loan balance to us.",
        "items": [
          {
            "icon": "📉",
            "title": "Lower Interest Rates",
            "text": "Get access to some of the most competitive interest rates in the market, starting from just 8.40% p.a."
          },
          {
            "icon": "💰",
            "title": "Reduce Your EMI",
            "text": "A lower interest rate directly translates to a lower monthly EMI, freeing up your cash flow for other needs."
          },
          {
            "icon": "➕",
            "title": "Avail a Top-Up Loan",
            "text": "Need extra funds? Get an additional top-up loan on your existing home loan at attractive rates."
          },
          {
            "icon": "📄",
            "title": "Minimal Paperwork",
            "text": "Our digital-first process ensures your application is processed quickly with minimal documentation."
          },
          {
            "icon": "⏳",
            "title": "Flexible Repayment Tenure",
            "text": "Choose a repayment tenure that suits your financial situation, with options up to 30 years."
          },
          {
            "icon": "🤫",
            "title": "No Hidden Charges",
            "text": "We believe in complete transparency. All our fees and charges are communicated upfront."
          }
        ]
      },
      {
        "type": "steps",
        "background": "alt",
        "anchor": "process",
        "heading": "Our Simple 4-Step Transfer Process",
        "items": [
          {
            "title": "1. Check Eligibility",
            "text": "Fill out the form above with your current loan details to instantly see your potential savings and offers."
          },
          {
            "title": "2. Submit Documents",
            "text": "Our loan expert will guide you through the required documents, which you can upload online."
          },
          {
            "title": "3. Verification & Sanction",
            "text": "We'll quickly verify your details and property documents to provide a final loan sanction."
          },
          {
            "title": "4. Loan Disbursal",
            "text": "Once approved, we pay off your old lender and your new, lower-EMI loan with us begins."
          }
        ]
      },
      {
        "type": "media_text",
        "variant": "image-left",
        "background": "light",
        "eyebrow": "MAXIMIZE YOUR SAVINGS",
        "heading": "See How Much You Could Save",
        "body": "Even a small reduction in your interest rate can lead to significant savings over the loan's tenure. Use our expertise to find the perfect offer that reduces your financial burden.",
        "items": [
          {
            "title": "Calculate potential savings instantly."
          },
          {
            "title": "Get personalized offers from multiple lenders."
          },
          {
            "title": "Receive expert guidance at every step."
          }
        ],
        "imagePrompt": "A close-up shot of a calculator showing large numbers, with a pen and home loan documents on a wooden desk. The mood is professional and focused on financial planning.",
        "ctaLabel": "Calculate My Savings",
        "ctaHref": "#lead-form"
      },
      {
        "type": "testimonials",
        "background": "dark",
        "heading": "Don't Just Take Our Word For It",
        "items": [
          {
            "text": "The process was unbelievably smooth. I was hesitant at first, but the team at LoanSwitch helped me save nearly ₹8,000 on my EMI every month! Highly recommended.",
            "author": "Priya Sharma",
            "role": "Software Engineer, Bangalore"
          },
          {
            "text": "I managed to get a top-up loan for my home renovation along with the balance transfer. The interest rate was much better than my previous bank. Excellent service.",
            "author": "Amit Patel",
            "role": "Business Owner, Mumbai"
          },
          {
            "text": "I was guided through every step, from documentation to the final transfer. The transparency and professionalism are commendable. I'm saving lakhs over my loan tenure.",
            "author": "Sunita Rao",
            "role": "Marketing Manager, Delhi"
          }
        ]
      },
      {
        "type": "faq",
        "background": "light",
        "anchor": "faq",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "What is a home loan balance transfer?",
            "text": "A home loan balance transfer is the process of moving your outstanding home loan from your current lender to a new one that offers a lower interest rate or better loan terms."
          },
          {
            "title": "What are the eligibility criteria for a balance transfer?",
            "text": "Eligibility typically depends on your credit score, repayment history, property value, and income. A good repayment track record of at least 12 months with your existing lender is usually required."
          },
          {
            "title": "Will there be any charges for transferring my home loan?",
            "text": "Yes, there is typically a processing fee charged by the new lender, which is usually 0.5% to 1% of the loan amount. Your old lender might also charge a foreclosure fee, although this is not applicable for floating-rate loans."
          },
          {
            "title": "Can I get a top-up loan with a balance transfer?",
            "text": "Absolutely. Most lenders offer an additional top-up amount on your home loan during a balance transfer, which can be used for any personal or professional need."
          },
          {
            "title": "How long does the entire process take?",
            "text": "The home loan balance transfer process typically takes between 15 to 20 working days, subject to the submission of all required documents and successful verification."
          }
        ]
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "LoanSwitch",
        "body": "Your trusted partner in finding the best home loan solutions. We simplify the process of loan transfers, ensuring you get the maximum savings with minimum hassle.",
        "legal": "© 2023 LoanSwitch. All rights reserved. Interest rates are subject to market conditions and eligibility. We are a loan aggregator and not a lender.",
        "items": [
          {
            "title": "Privacy Policy",
            "href": "#"
          },
          {
            "title": "Terms of Service",
            "href": "#"
          }
        ],
        "variant": "centered"
      }
    ]
  },
  {
    "key": "leadgen-insurance",
    "name": "Term Life Insurance Quotes",
    "category": "Lead Generation",
    "description": "Quickly compare term life insurance plans from top providers. Get a personalized, no-obligation quote in just 2 minutes and secure your fami",
    "theme": {
      "primary": "#005A9C",
      "accent": "#FDB813",
      "dark": "#0D2235",
      "font": "DM Sans",
      "headingFont": "Poppins",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "SecureQuote",
        "items": [
          {
            "title": "How It Works",
            "href": "#how-it-works"
          },
          {
            "title": "Why Us",
            "href": "#why-us"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Get Free Quote",
        "ctaHref": "#lead-form",
        "variant": "dark"
      },
      {
        "type": "hero",
        "variant": "split-image",
        "background": "gradient",
        "eyebrow": "Protect What Matters Most",
        "heading": "Secure Your Family's Future with the Right Term Life Insurance",
        "subheading": "Compare personalized quotes from Canada's top insurers in under 2 minutes. It's fast, free, and completely confidential.",
        "ctaLabel": "Compare Quotes Now",
        "ctaHref": "#lead-form",
        "secondaryCtaLabel": "Learn More",
        "secondaryCtaHref": "#how-it-works",
        "imagePrompt": "A happy, diverse family with young children laughing together in a bright, sunlit living room, conveying a sense of security and happiness.",
        "items": [
          {
            "icon": "✅",
            "title": "100% Free Quotes"
          },
          {
            "icon": "🏆",
            "title": "Top-Rated Insurers"
          },
          {
            "icon": "🔒",
            "title": "Secure & Private"
          }
        ]
      },
      {
        "type": "logos",
        "background": "alt",
        "heading": "Compare Plans from Canada's Most Trusted Insurers",
        "items": [
          {
            "title": "Sun Life"
          },
          {
            "title": "Manulife"
          },
          {
            "title": "Canada Life"
          },
          {
            "title": "BMO Insurance"
          },
          {
            "title": "RBC Insurance"
          },
          {
            "title": "Desjardins"
          }
        ]
      },
      {
        "type": "steps",
        "background": "light",
        "id": "how-it-works",
        "heading": "Get Your Personalized Quote in 3 Simple Steps",
        "items": [
          {
            "title": "1. Provide Your Details",
            "text": "Fill out our short, secure form with some basic information about yourself and your needs. It only takes two minutes."
          },
          {
            "title": "2. Compare Your Options",
            "text": "Instantly see and compare customized quotes from leading insurance providers, all in one place."
          },
          {
            "title": "3. Connect with an Advisor",
            "text": "A licensed advisor will help you understand your options and finalize the policy that's perfect for you, with no obligation."
          }
        ]
      },
      {
        "type": "features",
        "variant": "bento",
        "background": "alt",
        "id": "why-us",
        "heading": "The Smart Way to Buy Life Insurance",
        "subheading": "We make finding the right coverage simple, transparent, and affordable.",
        "items": [
          {
            "icon": "💰",
            "title": "Save Money",
            "text": "By comparing multiple insurers, our users save an average of 40% on their premiums."
          },
          {
            "icon": "🤔",
            "title": "Unbiased Advice",
            "text": "We're not owned by an insurance company. Our licensed advisors provide impartial guidance focused on your needs."
          },
          {
            "icon": "⚡",
            "title": "Fast & Simple",
            "text": "No lengthy paperwork or medical exams required to get a quote. See your rates online in minutes."
          },
          {
            "icon": "🤝",
            "title": "Expert Support",
            "text": "Our team of non-commissioned experts is here to answer your questions and guide you every step of the way."
          },
          {
            "icon": "🔐",
            "title": "Bank-Level Security",
            "text": "Your privacy is our priority. We use industry-leading encryption to keep your personal information safe."
          },
          {
            "icon": "❤️",
            "title": "Peace of Mind",
            "text": "Rest easy knowing your loved ones are financially protected, no matter what the future holds."
          }
        ]
      },
      {
        "type": "lead_form",
        "variant": "split-text",
        "background": "dark",
        "id": "lead-form",
        "heading": "Find Your Best Rate Today",
        "body": "This short form is the first step to securing peace of mind. Let's find a plan that fits your life and your budget.",
        "items": [
          {
            "title": "Personalized quotes, not estimates."
          },
          {
            "title": "No-obligation, pressure-free advice."
          },
          {
            "title": "Access exclusive online discounts."
          }
        ],
        "formTitle": "Get Your Free Quote",
        "formSubtitle": "It takes less than 2 minutes.",
        "formSteps": [
          "Your Details",
          "Your Needs"
        ],
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "half",
            "step": 1
          },
          {
            "label": "Email Address",
            "type": "email",
            "required": true,
            "width": "half",
            "step": 1
          },
          {
            "label": "Phone Number",
            "type": "tel",
            "required": true,
            "step": 1
          },
          {
            "label": "Date of Birth",
            "type": "date",
            "required": true,
            "width": "half",
            "step": 2
          },
          {
            "label": "Desired Coverage",
            "type": "select",
            "required": true,
            "width": "half",
            "options": [
              "$250,000",
              "$500,000",
              "$750,000",
              "$1,000,000",
              "$1,500,000+"
            ],
            "step": 2
          },
          {
            "label": "Policy Term Length",
            "type": "select",
            "required": true,
            "options": [
              "10 Years",
              "20 Years",
              "30 Years"
            ],
            "step": 2
          },
          {
            "label": "I agree to be contacted by a licensed insurance advisor about this enquiry.",
            "type": "consent",
            "required": true,
            "step": 2
          }
        ],
        "formSubmitLabel": "See My Quotes",
        "successMessage": "Thank you! We're finding the best quotes for you. A licensed advisor will contact you shortly to review your options."
      },
      {
        "type": "testimonials",
        "background": "alt",
        "heading": "Trusted by Thousands of Canadians",
        "items": [
          {
            "text": "The process was so much simpler than I expected. I compared quotes and found a great policy for my family in one afternoon. Highly recommend!",
            "author": "Sarah K.",
            "role": "Toronto, ON"
          },
          {
            "text": "SecureQuote saved me over $30 a month compared to the quote I got from my bank. The advisor was incredibly helpful and not pushy at all.",
            "author": "Mark R.",
            "role": "Calgary, AB"
          },
          {
            "text": "As a new dad, getting life insurance was a top priority. Their platform made it easy to understand my options and get covered quickly. A huge weight off my shoulders.",
            "author": "David L.",
            "role": "Vancouver, BC"
          }
        ]
      },
      {
        "type": "faq",
        "background": "light",
        "id": "faq",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "What is term life insurance?",
            "text": "Term life insurance provides coverage for a specific period of time (the 'term'), such as 10, 20, or 30 years. If the insured person passes away during this term, a tax-free death benefit is paid to their beneficiaries. It's typically the most affordable type of life insurance."
          },
          {
            "title": "How much coverage do I need?",
            "text": "A common rule of thumb is 10-12 times your annual income. However, the right amount depends on your individual circumstances, including your mortgage, debts, children's education costs, and future income needs for your family. Our advisors can help you calculate the perfect amount."
          },
          {
            "title": "Is a medical exam always required?",
            "text": "Not always. Many insurers now offer 'no medical' or 'simplified issue' policies for coverage amounts up to a certain limit, often around $1,000,000. Your eligibility depends on your age and answers to health questions on the application."
          },
          {
            "title": "Are the quotes I receive accurate?",
            "text": "Yes, the quotes are based on the information you provide. They are real-time rates from the insurance companies themselves. The final premium is confirmed after the insurer completes the underwriting process."
          },
          {
            "title": "Is there any cost or obligation to get a quote?",
            "text": "No. Our service is 100% free to use. There is no obligation to purchase a policy. We're here to help you find the information you need to make the best decision for your family."
          }
        ],
        "variant": "split"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "SecureQuote",
        "body": "Your trusted partner in securing your family's financial future. We make comparing and buying life insurance simple.",
        "legal": "© 2024 SecureQuote Inc. All rights reserved. SecureQuote is a licensed insurance brokerage. The information provided is not intended to be financial advice. Please consult with a licensed professional.",
        "items": [
          {
            "title": "Privacy Policy",
            "href": "#"
          },
          {
            "title": "Terms of Service",
            "href": "#"
          },
          {
            "title": "Contact Us",
            "href": "#"
          }
        ],
        "variant": "columns"
      }
    ]
  },
  {
    "key": "service-interiors",
    "name": "Premium Interior Design Studio",
    "category": "Service Business",
    "description": "Transform your living space with our bespoke interior design services. We specialize in premium modular kitchens and complete home makeovers",
    "theme": {
      "primary": "#C0A062",
      "accent": "#F7F5F2",
      "dark": "#1A202C",
      "font": "Inter",
      "headingFont": "Poppins",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "Studio Luxe",
        "items": [
          {
            "title": "Services",
            "href": "#services"
          },
          {
            "title": "Process",
            "href": "#process"
          },
          {
            "title": "Testimonials",
            "href": "#testimonials"
          }
        ],
        "ctaLabel": "Get Free Consultation",
        "ctaHref": "#lead-form",
        "variant": "simple"
      },
      {
        "type": "hero",
        "variant": "split-form",
        "background": "gradient",
        "eyebrow": "BESPOKE INTERIOR DESIGN",
        "heading": "Your Dream Home, Designed for Life.",
        "subheading": "Experience timeless elegance with our custom modular kitchens and full home interiors. Let our experts bring your vision to life. Schedule your complimentary design consultation today.",
        "imagePrompt": "A beautifully lit, luxurious modern kitchen with dark wood cabinetry, a white marble island, and minimalist decor. The morning sun streams through a large window, creating a warm and inviting atmosphere. No people.",
        "formTitle": "Get Your Free Design Consultation",
        "formSubtitle": "Fill out the form and our design expert will contact you shortly.",
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "full"
          },
          {
            "label": "Email Address",
            "type": "email",
            "required": true,
            "width": "half"
          },
          {
            "label": "Phone Number",
            "type": "tel",
            "required": true,
            "width": "half"
          },
          {
            "label": "What are you looking to design?",
            "type": "select",
            "required": true,
            "options": [
              "Modular Kitchen",
              "Full Home Interior",
              "Living Room",
              "Bedroom",
              "Other"
            ],
            "width": "full"
          },
          {
            "label": "I agree to be contacted by Studio Luxe about this enquiry.",
            "type": "consent",
            "required": true
          }
        ],
        "formSubmitLabel": "Book My Consultation",
        "successMessage": "Thank you! We've received your request and will be in touch soon."
      },
      {
        "type": "logos",
        "background": "alt",
        "heading": "Our Trusted Material & Appliance Partners",
        "items": [
          {
            "title": "Bosch"
          },
          {
            "title": "Häfele"
          },
          {
            "title": "Greenply"
          },
          {
            "title": "Siemens"
          },
          {
            "title": "Asian Paints"
          },
          {
            "title": "Jaquar"
          }
        ]
      },
      {
        "type": "features",
        "variant": "icons",
        "background": "light",
        "id": "services",
        "heading": "Design That Revolves Around You",
        "subheading": "We believe in creating spaces that are not just beautiful, but also a true reflection of your personality and lifestyle.",
        "items": [
          {
            "icon": "💎",
            "title": "Personalized Designs",
            "text": "Every project is a unique masterpiece, tailored specifically to your tastes, needs, and the way you live."
          },
          {
            "icon": "🌿",
            "title": "Premium Materials",
            "text": "We source only the finest, most durable materials to ensure your space is beautiful and built to last."
          },
          {
            "icon": "🏆",
            "title": "End-to-End Execution",
            "text": "From the first sketch to the final installation, our team manages every detail so you can relax and watch your vision come to life."
          }
        ]
      },
      {
        "type": "media_text",
        "variant": "image-left",
        "background": "alt",
        "eyebrow": "MODULAR KITCHENS",
        "heading": "The Heart of Your Home, Reimagined",
        "body": "Our modular kitchens blend flawless functionality with stunning aesthetics. We focus on intelligent space planning, premium finishes, and ergonomic design to create a kitchen that's a joy to cook and live in.",
        "items": [
          {
            "title": "Smart storage solutions"
          },
          {
            "title": "Durable, high-quality finishes"
          },
          {
            "title": "Seamless appliance integration"
          }
        ],
        "imagePrompt": "Close-up shot of a modern, sleek modular kitchen cabinet handle in matte black against a dark oak wood texture. The lighting is soft and focused, highlighting the quality of the materials.",
        "ctaLabel": "Explore Kitchen Designs",
        "ctaHref": "#lead-form"
      },
      {
        "type": "steps",
        "background": "light",
        "id": "process",
        "heading": "Your Design Journey in 4 Simple Steps",
        "items": [
          {
            "title": "1. Consult & Discover",
            "text": "We start with a detailed conversation to understand your vision, requirements, and budget in our free consultation."
          },
          {
            "title": "2. Design & Visualize",
            "text": "Our designers create personalized 2D layouts and realistic 3D renderings, so you can see your new space before we begin."
          },
          {
            "title": "3. Material Selection",
            "text": "Choose from our curated library of premium materials, finishes, and fixtures with expert guidance from your designer."
          },
          {
            "title": "4. Execute & Deliver",
            "text": "Our project management team ensures a seamless, on-time installation with meticulous attention to detail."
          }
        ]
      },
      {
        "type": "testimonials",
        "background": "dark",
        "id": "testimonials",
        "heading": "Loved by Homeowners",
        "items": [
          {
            "text": "The team at Studio Luxe completely transformed our home. Their attention to detail and commitment to quality was exceptional. The whole process was seamless and stress-free. We couldn't be happier with the result!",
            "author": "Priya & Rohan S.",
            "role": "Full Home Interior Client"
          },
          {
            "text": "Our new kitchen is a dream come true! It's not just beautiful but incredibly functional. The designers really listened to what we wanted and delivered beyond our expectations. Highly recommended.",
            "author": "Anjali Mehta",
            "role": "Modular Kitchen Client"
          }
        ],
        "variant": "single"
      },
      {
        "type": "faq",
        "background": "alt",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "What is included in the free design consultation?",
            "text": "Our free consultation includes a discussion with one of our senior designers to understand your needs, a review of your floor plan, initial design suggestions, and a preliminary budget estimate. There's no obligation to proceed."
          },
          {
            "title": "How long does a typical project take?",
            "text": "Project timelines vary based on scope. A modular kitchen typically takes 4-6 weeks from design finalization to installation. A full home interior project can take anywhere from 8 to 16 weeks."
          },
          {
            "title": "Can you work with my existing furniture?",
            "text": "Absolutely! We believe in creating a cohesive space. Our designers are skilled at integrating your cherished existing pieces into the new design plan."
          },
          {
            "title": "What kind of warranty do you offer?",
            "text": "We offer a comprehensive warranty on all our workmanship and the materials we use. Specific warranty details will be provided in your project contract."
          }
        ]
      },
      {
        "type": "cta",
        "variant": "band",
        "background": "primary",
        "heading": "Ready to Create Your Perfect Space?",
        "subheading": "Your dream home is just a consultation away. Let's start the conversation.",
        "ctaLabel": "Book My Free Consultation",
        "ctaHref": "#lead-form"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "Studio Luxe",
        "body": "Designing timeless spaces that tell your story. Specializing in bespoke modular kitchens and full home interiors.",
        "legal": "© 2024 Studio Luxe Designs. All rights reserved.",
        "items": [
          {
            "title": "Home",
            "href": "#"
          },
          {
            "title": "Privacy Policy",
            "href": "#"
          },
          {
            "title": "Terms of Service",
            "href": "#"
          }
        ],
        "variant": "simple"
      }
    ]
  },
  {
    "key": "service-cleaning",
    "name": "Pest Control & Cleaning Services",
    "category": "Service Business",
    "description": "Expert pest control and deep home cleaning services. Our trained professionals ensure your home is fresh, reliable, and free from pests. Boo",
    "theme": {
      "primary": "#007BFF",
      "accent": "#28A745",
      "dark": "#212529",
      "font": "Inter",
      "headingFont": "Poppins",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "Pristine Home",
        "items": [
          {
            "title": "Services",
            "href": "#services"
          },
          {
            "title": "Our Process",
            "href": "#process"
          },
          {
            "title": "Testimonials",
            "href": "#testimonials"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Book Now",
        "ctaHref": "#lead-form",
        "variant": "centered"
      },
      {
        "type": "hero",
        "variant": "split-form",
        "background": "gradient",
        "eyebrow": "PEST CONTROL & DEEP CLEANING",
        "heading": "A Spotless, Pest-Free Home is Just a Click Away",
        "subheading": "Our professionally trained team uses safe, effective methods to deep clean your home and eliminate pests. Enjoy a fresh, healthy living space.",
        "items": [
          {
            "icon": "✅",
            "title": "Certified Technicians"
          },
          {
            "icon": "🌿",
            "title": "Eco-Friendly Solutions"
          },
          {
            "icon": "🛡️",
            "title": "Satisfaction Guaranteed"
          }
        ],
        "formAnchor": "lead-form",
        "formTitle": "Get a Free Quote",
        "formSubtitle": "Fill in your details and we'll contact you shortly.",
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Phone Number",
            "type": "tel",
            "required": true,
            "width": "half"
          },
          {
            "label": "Service Required",
            "type": "select",
            "required": true,
            "options": [
              "Pest Control",
              "Deep Home Cleaning",
              "Pest Control & Cleaning Combo"
            ]
          },
          {
            "label": "Property Type",
            "type": "select",
            "required": true,
            "options": [
              "Apartment",
              "House / Villa",
              "Office / Commercial"
            ]
          },
          {
            "label": "I agree to be contacted about this enquiry and accept the privacy policy.",
            "type": "consent",
            "required": true
          }
        ],
        "formSubmitLabel": "Request My Quote",
        "successMessage": "Thank you! We've received your request and will be in touch soon."
      },
      {
        "type": "logos",
        "background": "alt",
        "heading": "Trusted by Homeowners and Businesses Across the City",
        "items": [
          {
            "title": "City Properties"
          },
          {
            "title": "Urban Living"
          },
          {
            "title": "Happy Homes Realty"
          },
          {
            "title": "Metro Estates"
          },
          {
            "title": "Prime Offices"
          }
        ]
      },
      {
        "type": "features",
        "variant": "icons",
        "background": "light",
        "anchor": "services",
        "heading": "Why Choose Pristine Home?",
        "subheading": "We deliver a reliable, thorough service that brings freshness and peace of mind back to your home.",
        "items": [
          {
            "icon": "👨‍🔬",
            "title": "Trained Professionals",
            "text": "Our staff are fully vetted, trained, and equipped with the latest tools and techniques."
          },
          {
            "icon": "🌿",
            "title": "Safe & Eco-Friendly",
            "text": "We use non-toxic, pet-safe, and environmentally friendly products for your family's safety."
          },
          {
            "icon": "⏱️",
            "title": "On-Time Service",
            "text": "We respect your time. Our teams arrive on schedule and work efficiently to minimize disruption."
          },
          {
            "icon": "🔍",
            "title": "Attention to Detail",
            "text": "From deep cleaning hidden corners to comprehensive pest eradication, we miss nothing."
          },
          {
            "icon": "💯",
            "title": "Satisfaction Guarantee",
            "text": "We're not happy until you are. We stand behind our work with a quality guarantee."
          },
          {
            "icon": "📅",
            "title": "Flexible Booking",
            "text": "Easily schedule a one-time service or set up a recurring plan that fits your needs."
          }
        ]
      },
      {
        "type": "steps",
        "background": "alt",
        "anchor": "process",
        "heading": "Our Simple 3-Step Process",
        "items": [
          {
            "title": "1. Get Your Quote",
            "text": "Fill out our quick form or call us to discuss your needs and get a transparent, no-obligation quote."
          },
          {
            "title": "2. Schedule Your Service",
            "text": "Pick a date and time that works for you. We offer flexible scheduling, including weekends."
          },
          {
            "title": "3. Relax & Enjoy",
            "text": "Our expert team arrives on time and transforms your home, leaving it spotless and pest-free."
          }
        ]
      },
      {
        "type": "testimonials",
        "background": "dark",
        "anchor": "testimonials",
        "heading": "What Our Happy Clients Say",
        "items": [
          {
            "text": "Pristine Home was incredible. The team was professional, and my apartment has never been cleaner. The pest control was also super effective. Highly recommend!",
            "author": "Sarah J.",
            "role": "Homeowner"
          },
          {
            "text": "Finally, a reliable service! They were on time, thorough, and used products that didn't have a harsh chemical smell. It's a relief to have a pest-free home again.",
            "author": "Mark T.",
            "role": "Apartment Resident"
          },
          {
            "text": "We use them for our office space quarterly. The deep cleaning is fantastic and their pest management is top-notch. Very professional and easy to work with.",
            "author": "David L.",
            "role": "Office Manager"
          }
        ]
      },
      {
        "type": "faq",
        "background": "light",
        "anchor": "faq",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "Are your cleaning and pest control products safe for pets and children?",
            "text": "Absolutely. We prioritize the health of your family by using non-toxic, eco-friendly, and pet-safe products that are highly effective without posing any risks."
          },
          {
            "title": "How long does a typical service take?",
            "text": "A standard deep clean or pest control service for a 2-bedroom home usually takes 3-4 hours. The exact duration depends on the size of your property and the specific services required."
          },
          {
            "title": "Do I need to be home during the service?",
            "text": "It's not required for you to be home, as long as our team has access to the property. Many clients provide a key or access code. We are fully insured and our staff is background-checked for your peace of mind."
          },
          {
            "title": "What is included in a deep cleaning service?",
            "text": "Our deep cleaning service is comprehensive, covering everything from kitchen appliances and bathroom sanitization to dusting high surfaces, cleaning baseboards, and vacuuming/mopping all floors."
          },
          {
            "title": "What common pests do you handle?",
            "text": "We are equipped to handle a wide range of common household pests, including cockroaches, ants, spiders, rodents, bed bugs, and termites. We offer both targeted treatments and preventative plans."
          }
        ],
        "variant": "split"
      },
      {
        "type": "cta",
        "variant": "band",
        "background": "primary",
        "heading": "Ready for a Cleaner, Safer Home?",
        "subheading": "Let our experts take care of the dirty work. Get your free, no-obligation quote today.",
        "ctaLabel": "Book My Service Now",
        "ctaHref": "#lead-form"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "Pristine Home",
        "body": "Your trusted partner for a clean, healthy, and pest-free living environment.",
        "legal": "© 2024 Pristine Home. All rights reserved.",
        "items": [
          {
            "title": "Home",
            "href": "#"
          },
          {
            "title": "Services",
            "href": "#services"
          },
          {
            "title": "Contact",
            "href": "#lead-form"
          },
          {
            "title": "Privacy Policy",
            "href": "#"
          }
        ],
        "variant": "centered"
      }
    ]
  },
  {
    "key": "promo-electronics",
    "name": "Festive Electronics Sale Landing Page",
    "category": "Promotional Campaign",
    "description": "Don't miss our biggest festive electronics sale! Get up to 50% off on mobiles, laptops, TVs & more. Grab your exclusive coupon and enjoy ext",
    "theme": {
      "primary": "#E53935",
      "accent": "#FFC107",
      "dark": "#1A202C",
      "font": "Poppins",
      "headingFont": "Poppins",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "TechDeals",
        "items": [
          {
            "title": "Top Deals",
            "href": "#deals"
          },
          {
            "title": "Bank Offers",
            "href": "#banks"
          },
          {
            "title": "FAQ",
            "href": "#faq"
          }
        ],
        "ctaLabel": "Get Coupon",
        "ctaHref": "#lead-form",
        "variant": "simple"
      },
      {
        "type": "hero",
        "variant": "background-image",
        "background": "dark",
        "eyebrow": "THE BIGGEST SALE OF THE YEAR IS HERE",
        "heading": "Festive Tech Frenzy: Up to 50% OFF!",
        "subheading": "Unwrap incredible deals on the latest smartphones, laptops, TVs, and accessories. Plus, get extra discounts with partner bank offers. Your new gadget is just a click away.",
        "ctaLabel": "Claim My Discount Coupon",
        "ctaHref": "#lead-form",
        "secondaryCtaLabel": "See Top Deals",
        "secondaryCtaHref": "#deals",
        "imagePrompt": "A vibrant, festive photograph of a modern living room filled with glowing electronics like a large screen TV, a laptop on a coffee table, and a smartphone, with subtle festive decorations like fairy lights in the background. The mood is celebratory and exciting."
      },
      {
        "type": "countdown",
        "background": "primary",
        "heading": "Hurry, Offers Expire Soon!",
        "subheading": "These deals are flying off the shelves. Don't wait for the prices to go back up!",
        "targetDate": "2024-11-15",
        "ctaLabel": "I Want My Coupon!",
        "ctaHref": "#lead-form"
      },
      {
        "type": "logos",
        "background": "alt",
        "heading": "Extra Savings with Our Bank Partners",
        "items": [
          {
            "title": "HDFC Bank"
          },
          {
            "title": "ICICI Bank"
          },
          {
            "title": "State Bank of India"
          },
          {
            "title": "Axis Bank"
          },
          {
            "title": "Kotak Mahindra Bank"
          },
          {
            "title": "American Express"
          }
        ]
      },
      {
        "type": "features",
        "variant": "bento",
        "background": "light",
        "id": "deals",
        "heading": "Deals You Can't Ignore",
        "subheading": "Explore massive discounts across all your favourite categories.",
        "items": [
          {
            "icon": "📱",
            "title": "Smartphones",
            "text": "Flagship phones at their lowest prices ever. Up to 40% off on top brands."
          },
          {
            "icon": "💻",
            "title": "Laptops & Tablets",
            "text": "Power up your work and play. Get up to 50% off on high-performance machines."
          },
          {
            "icon": "📺",
            "title": "Televisions & Audio",
            "text": "Bring the cinema home. Unbeatable deals on 4K TVs and sound systems."
          },
          {
            "icon": "🎧",
            "title": "Headphones & Wearables",
            "text": "Upgrade your accessories. Save big on smartwatches, earbuds, and more."
          },
          {
            "icon": "🎮",
            "title": "Gaming Consoles",
            "text": "Level up your gaming setup with exclusive bundles and discounts."
          },
          {
            "icon": "📷",
            "title": "Cameras & Drones",
            "text": "Capture every moment with pro-grade cameras at stunning prices."
          }
        ]
      },
      {
        "type": "gallery",
        "background": "alt",
        "heading": "Hot-Selling Products",
        "items": [
          {
            "title": "Latest iPhone Model",
            "imagePrompt": "A sleek, new iPhone 15 Pro in titanium finish, placed on a dark, textured surface with soft, dramatic studio lighting highlighting its edges."
          },
          {
            "title": "High-Performance Gaming Laptop",
            "imagePrompt": "A powerful gaming laptop with its RGB keyboard glowing in a dimly lit room, showcasing a high-action game on its screen."
          },
          {
            "title": "4K OLED Smart TV",
            "imagePrompt": "An ultra-thin 65-inch OLED TV mounted on a modern living room wall, displaying a stunningly colorful nature documentary."
          },
          {
            "title": "Noise-Cancelling Headphones",
            "imagePrompt": "A pair of premium, wireless noise-cancelling headphones resting on a wooden desk next to a notebook and a steaming cup of coffee, suggesting a focused work environment."
          },
          {
            "title": "Next-Gen Gaming Console",
            "imagePrompt": "A close-up shot of a modern gaming console, with its controller placed neatly beside it, set against a dynamic, colorful background."
          },
          {
            "title": "Compact Mirrorless Camera",
            "imagePrompt": "A professional mirrorless camera with a prime lens attached, held by a person ready to take a shot during a golden hour sunset."
          }
        ]
      },
      {
        "type": "lead_form",
        "variant": "card",
        "background": "gradient",
        "id": "lead-form",
        "heading": "Get Your Exclusive Discount Coupon Now!",
        "subheading": "Enter your details below and we'll instantly send a unique coupon code to your inbox. Use it at checkout for an additional 10% off!",
        "formTitle": "Unlock Your Savings",
        "formSubtitle": "Fill in the details to get your code.",
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "full"
          },
          {
            "label": "Email Address",
            "type": "email",
            "required": true,
            "width": "full"
          },
          {
            "label": "Mobile Number",
            "type": "tel",
            "required": true,
            "width": "full"
          },
          {
            "label": "I agree to receive updates and offers via Email & SMS.",
            "type": "consent",
            "required": true,
            "width": "full"
          }
        ],
        "formSubmitLabel": "Send My Coupon Code",
        "successMessage": "Success! Your coupon code is on its way to your inbox."
      },
      {
        "type": "faq",
        "background": "light",
        "id": "faq",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "How long is the sale valid?",
            "text": "Our Festive Tech Frenzy sale runs until the date shown on the countdown timer. However, stocks are limited, so we recommend shopping early to avoid disappointment."
          },
          {
            "title": "How do I use the discount coupon?",
            "text": "After you fill out the form, we will email you a unique coupon code. Simply apply this code in the 'Discount Code' box at checkout to get your additional discount."
          },
          {
            "title": "Are the bank offers applicable on all products?",
            "text": "Most products are covered under the bank offers. The specific discount and eligibility will be mentioned on the product page. Typically, it's an instant discount on credit/debit card payments from our partner banks."
          },
          {
            "title": "What is your return policy during the sale?",
            "text": "Our standard 14-day return policy applies to all products purchased during the sale. The item must be in its original condition with all accessories and packaging."
          },
          {
            "title": "Can I combine the coupon with bank offers?",
            "text": "Yes! The best part about this sale is that you can use your exclusive coupon code on top of the existing bank offers for maximum savings."
          }
        ]
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "TechDeals",
        "body": "Your one-stop shop for the best deals on electronics this festive season.",
        "legal": "© 2024 TechDeals. All rights reserved. All offers are subject to terms and conditions.",
        "items": [
          {
            "title": "Privacy Policy",
            "href": "#"
          },
          {
            "title": "Terms of Sale",
            "href": "#"
          },
          {
            "title": "Contact Us",
            "href": "#"
          }
        ],
        "variant": "columns"
      }
    ]
  },
  {
    "key": "promo-restaurant",
    "name": "Weekend Buffet Offer",
    "category": "Promotional Campaign",
    "description": "Indulge in our spectacular weekend buffet featuring live cooking stations, global cuisines, and decadent desserts. Book your table online fo",
    "theme": {
      "primary": "#E53935",
      "accent": "#FFB300",
      "dark": "#1F2937",
      "font": "Inter",
      "headingFont": "Poppins",
      "radius": "14px"
    },
    "sections": [
      {
        "type": "navbar",
        "background": "light",
        "brandName": "The Grand Culinary",
        "items": [
          {
            "title": "The Offer",
            "href": "#offer"
          },
          {
            "title": "Gallery",
            "href": "#gallery"
          },
          {
            "title": "Reviews",
            "href": "#reviews"
          }
        ],
        "ctaLabel": "Reserve a Table",
        "ctaHref": "#lead-form",
        "variant": "dark"
      },
      {
        "type": "hero",
        "variant": "background-image",
        "background": "dark",
        "eyebrow": "EVERY SATURDAY & SUNDAY",
        "heading": "Experience the Ultimate Weekend Buffet",
        "subheading": "Savour an endless spread of global delicacies, witness culinary magic at our live counters, and create unforgettable memories. Your weekend feast awaits.",
        "ctaLabel": "Book Your Table Now",
        "ctaHref": "#lead-form",
        "imagePrompt": "A lavish and colourful buffet spread in a warm, elegantly lit restaurant. Dishes are beautifully arranged, with steam rising from hot food, creating an inviting and appetizing atmosphere. The focus is on the variety and freshness of the food."
      },
      {
        "type": "features",
        "variant": "icons",
        "background": "alt",
        "id": "offer",
        "heading": "A Feast for All Your Senses",
        "subheading": "We've curated a special experience that goes beyond just food. Discover what makes our weekend buffet the talk of the town.",
        "items": [
          {
            "icon": "👨‍🍳",
            "title": "Interactive Live Counters",
            "text": "Watch our expert chefs craft pastas, stir-fries, and more, made fresh just for you. An engaging culinary show!"
          },
          {
            "icon": "🌍",
            "title": "Global Cuisine Selection",
            "text": "Journey through a world of flavours with dishes from Italian, Asian, and classic Indian cuisines, all in one place."
          },
          {
            "icon": "🍰",
            "title": "Decadent Dessert Bar",
            "text": "Indulge your sweet tooth with our irresistible array of cakes, pastries, traditional sweets, and a live ice cream station."
          }
        ]
      },
      {
        "type": "media_text",
        "variant": "image-left",
        "background": "light",
        "eyebrow": "FRESH & INTERACTIVE",
        "heading": "The Thrill of Live Cooking",
        "body": "Our live counters are the heart of the buffet experience. Engage with our chefs, customize your dish, and enjoy food that's prepared right before your eyes, ensuring maximum freshness and flavour.",
        "items": [
          {
            "title": "Personalized Pasta Station"
          },
          {
            "title": "Sizzling Asian Stir-Fry"
          },
          {
            "title": "Authentic Indian Chaat Corner"
          }
        ],
        "ctaLabel": "Reserve Your Spot",
        "ctaHref": "#lead-form",
        "imagePrompt": "A friendly chef in a clean white uniform skillfully tossing pasta in a pan over a flame at a live cooking station in a bustling restaurant. Guests are visible in the blurred background, looking on with interest. The lighting is warm and focused on the chef's station."
      },
      {
        "type": "gallery",
        "background": "alt",
        "id": "gallery",
        "heading": "A Glimpse of the Spread",
        "items": [
          {
            "title": "Assorted Appetizers",
            "imagePrompt": "A close-up, top-down shot of a vibrant platter of assorted grilled appetizers, including paneer tikka and chicken skewers, garnished with fresh cilantro. Soft, warm lighting."
          },
          {
            "title": "Main Course Delights",
            "imagePrompt": "A beautifully presented plate of a rich, creamy curry with naan bread on the side, set against a dark, elegant restaurant table. The focus is sharp on the texture of the food."
          },
          {
            "title": "Dessert Heaven",
            "imagePrompt": "A slice of decadent chocolate lava cake with molten chocolate oozing out, next to a scoop of vanilla ice cream on a white plate. Moody, dramatic lighting."
          }
        ]
      },
      {
        "type": "testimonials",
        "background": "dark",
        "id": "reviews",
        "heading": "What Our Guests Are Saying",
        "items": [
          {
            "text": "The live pasta counter was a highlight! The food was fresh, delicious, and the variety was incredible. We'll definitely be back next weekend.",
            "author": "Anjali S.",
            "role": "Family Dinner"
          },
          {
            "text": "An absolutely fantastic buffet experience. The ambiance is perfect for a weekend outing, and every dish we tried was top-notch. Highly recommended!",
            "author": "Mark Chen",
            "role": "Weekend Brunch"
          }
        ],
        "variant": "single"
      },
      {
        "type": "lead_form",
        "variant": "card",
        "background": "gradient",
        "id": "lead-form",
        "heading": "Reserve Your Table",
        "subheading": "Our weekend buffet fills up fast! Secure your spot now for an unforgettable culinary journey. It only takes a minute.",
        "formTitle": "Book Your Experience",
        "formFields": [
          {
            "label": "Full Name",
            "type": "text",
            "required": true,
            "width": "half"
          },
          {
            "label": "Phone Number",
            "type": "tel",
            "required": true,
            "width": "half"
          },
          {
            "label": "Number of Guests",
            "type": "number",
            "required": true,
            "width": "half"
          },
          {
            "label": "Select Day",
            "type": "select",
            "required": true,
            "options": [
              "This Saturday",
              "This Sunday"
            ],
            "width": "half"
          },
          {
            "label": "Preferred Time Slot",
            "type": "select",
            "required": true,
            "options": [
              "Lunch (12:30 PM - 2:30 PM)",
              "Dinner (7:30 PM - 9:30 PM)"
            ]
          },
          {
            "label": "I agree to be contacted by The Grand Culinary regarding this reservation.",
            "type": "consent",
            "required": true
          }
        ],
        "formSubmitLabel": "Confirm My Reservation",
        "successMessage": "Thank you! Your table is reserved. We look forward to welcoming you."
      },
      {
        "type": "faq",
        "background": "light",
        "heading": "Frequently Asked Questions",
        "items": [
          {
            "title": "What are the buffet timings?",
            "text": "Our weekend buffet is available for lunch from 12:30 PM to 3:30 PM and for dinner from 7:30 PM to 11:00 PM on Saturdays and Sundays."
          },
          {
            "title": "What is the price per person?",
            "text": "The buffet is priced at $35 per adult and $18 per child (ages 5-10), exclusive of taxes. Children below 5 dine for free."
          },
          {
            "title": "Do you cater to dietary restrictions?",
            "text": "Yes, we do. We have a range of vegetarian, vegan, and gluten-free options available. Please mention any specific dietary needs in the notes section when booking or inform our staff upon arrival."
          },
          {
            "title": "Is parking available?",
            "text": "Yes, we offer complimentary valet parking for all our buffet guests."
          }
        ],
        "variant": "split"
      },
      {
        "type": "footer",
        "background": "dark",
        "brandName": "The Grand Culinary",
        "body": "Experience the art of fine dining and create lasting memories with every bite.",
        "legal": "© 2023 The Grand Culinary. All Rights Reserved.",
        "items": [
          {
            "title": "Privacy Policy",
            "href": "#"
          },
          {
            "title": "Terms of Service",
            "href": "#"
          },
          {
            "title": "Contact Us",
            "href": "#"
          }
        ],
        "variant": "simple"
      }
    ]
  }
];
