import React from 'react';
import OrganizationForm from './OrganizationForm';

const NewOrganization: React.FC = () => {
  // Todas as verificações de permissão são tratadas no AdminRedirect
  return <OrganizationForm />;
};

export default NewOrganization;