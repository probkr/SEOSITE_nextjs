'use client';

export default function AddPanel({ open, onClose, title, children }) {
  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 bg-black/40 z-40 ${open ? 'block' : 'hidden'}`} />
      <div className={`fixed top-0 right-0 h-screen w-[380px] max-w-[90vw] bg-white z-50 shadow-2xl overflow-y-auto transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </>
  );
}
