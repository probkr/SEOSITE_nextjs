import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LeadPopup from '@/components/LeadPopup';
import { getSiteSettings } from '@/lib/api';

export default async function SiteLayout({ children }) {
  const settings = await getSiteSettings({ next: { revalidate: 300 } }).catch(() => ({}));
  return (
    <>
      <Header settings={settings} />
      <main>{children}</main>
      <Footer settings={settings} />
      <LeadPopup />
    </>
  );
}
