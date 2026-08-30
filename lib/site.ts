/**
 * Site metadata configuration and base URL resolution.
 */
export const getSiteUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const url = process.env.NEXT_PUBLIC_SITE_URL.trim();
    return url.startsWith("http") ? url : `https://${url}`;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://rachitdesign.vercel.app";
};

export const SITE_URL = getSiteUrl();

export const siteConfig = {
  name: "Rachit Thakur",
  title: "Rachit Thakur — Product Designer & Design Engineer",
  description:
    "Product Designer at North of Zero specializing in Design Engineering, Product building, and Interaction Design. Based in India, studying B.Tech in Data Science.",
  shortDescription:
    "Product Designer at North of Zero. Crafting interactions, design engineering, and product experiences.",
  url: SITE_URL,
  ogImage: "/Meta.png",
  twitterHandle: "@RachitThakur146",
  links: {
    twitter: "https://x.com/RachitThakur146",
    github: "https://github.com/Rachit315",
    linkedin: "https://www.linkedin.com/in/rachit-thakur007/",
    company: "https://www.northofzero.dev/",
  },
};
