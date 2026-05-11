import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/profile', '/auth/'] }],
    sitemap: 'https://human-capacities.fr/sitemap.xml',
  };
}
