import React from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface ContactImportProps {
  onClose: () => void;
}

const ContactImport: React.FC<ContactImportProps> = ({ onClose: _onClose }) => {
  return (
    <div className="p-8 text-center">
      <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Import Contacts</h3>
      <p className="text-sm text-gray-500">Import feature coming soon...</p>
    </div>
  );
};

export default ContactImport;
