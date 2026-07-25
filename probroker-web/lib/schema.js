import { SITE_URL } from './config';
import { buildPropertyTitle, buildPropertySlug } from './format';

// schema.org addressRegion expects the administrative region (state), not the city.
// Extend this as new cities are added.
const STATE_BY_CITY = {
  Ahmedabad: 'Gujarat',
  Gandhinagar: 'Gujarat',
  Surat: 'Gujarat',
  Vadodara: 'Gujarat',
  Rajkot: 'Gujarat',
  Pune: 'Maharashtra',
  Mumbai: 'Maharashtra',
};

// Organization schema — homepage only.
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PRObroker',
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/logo.png`,
  };
}

// WebSite schema with SearchAction — homepage only.
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PRObroker',
    url: `${SITE_URL}/`,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

// BreadcrumbList — items = [{ name, url }] in top-down order (Home first).
export function breadcrumbSchema(items) {
  if (!items || !items.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// RealEstateListing — property detail page.
export function realEstateListingSchema(property, desc, canonicalUrl) {
  const title = buildPropertyTitle(property);
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: title,
    description: desc,
    url: canonicalUrl,
    image: property.photos?.[0] || `${SITE_URL}/og-default.jpg`,
    offers: {
      '@type': 'Offer',
      price: String(property.price || ''),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: canonicalUrl,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.areaName,
      // addressRegion must be the STATE, not the city (city is addressLocality's parent).
      addressRegion: STATE_BY_CITY[property.cityName] || 'Gujarat',
      addressCountry: 'IN',
    },
    ...(property.bhk ? { numberOfRooms: property.bhk } : {}),
    ...(property.sqft
      ? { floorSize: { '@type': 'QuantitativeValue', value: property.sqft, unitCode: 'FTK' } }
      : {}),
    ...(property.createdAt ? { datePosted: property.createdAt } : {}),
  };
}

// Residence (residential) or Place (commercial/mixed) — society detail page.
export function residenceSchema(society, area, city, desc, canonicalUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': society.projectType === 'residential' ? 'Residence' : 'Place',
    name: society.name,
    description: desc,
    url: canonicalUrl,
    address: {
      '@type': 'PostalAddress',
      addressLocality: area?.name,
      addressRegion: STATE_BY_CITY[city?.name] || 'Gujarat',
      addressCountry: 'IN',
    },
  };
}

// FAQPage — society detail page and area landing page, when faqs exist.
export function faqPageSchema(faqs) {
  if (!faqs || !faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

// Article — blog post page.
export function articleSchema(post, canonicalUrl) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription || (post.excerpt || '').slice(0, 160),
    url: canonicalUrl,
    author: { '@type': 'Person', name: post.author || 'Admin' },
    publisher: { '@type': 'Organization', name: 'PRObroker' },
    datePublished: post.publishedAt || '',
    dateModified: post.updatedAt || '',
  };
  if (post.featuredImage) schema.image = post.featuredImage;
  return schema;
}

// ItemList — listing/category pages (city/area listings, BHK, budget, etc.)
export function itemListSchema(properties, baseUrl) {
  if (!properties || !properties.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: properties.length,
    itemListElement: properties.map((p, i) => {
      const slug = p.slug || buildPropertySlug(p);
      return {
        '@type': 'ListItem',
        position: i + 1,
        name: buildPropertyTitle(p),
        url: `${baseUrl}/property/${slug}/`,
      };
    }),
  };
}
