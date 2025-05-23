import React from 'react';
import UsersForm from './UsersForm';

const EditUser: React.FC = () => {
  // Todas as verificações de permissão são tratadas no AdminRedirect
  return <UsersForm />;
};

export default EditUser;