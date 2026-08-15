/**
 * Component Slicer & Focus Mode
 * Extracts and compiles ultra-targeted prompt briefs for isolated UI sections.
 */

const { compilePrompt } = require('./prompt-compiler');

const SECTION_DEFINITIONS = {
  navbar: {
    name: 'Navbar / Header Section',
    description: 'Responsive top navigation bar with brand logo, nav links, CTA buttons, and mobile hamburger drawer.',
    selectors: ['nav', 'header', '[role="navigation"]', '.navbar', '.header'],
    keyElements: ['Brand Logo', 'Nav Items', 'Search Bar', 'Action Buttons', 'Mobile Menu Toggle'],
  },
  hero: {
    name: 'Hero / Headline Section',
    description: 'High-converting above-the-fold hero banner with headline, subhead, primary/secondary CTA, and visual graphic.',
    selectors: ['[class*="hero"]', '[class*="banner"]', 'main > section:first-child', '.intro'],
    keyElements: ['Catchy Headline', 'Subhead paragraph', 'Primary & Secondary CTAs', 'Social Proof badge', 'Hero Visual / Video'],
  },
  features: {
    name: 'Feature Grid / Benefits',
    description: 'Responsive multi-column card grid highlighting product features, vector icons, titles, and descriptions.',
    selectors: ['[class*="feature"]', '[class*="grid"]', '[class*="card"]', '[class*="benefit"]'],
    keyElements: ['Section Title', 'Icon + Header + Paragraph cards', 'Hover elevation animations', 'Badge tags'],
  },
  pricing: {
    name: 'Pricing Matrix & Plan Cards',
    description: 'Interactive pricing table with monthly/annual billing switch, featured/popular tier highlight, feature checkmarks, and CTA buttons.',
    selectors: ['[class*="pricing"]', '[class*="plan"]', '[class*="tier"]', '[class*="price"]'],
    keyElements: ['Monthly/Annual Toggle', 'Tier Cards (Starter, Pro, Enterprise)', 'Feature list with checkmarks', 'Highlighted "Most Popular" card'],
  },
  testimonials: {
    name: 'Testimonials & Social Proof Carousel',
    description: 'Customer quotes, user avatars, star ratings, company logos, and slider/carousel controls.',
    selectors: ['[class*="testimonial"]', '[class*="review"]', '[class*="quote"]', '[class*="client"]'],
    keyElements: ['Customer Review Cards', 'Star Ratings', 'User Avatars & Role/Company', 'Prev/Next slider arrows'],
  },
  faq: {
    name: 'FAQ Accordion',
    description: 'Expandable/collapsible FAQ questions with smooth height animations, rotating chevron indicators, and clear typography.',
    selectors: ['details', '[class*="faq"]', '[class*="accordion"]', '[class*="collapse"]'],
    keyElements: ['Question triggers', 'Chevron icon rotation', 'Collapsible answer bodies', 'Single/Multi expand logic'],
  },
  footer: {
    name: 'Footer & Site Directory',
    description: 'Multi-column footer layout with grouped links, newsletter signup, social media icons, language selector, and copyright.',
    selectors: ['footer', '[class*="footer"]', '[role="contentinfo"]'],
    keyElements: ['Multi-column link lists', 'Newsletter box', 'Social icons', 'Copyright & Legal links', 'Theme / Language switcher'],
  },
};

function sliceComponent(telemetry = {}, sectionKey = 'navbar', options = {}) {
  const sectionDef = SECTION_DEFINITIONS[sectionKey] || SECTION_DEFINITIONS.navbar;
  const framework = options.framework || 'react-tailwind';
  const customInstructions = options.customInstructions || '';

  // Extract top colors and fonts
  const colors = (telemetry.colors || []).slice(0, 10).map(c => typeof c === 'string' ? c : c.color);
  const primaryFont = telemetry.fonts?.families?.[0] || 'Inter, sans-serif';

  return `\
You are an expert frontend UI engineer. Build an isolated, production-ready ${sectionDef.name} based on the design system and specifications below.

TARGET FRAMEWORK: ${framework.toUpperCase()}
SECTION FOCUS   : ${sectionDef.name}
SOURCE SITE     : ${telemetry.meta?.title || 'Target Website'} (${telemetry.meta?.canonical || ''})

═══════════════════════════════════════════════════════════════
  COMPONENT SPECIFICATIONS
═══════════════════════════════════════════════════════════════

1. DESCRIPTION:
   ${sectionDef.description}

2. ESSENTIAL ELEMENTS TO INCLUDE:
${sectionDef.keyElements.map(e => `   • ${e}`).join('\n')}

3. DESIGN TOKENS (Match precisely):
   • Primary Colors : ${colors.join(', ')}
   • Typography Font: ${primaryFont}
   • Theme Background: ${colors[colors.length - 1] || '#0f172a'}
   • Accent Color    : ${colors[0] || '#3b82f6'}

4. INTERACTIVITY REQUIREMENTS:
   • Full responsive behavior across Mobile (375px), Tablet (768px), and Desktop (1440px).
   • Smooth hover and active transitions on all interactive buttons and links.
   • Self-contained state management (e.g. mobile drawer open/close, toggle state, accordion expansion).

${customInstructions ? `5. CUSTOM USER REQUIREMENTS:\n   • ${customInstructions}\n` : ''}
═══════════════════════════════════════════════════════════════
  OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════
1. Output a single clean, self-contained component file ready to drop into a ${framework} project.
2. Include all necessary Lucide icons and Tailwind CSS utility classes.
3. Zero placeholder comments; implement all items completely.
`;
}

module.exports = {
  SECTION_DEFINITIONS,
  sliceComponent,
};
