import Image from 'next/image';

const COPY = {
  login: {
    eyebrow: 'Welcome back',
    title: <>Your listings and enquiries, <span className="text-primary">right where you left them.</span></>,
    sub: 'Log in with your mobile number to manage properties, reply to buyers and post new listings. No password to remember.',
  },
  signup: {
    eyebrow: 'Free for owners',
    title: <>List your property. <span className="text-primary">Hear from real buyers.</span></>,
    sub: 'Create an account in under a minute and post homes, shops or plots across Ahmedabad and Gandhinagar, free of charge.',
  },
};

const POINTS = [
  { title: 'Free to post', text: 'No listing fees, ever', icon: 'M12 4v16m8-8H4' },
  { title: 'No passwords', text: 'Sign in with an SMS code', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { title: 'Direct contact', text: 'Buyers call you, not a broker', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
];

const pin = (
  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" /></svg>
);

function Photo({ src, alt, caption, className = '', sizes, priority, children }) {
  return (
    <figure className={`relative overflow-hidden rounded-2xl bg-gray-200 ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      {caption && (
        <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-1 px-3 pb-2.5 pt-8 bg-gradient-to-t from-black/65 to-transparent text-white text-xs font-semibold">
          {pin}
          {caption}
        </figcaption>
      )}
      {children}
    </figure>
  );
}

// Faint site-plan grid behind the page, fading out toward the edges.
const gridStyle = {
  backgroundImage:
    'linear-gradient(to right, rgba(77,60,154,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(77,60,154,0.07) 1px, transparent 1px)',
  backgroundSize: '36px 36px',
  WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 70% 45%, #000 30%, transparent 85%)',
  maskImage: 'radial-gradient(ellipse 75% 70% at 70% 45%, #000 30%, transparent 85%)',
};

export default function AuthLayout({ mode = 'login', children }) {
  const copy = COPY[mode];

  return (
    <section className="relative overflow-hidden bg-[#f7f6fb] border-b border-gray-200/70">
      <div aria-hidden="true" className="absolute inset-0" style={gridStyle} />

      <div className="container-px relative py-8 md:py-14 lg:py-20 grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 lg:gap-16 items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            <span className="w-6 h-px bg-primary" aria-hidden="true" />
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 text-[1.75rem] sm:text-4xl lg:text-[2.6rem] font-extrabold leading-[1.15] tracking-tight max-w-xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-[15px] sm:text-base text-gray-600 leading-relaxed max-w-lg">{copy.sub}</p>

          <div className="hidden md:grid grid-cols-5 grid-rows-2 gap-3 mt-9 h-[320px] lg:h-[360px]">
            <Photo
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=70"
              alt="Residential apartment towers"
              className="col-span-3 row-span-2"
              sizes="(min-width: 1280px) 400px, (min-width: 768px) 40vw, 1px"
              priority
            >
              <div className="absolute left-3 bottom-3 rounded-xl bg-white/95 backdrop-blur px-3.5 py-2.5 shadow-lg">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Owner listings</div>
                <div className="text-sm font-extrabold font-heading text-gray-900">Free to list</div>
              </div>
            </Photo>
            <Photo
              src="/images/cities/ahmedabad.jpg"
              alt="Atal Bridge over the Sabarmati riverfront at night, Ahmedabad"
              caption="Ahmedabad"
              className="col-span-2"
              sizes="(min-width: 1280px) 260px, 26vw"
            />
            <Photo
              src="/images/cities/gandhinagar.jpg"
              alt="Akshardham temple, Gandhinagar"
              caption="Gandhinagar"
              className="col-span-2"
              sizes="(min-width: 1280px) 260px, 26vw"
            />
          </div>

          <ul className="hidden md:grid grid-cols-3 gap-4 mt-7">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="w-9 h-9 shrink-0 rounded-lg bg-white border border-gray-200 text-primary flex items-center justify-center">
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={p.icon} /></svg>
                </span>
                <span>
                  <span className="block text-sm font-bold text-gray-900">{p.title}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full max-w-md mx-auto lg:mr-0">{children}</div>
      </div>
    </section>
  );
}
