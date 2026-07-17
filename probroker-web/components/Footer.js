import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="container-px py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="text-white font-bold text-lg mb-2">PRObroker</div>
          <p className="text-gray-400">Real estate listings for Ahmedabad and Gandhinagar. Buy, sell, and rent verified properties directly with owners.</p>
        </div>
        <div>
          <div className="text-white font-semibold mb-2">Buy</div>
          <Link className="block py-1 hover:text-white" href="/ahmedabad/flats-for-sale/">Flats for Sale</Link>
          <Link className="block py-1 hover:text-white" href="/ahmedabad/bungalows-for-sale/">Bungalows for Sale</Link>
          <Link className="block py-1 hover:text-white" href="/ahmedabad/shops-for-sale/">Shops for Sale</Link>
          <Link className="block py-1 hover:text-white" href="/ahmedabad/2-bhk-flats-for-sale/">2 BHK in Ahmedabad</Link>
          <Link className="block py-1 hover:text-white" href="/ahmedabad/3-bhk-flats-for-sale/">3 BHK in Ahmedabad</Link>
        </div>
        <div>
          <div className="text-white font-semibold mb-2">Rent</div>
          <Link className="block py-1 hover:text-white" href="/ahmedabad/flats-for-rent/">Flats for Rent</Link>
          <Link className="block py-1 hover:text-white" href="/ahmedabad/offices-for-rent/">Offices for Rent</Link>
          <Link className="block py-1 hover:text-white" href="/ahmedabad/shops-for-rent/">Shops for Rent</Link>
          <Link className="block py-1 hover:text-white" href="/ahmedabad/1-bhk-flats-for-rent/">1 BHK for Rent</Link>
          <Link className="block py-1 hover:text-white" href="/ahmedabad/2-bhk-flats-for-rent/">2 BHK for Rent</Link>
        </div>
        <div>
          <div className="text-white font-semibold mb-2">Company</div>
          <Link className="block py-1 hover:text-white" href="/about/">About Us</Link>
          <Link className="block py-1 hover:text-white" href="/contact/">Contact Us</Link>
          <Link className="block py-1 hover:text-white" href="/privacy-policy/">Privacy Policy</Link>
          <Link className="block py-1 hover:text-white" href="/terms/">Terms &amp; Conditions</Link>
          <Link className="block py-1 hover:text-white" href="/societies/">Societies</Link>
          <Link className="block py-1 hover:text-white" href="/submit-requirement/">Submit Requirement</Link>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} PRObroker. All rights reserved.
      </div>
    </footer>
  );
}
