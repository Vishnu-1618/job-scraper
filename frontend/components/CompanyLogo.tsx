import { useState } from 'react';

interface CompanyLogoProps {
    companyName: string;
    className?: string;
}

function getDomainFromName(name: string) {
    if (!name) return '';
    let clean = name.toLowerCase();

    // Remove legal entities and generic words
    const stopWords = ['inc', 'llc', 'corp', 'corporation', 'ltd', 'limited', 'co', 'company', 'services', 'technologies', 'solutions', 'group', 'pvt', 'private'];
    const regex = new RegExp(`\\b(${stopWords.join('|')})\\b\\.?`, 'gi');
    clean = clean.replace(regex, '');

    // Split by comma, dash, pipe to get the core name
    clean = clean.split(/[,|\-]/)[0];

    // Remove all non-alphanumeric except spaces
    clean = clean.replace(/[^a-z0-9 ]/g, '').trim();

    // Replace spaces with empty string
    return clean.replace(/\s+/g, '') + '.com';
}

export default function CompanyLogo({ companyName, className = '' }: CompanyLogoProps) {
    const [error, setError] = useState(false);

    const domain = getDomainFromName(companyName);
    const logoUrl = `https://logo.clearbit.com/${domain}`;

    // UI avatar fallback if logo API fails
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName || 'Job')}&background=050505&color=fff&size=128&font-size=0.4&bold=true`;

    return (
        <div className={`bg-white flex items-center justify-center overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${className}`}>
            <img
                src={error ? fallbackUrl : logoUrl}
                alt={`${companyName} logo`}
                className={error ? "w-full h-full object-cover" : "w-full h-full object-contain p-1"}
                onError={() => setError(true)}
            />
        </div>
    );
}
