import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LeadPopup from '@/components/LeadPopup';
import SessionEndedNotice from '@/components/auth/SessionEndedNotice';
import NavigationProgress from '@/components/NavigationProgress';
import { getSiteSettings } from '@/lib/api';
import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-BT0LFL84HF';

export default async function SiteLayout({ children }) {
  const settings = await getSiteSettings({ next: { revalidate: 300 } }).catch(() => ({}));
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      <NavigationProgress />
      <Header settings={settings} />
      <main id="main-content">{children}</main>
      <Footer settings={settings} />
      <LeadPopup />
      <SessionEndedNotice />
    </>
  );
}
