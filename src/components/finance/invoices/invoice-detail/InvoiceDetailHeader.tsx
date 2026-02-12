import React from 'react';
import { INVOICE_STATUS_LABELS } from '../../../../constants/finance';
import type { InvoiceStatus } from '../../../../constants/finance';
import type { CompanyResponse } from '../../../../types';
import type { InvoiceDetailData, DetailContactInfo } from './InvoiceDetailTypes';
import { formatDate, getStatusBadgeClasses } from './InvoiceDetailTypes';

interface InvoiceDetailHeaderProps {
  invoice: InvoiceDetailData;
  company: CompanyResponse | null;
  status: string;
  getCountryById: (id: string) => { name?: string } | undefined;
}

const InvoiceDetailHeader: React.FC<InvoiceDetailHeaderProps> = ({
  invoice,
  company,
  status,
  getCountryById,
}) => {
  return (
    <>
      {/* Header: Logo + Invoice Number | Dates + Status */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          {/* Company Logo */}
          {company?.logo_url && (
            <img
              src={company.logo_url}
              alt={company.name || 'Company Logo'}
              className="max-h-16 max-w-[200px] object-contain mb-4"
            />
          )}
          <h2 className="text-[32px] font-semibold leading-[40px] text-[#09090b] dark:text-white">
            {invoice.invoice_number}
          </h2>
        </div>
        <div className="flex flex-col gap-3 items-end">
          <div className="text-right">
            <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Invoice Date</p>
            <p className="text-[16px] font-semibold leading-[24px] text-[#09090b] dark:text-white">
              {formatDate(invoice.issue_date || invoice.invoice_date || '')}
            </p>
          </div>
          {invoice.due_date && (
            <div className="text-right">
              <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Due Date</p>
              <p className="text-[16px] font-semibold leading-[24px] text-[#09090b] dark:text-white">
                {formatDate(invoice.due_date)}
              </p>
            </div>
          )}
          {/* Status Badge */}
          <span className={`inline-flex items-center justify-center px-1.5 py-[1px] rounded text-[10px] font-medium ${getStatusBadgeClasses(status)}`}>
            {INVOICE_STATUS_LABELS[status as InvoiceStatus] || status}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#e5e5e5] dark:bg-gray-700 w-full" />

      {/* From / Billed To */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        {/* From */}
        <div className="flex-1 flex flex-col gap-[6px]">
          <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">From</p>
          <div className="flex flex-col gap-[2px]">
            {/* Company Name */}
            <p className="text-[16px] font-semibold leading-[24px] text-[#09090b] dark:text-white">
              {company?.name || invoice.company?.name || 'Your Company'}
            </p>
            {/* Company Address - Line 1 */}
            {(company?.address || company?.city || company?.state) && (
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                {[company?.address, company?.city, company?.state].filter(Boolean).join(', ')}
              </p>
            )}
            {/* Company Address - Line 2 (Postal Code & Country) */}
            {(company?.postal_code || company?.country) && (
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                {[company?.postal_code, company?.country].filter(Boolean).join(', ')}
              </p>
            )}
            {/* Company Contact Email */}
            {(company?.email || invoice.company?.email || invoice.created_by_user?.email) && (
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                {company?.email || invoice.company?.email || invoice.created_by_user?.email}
              </p>
            )}
            {/* Registration Number */}
            {company?.registration_number && (
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                Reg: {company.registration_number}
              </p>
            )}
            {/* Tax ID */}
            {company?.tax_id && (
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                Tax ID: {company.tax_id}
              </p>
            )}
          </div>
        </div>

        {/* Billed To */}
        <div className="flex-1 flex flex-col gap-[6px]">
          <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Billed to</p>
          <div className="flex flex-col gap-[2px]">
            <p className="text-[16px] font-semibold leading-[24px] text-[#09090b] dark:text-white">
              {invoice.contact ? `${invoice.contact.first_name} ${invoice.contact.last_name}` : 'N/A'}
            </p>
            {invoice.contact?.business_name && (
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                {invoice.contact.business_name}
              </p>
            )}
            {/* Client Address - Line 1 */}
            {invoice.contact?.address_line_1 && (
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                {invoice.contact.address_line_1}
              </p>
            )}
            {/* Client Address - Line 2 (if present) */}
            {invoice.contact?.address_line_2 && (
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                {invoice.contact.address_line_2}
              </p>
            )}
            {/* Client Address - City, State */}
            {(invoice.contact?.city || invoice.contact?.state) && (
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                {[invoice.contact?.city, invoice.contact?.state].filter(Boolean).join(', ')}
              </p>
            )}
            {/* Client Address - Postal Code, Country */}
            {(invoice.contact?.postcode || (invoice.contact as DetailContactInfo | null)?.country?.name || invoice.contact?.country_id) && (
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                {[
                  invoice.contact?.postcode?.trim(),
                  (invoice.contact as DetailContactInfo | null)?.country?.name || (invoice.contact?.country_id && getCountryById(invoice.contact.country_id)?.name)
                ].filter(Boolean).join(', ')}
              </p>
            )}
            {/* Tax Number */}
            {invoice.contact?.tax_id && (
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                Tax Number: {invoice.contact.tax_id}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceDetailHeader;
