import React from 'react';
import UsersForm from './UsersForm';

const NewUser: React.FC = () => {
  // Todas as verificações de permissão são tratadas no AdminRedirect
  return <UsersForm />;
};

export default NewUser;