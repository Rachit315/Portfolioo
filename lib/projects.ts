export interface ProjectScreen {
  title: string;
  subtitle?: string;
  src: string;
  alt: string;
}

export interface ProjectData {
  slug: string;
  name: string;
  year: string;
  category: string;
  tagline: string;
  description: string;
  figmaUrl: string;
  heroImage: string;
  screens: ProjectScreen[];
}

export const figmaUrl =
  "https://www.figma.com/design/OvqW4VEF4Y6brvmXvfXWXZ/Rachit?node-id=0-1&t=TBJV3TCpKVVgb2N7-1";

export const projectsData: ProjectData[] = [
  {
    slug: "collar",
    name: "Collar",
    year: "2026",
    category: "AI & Deal Intelligence",
    tagline: "Autonomous AI Deal Agent & Sales Intelligence Platform",
    description:
      "Collar is an intelligent AI sales copilot designed to evaluate, navigate, and qualify high-velocity deal pipelines. Built with automated decision rubrics, real-time prospect telemetry, and frictionless sales workflows.",
    figmaUrl,
    heroImage: "/Projects/Collar/Hero.png",
    screens: [
      {
        title: "Hero & Deal Agent Experience",
        src: "/Projects/Collar/Hero.png",
        alt: "Collar AI Hero Screen",
      },
      {
        title: "Bento Feature Architecture",
        src: "/Projects/Collar/Bento.png",
        alt: "Collar Bento Grid Screen",
      },
      {
        title: "Core Feature Breakdown",
        src: "/Projects/Collar/Feature.png",
        alt: "Collar Feature Breakdown Screen",
      },
      {
        title: "Ecosystem & Integrations",
        src: "/Projects/Collar/Integration.png",
        alt: "Collar Integrations Screen",
      },
      {
        title: "Pricing & Growth Tiers",
        src: "/Projects/Collar/Pricing.png",
        alt: "Collar Pricing Screen",
      },
      {
        title: "Footer & Conversion Flow",
        src: "/Projects/Collar/Footer.png",
        alt: "Collar Footer Screen",
      },
    ],
  },
  {
    slug: "portfolio",
    name: "Portfolio",
    year: "2026",
    category: "Personal Brand & Web Craft",
    tagline: "Minimalist Portfolio & Interactive Craft Showcase",
    description:
      "A personal design engineering portfolio built to showcase high-craft digital experiences, interaction design studies, and case studies with tactile micro-interactions and fluid physics.",
    figmaUrl,
    heroImage: "/Projects/Portfolio/Hero.png",
    screens: [
      {
        title: "Hero & Identity",
        src: "/Projects/Portfolio/Hero.png",
        alt: "Portfolio Hero Screen",
      },
      {
        title: "About & Background",
        src: "/Projects/Portfolio/About.png",
        alt: "Portfolio About Screen",
      },
      {
        title: "Services & Capabilities",
        src: "/Projects/Portfolio/Services.png",
        alt: "Portfolio Services Screen",
      },
      {
        title: "Selected Works & Gallery",
        src: "/Projects/Portfolio/Work.png",
        alt: "Portfolio Selected Works Screen",
      },
      {
        title: "Contact & Booking",
        src: "/Projects/Portfolio/Contact.png",
        alt: "Portfolio Contact Screen",
      },
      {
        title: "Footer Sign-off",
        src: "/Projects/Portfolio/Footer.png",
        alt: "Portfolio Footer Screen",
      },
    ],
  },
  {
    slug: "quanto",
    name: "Quanto",
    year: "2026",
    category: "Fintech & Ledger Analytics",
    tagline: "Quantitative Financial Operations & Treasury Infrastructure",
    description:
      "Quanto provides quantitative financial telemetry, real-time ledger auditing, and algorithmic yield visualization for modern fintech companies and treasury management teams.",
    figmaUrl,
    heroImage: "/Projects/Quanto/Hero.png",
    screens: [
      {
        title: "Hero & Dashboard Preview",
        src: "/Projects/Quanto/Hero.png",
        alt: "Quanto Hero Screen",
      },
      {
        title: "Bento Architecture",
        src: "/Projects/Quanto/Bento.png",
        alt: "Quanto Bento Screen",
      },
      {
        title: "Quantitative Solutions",
        src: "/Projects/Quanto/Solution.png",
        alt: "Quanto Solutions Screen",
      },
      {
        title: "Pricing & Volume Tiers",
        src: "/Projects/Quanto/Pricing.png",
        alt: "Quanto Pricing Screen",
      },
      {
        title: "Call to Action & Onboarding",
        src: "/Projects/Quanto/Cta.png",
        alt: "Quanto CTA Screen",
      },
      {
        title: "Footer & Documentation",
        src: "/Projects/Quanto/Footer.png",
        alt: "Quanto Footer Screen",
      },
    ],
  },
  {
    slug: "caremetric",
    name: "CareMetric",
    year: "2026",
    category: "HealthTech & Clinical Telemetry",
    tagline: "Clinical Intelligence & Patient Outcome Analytics",
    description:
      "CareMetric empowers hospitals and clinical teams with patient outcome tracking, real-time physiological telemetry dashboards, and predictive care workflows in an accessible, unified interface.",
    figmaUrl,
    heroImage: "/Projects/CareMetric/Hero.png",
    screens: [
      {
        title: "Hero & Clinical Telemetry",
        src: "/Projects/CareMetric/Hero.png",
        alt: "CareMetric Hero Screen",
      },
      {
        title: "Platform Features",
        src: "/Projects/CareMetric/Feature.png",
        alt: "CareMetric Features Screen",
      },
      {
        title: "Care Solutions & Protocol Mapping",
        src: "/Projects/CareMetric/Solution.png",
        alt: "CareMetric Solutions Screen",
      },
      {
        title: "Clinical Testimonials & Proof",
        src: "/Projects/CareMetric/Testimonial.png",
        alt: "CareMetric Testimonials Screen",
      },
      {
        title: "Hospital & Clinic Pricing",
        src: "/Projects/CareMetric/Pricing.png",
        alt: "CareMetric Pricing Screen",
      },
      {
        title: "Footer & Compliance",
        src: "/Projects/CareMetric/Footer.png",
        alt: "CareMetric Footer Screen",
      },
    ],
  },
  {
    slug: "mark-z",
    name: "Mark Z",
    year: "2025",
    category: "Creative Agency & Studio",
    tagline: "High-Impact Creative Portfolio & Digital Studio",
    description:
      "An editorial-style creative portfolio and brand identity studio experience built with bold typography, dynamic case studies, and expressive aesthetic pacing for tier-one brands.",
    figmaUrl,
    heroImage: "/Projects/Mark%20Z/Hero%202.png",
    screens: [
      {
        title: "Hero & Creative Direction",
        src: "/Projects/Mark%20Z/Hero%202.png",
        alt: "Mark Z Hero Screen",
      },
      {
        title: "Capabilities & Creative Services",
        src: "/Projects/Mark%20Z/Services.png",
        alt: "Mark Z Services Screen",
      },
      {
        title: "Selected Case Studies",
        src: "/Projects/Mark%20Z/Work.png",
        alt: "Mark Z Work Screen",
      },
      {
        title: "Collaboration CTA",
        src: "/Projects/Mark%20Z/Cta.png",
        alt: "Mark Z CTA Screen",
      },
      {
        title: "Footer & Studio Credits",
        src: "/Projects/Mark%20Z/Footer.png",
        alt: "Mark Z Footer Screen",
      },
    ],
  },
  {
    slug: "kourt-king",
    name: "Kourt king",
    year: "2025",
    category: "Sports & Venue Discovery",
    tagline: "Court Booking & Competitive Sports Community",
    description:
      "Kourt King is a sports venue discovery and court booking platform enabling athletes to reserve recreational courts, organize tournaments, register teams, and connect with local players.",
    figmaUrl,
    heroImage: "/Projects/Kourt%20king/Hero.png",
    screens: [
      {
        title: "Hero & Court Discovery",
        src: "/Projects/Kourt%20king/Hero.png",
        alt: "Kourt King Hero Screen",
      },
      {
        title: "About the Community",
        src: "/Projects/Kourt%20king/About.png",
        alt: "Kourt King About Screen",
      },
      {
        title: "Sport & Venue Selection",
        src: "/Projects/Kourt%20king/Select.png",
        alt: "Kourt King Select Screen",
      },
      {
        title: "Field & Facility Filter",
        src: "/Projects/Kourt%20king/Select%20field.png",
        alt: "Kourt King Select Field Screen",
      },
      {
        title: "Match & Player Registration",
        src: "/Projects/Kourt%20king/Register.png",
        alt: "Kourt King Registration Screen",
      },
      {
        title: "Footer & Support Center",
        src: "/Projects/Kourt%20king/Footer.png",
        alt: "Kourt King Footer Screen",
      },
    ],
  },
];

export function getProjectBySlug(slug: string): ProjectData | undefined {
  return projectsData.find((p) => p.slug.toLowerCase() === slug.toLowerCase());
}
