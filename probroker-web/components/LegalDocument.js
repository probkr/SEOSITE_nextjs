// Renders a legal document from lib/legal/* as headings, paragraphs and bullet lists.
export default function LegalDocument({ doc }) {
  return (
    <div className="text-gray-700 leading-relaxed">
      {doc.lastUpdated && (
        <p className="text-sm text-gray-500 mb-6">Last Updated Date: {doc.lastUpdated}</p>
      )}
      {doc.blocks.map((b, i) => {
        if (b.type === 'h2') {
          return <h2 key={i} className="text-xl font-bold font-heading text-gray-900 mt-8 mb-3">{b.text}</h2>;
        }
        if (b.type === 'h3') {
          return <h3 key={i} className="text-lg font-semibold font-heading text-gray-900 mt-6 mb-2">{b.text}</h3>;
        }
        if (b.type === 'ul') {
          return (
            <ul key={i} className="list-disc pl-6 mb-4 space-y-1.5">
              {b.items.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          );
        }
        return <p key={i} className="mb-4">{b.text}</p>;
      })}
    </div>
  );
}
