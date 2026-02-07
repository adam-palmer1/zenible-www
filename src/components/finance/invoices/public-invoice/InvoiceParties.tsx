import React from 'react';

export interface InvoicePartiesProps {
  invoice: any;
}

const InvoiceParties: React.FC<InvoicePartiesProps> = ({ invoice }) => {
  return (
    <div className="flex gap-8">
      {/* From */}
      <div className="flex-1 flex flex-col gap-[6px]">
        <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">From</p>
        <div className="flex flex-col gap-[2px]">
          {/* Company Name */}
          <p className="text-[16px] font-semibold leading-[24px] text-[#09090b]">
            {invoice.company_name || 'Company'}
          </p>
          {/* Company Address - Line 1 */}
          {invoice.company_address && (
            <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
              {invoice.company_address}
            </p>
          )}
          {/* Company Address - Line 2 (City, State) */}
          {(invoice.company_city || invoice.company_state) && (
            <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
              {[invoice.company_city, invoice.company_state].filter(Boolean).join(', ')}
            </p>
          )}
          {/* Company Address - Line 3 (Postal Code, Country) */}
          {(invoice.company_postal_code || invoice.company_country) && (
            <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
              {[invoice.company_postal_code, invoice.company_country].filter(Boolean).join(', ')}
            </p>
          )}
          {/* Company Email */}
          {invoice.company_email && (
            <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
              {invoice.company_email}
            </p>
          )}
          {/* Company Phone */}
          {invoice.company_phone && (
            <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
              {invoice.company_phone}
            </p>
          )}
        </div>
      </div>

      {/* Billed To */}
      <div className="flex-1 flex flex-col gap-[6px]">
        <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Billed to</p>
        <div className="flex flex-col gap-[2px]">
          {/* Contact Name */}
          <p className="text-[16px] font-semibold leading-[24px] text-[#09090b]">
            {invoice.contact_name || invoice.client_name || 'Client'}
          </p>
          {/* Business Name (if different from contact name) */}
          {invoice.contact_business_name && (
            <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
              {invoice.contact_business_name}
            </p>
          )}
          {/* Contact Address - Line 1 */}
          {invoice.contact_address && (
            <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
              {invoice.contact_address}
            </p>
          )}
          {/* Contact Address - Line 2 (if present) */}
          {invoice.contact_address_line_2 && (
            <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
              {invoice.contact_address_line_2}
            </p>
          )}
          {/* Contact Address - City, State */}
          {(invoice.contact_city || invoice.contact_state) && (
            <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
              {[invoice.contact_city, invoice.contact_state].filter(Boolean).join(', ')}
            </p>
          )}
          {/* Contact Address - Postal Code, Country */}
          {(invoice.contact_postcode || invoice.contact_country) && (
            <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
              {[invoice.contact_postcode?.trim(), invoice.contact_country].filter(Boolean).join(', ')}
            </p>
          )}
          {/* Tax Number */}
          {invoice.contact_tax_id && (
            <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
              Tax Number: {invoice.contact_tax_id}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceParties;
