import React from 'react';
import TenantForm from './TenantForm';

const NewTenant: React.FC = () => {
  // Todas as verificações de permissão foram removidas
  // Seguindo o mesmo padrão que funcionou em Modules e Plans
  return <TenantForm />;
};

export default NewTenant;