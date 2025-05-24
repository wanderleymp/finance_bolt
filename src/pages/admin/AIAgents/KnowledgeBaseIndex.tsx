import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminRedirect from '../../../components/admin/AdminRedirect';
import { 
  Plus, Search, Filter, Edit, Trash, Eye, 
  Database, FileText, UploadCloud, CheckCircle, 
  AlertTriangle, Check, X, Download
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';
import { AIKnowledgeBase, AIKnowledgeDocument } from '../../../types/agent';

const KnowledgeBaseIndex: React.FC = () => {
  const { addToast } = useUI();
  const [loading, setLoading] = useState(true);
  const [knowledgeBases, setKnowledgeBases] = useState<AIKnowledgeBase[]>([]);
  const [selectedBase, setSelectedBase] = useState<AIKnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<AIKnowledgeDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  useEffect(() => {
    if (selectedBase) {
      fetchDocuments(selectedBase.id);
    }
  }, [selectedBase]);

  const fetchKnowledgeBases = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('ai_knowledge_bases')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        const formattedBases: AIKnowledgeBase[] = data.map(kb => ({
          id: kb.id,
          name: kb.name,
          description: kb.description,
          tenantId: kb.tenant_id,
          isSystem: kb.is_system,
          embeddingModelId: kb.embedding_model_id,
          chunkSize: kb.chunk_size,
          chunkOverlap: kb.chunk_overlap,
          metadata: kb.metadata,
          isActive: kb.is_active,
          createdBy: kb.created_by,
          createdAt: kb.created_at,
          updatedAt: kb.updated_at
        }));
        
        setKnowledgeBases(formattedBases);
        
        // Selecionar a primeira base por padrão
        if (formattedBases.length > 0 && !selectedBase) {
          setSelectedBase(formattedBases[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar bases de conhecimento:', err);
      setError('Não foi possível carregar as bases de conhecimento. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar bases de conhecimento',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (knowledgeBaseId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_knowledge_documents')
        .select('*')
        .eq('knowledge_base_id', knowledgeBaseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedDocuments: AIKnowledgeDocument[] = data.map(doc => ({
          id: doc.id,
          knowledgeBaseId: doc.knowledge_base_id,
          title: doc.title,
          content: doc.content,
          filePath: doc.file_path,
          fileType: doc.file_type,
          fileSize: doc.file_size,
          status: doc.status,
          metadata: doc.metadata,
          embeddingStatus: doc.embedding_status,
          chunksCount: doc.chunks_count,
          createdBy: doc.created_by,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at
        }));
        
        setDocuments(formattedDocuments);
      }
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar documentos da base de conhecimento',
        type: 'error'
      });
    }
  };

  const handleDeleteKnowledgeBase = async (kbId: string) => {
    // Se não estiver no modo de confirmação para esta base, solicitar confirmação
    if (deleteConfirmation !== kbId) {
      setDeleteConfirmation(kbId);
      return;
    }

    // Se chegou aqui, é porque confirmou a exclusão
    try {
      setLoading(true);
      
      // Verificar se é uma base do sistema
      const baseToDelete = knowledgeBases.find(kb => kb.id === kbId);
      if (baseToDelete?.isSystem) {
        throw new Error('Bases de conhecimento do sistema não podem ser excluídas');
      }
      
      // Excluir a base de conhecimento
      const { error } = await supabase
        .from('ai_knowledge_bases')
        .delete()
        .eq('id', kbId);

      if (error) throw error;

      // Atualizar a lista de bases
      setKnowledgeBases(prev => prev.filter(kb => kb.id !== kbId));
      
      // Se a base excluída era a selecionada, selecionar outra
      if (selectedBase?.id === kbId) {
        const remainingBases = knowledgeBases.filter(kb => kb.id !== kbId);
        setSelectedBase(remainingBases.length > 0 ? remainingBases[0] : null);
      }
      
      addToast({
        title: 'Sucesso',
        message: 'Base de conhecimento excluída com sucesso',
        type: 'success'
      });
    } catch (err) {
      console.error('Erro ao excluir base de conhecimento:', err);
      
      addToast({
        title: 'Erro na exclusão',
        message: err instanceof Error ? err.message : 'Não foi possível excluir a base de conhecimento',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setDeleteConfirmation(null);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    // Se não estiver no modo de confirmação para este documento, solicitar confirmação
    if (deleteConfirmation !== docId) {
      setDeleteConfirmation(docId);
      return;
    }

    // Se chegou aqui, é porque confirmou a exclusão
    try {
      setLoading(true);
      
      // Excluir o documento
      const { error } = await supabase
        .from('ai_knowledge_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      // Atualizar a lista de documentos
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      
      addToast({
        title: 'Sucesso',
        message: 'Documento excluído com sucesso',
        type: 'success'
      });
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
      
      addToast({
        title: 'Erro na exclusão',
        message: err instanceof Error ? err.message : 'Não foi possível excluir o documento',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setDeleteConfirmation(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  // Filtrar bases de conhecimento
  const filteredKnowledgeBases = knowledgeBases.filter(kb => {
    const matchesSearch = 
      kb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (kb.description && kb.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = 
      filterType === 'all' || 
      (filterType === 'system' && kb.isSystem) || 
      (filterType === 'tenant' && !kb.isSystem);
    
    return matchesSearch && matchesType;
  });

  // Formatar tamanho de arquivo
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AdminRedirect>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Database className="h-7 w-7 mr-2 text-indigo-600 dark:text-indigo-400" />
              Bases de Conhecimento
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie bases de conhecimento para seus agentes de IA
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link
              to="/admin/ai-knowledge/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Base de Conhecimento
            </Link>
          </div>
        </div>

        {/* Filtros e pesquisa */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Pesquisar bases de conhecimento..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative w-full md:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={16} className="text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Todas as Bases</option>
                <option value="system">Bases do Sistema</option>
                <option value="tenant">Bases do Tenant</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {error}
                </h3>
                <div className="mt-2">
                  <button
                    onClick={fetchKnowledgeBases}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && !selectedBase ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Carregando bases de conhecimento...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Lista de Bases de Conhecimento */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Bases de Conhecimento
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredKnowledgeBases.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      Nenhuma base de conhecimento encontrada
                    </div>
                  ) : (
                    filteredKnowledgeBases.map(kb => (
                      <div
                        key={kb.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          selectedBase?.id === kb.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                        }`}
                        onClick={() => setSelectedBase(kb)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {kb.name}
                            </h3>
                            {kb.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {kb.description}
                              </p>
                            )}
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                kb.isSystem
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                              }`}>
                                {kb.isSystem ? 'Sistema' : 'Tenant'}
                              </span>
                              
                              {!kb.isActive && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                  Inativo
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-1">
                            <Link
                              to={`/admin/ai-knowledge/${kb.id}/edit`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              <Edit size={16} />
                            </Link>
                            
                            {!kb.isSystem && (
                              <>
                                {deleteConfirmation === kb.id ? (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelDelete();
                                      }}
                                      className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                      <X size={16} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteKnowledgeBase(kb.id);
                                      }}
                                      className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                      <Check size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteKnowledgeBase(kb.id);
                                    }}
                                    className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <Trash size={16} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Documentos da Base Selecionada */}
            <div className="lg:col-span-3">
              {selectedBase ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                      Documentos: {selectedBase.name}
                    </h2>
                    
                    <button
                      onClick={() => setUploadModalOpen(true)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <UploadCloud className="h-4 w-4 mr-1.5" />
                      Adicionar Documento
                    </button>
                  </div>
                  
                  {documents.length === 0 ? (
                    <div className="p-6 text-center">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum documento</h3>
                      <p className="mt-1 text-gray-500 dark:text-gray-400">
                        Esta base de conhecimento não possui documentos.
                      </p>
                      <button
                        onClick={() => setUploadModalOpen(true)}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <UploadCloud className="h-4 w-4 mr-2" />
                        Adicionar Documento
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Documento
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Tipo
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Tamanho
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Adicionado em
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {documents.map(doc => (
                            <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {doc.title}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {doc.fileType || 'Texto'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {formatFileSize(doc.fileSize)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  doc.status === 'processed'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                    : doc.status === 'processing'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                                    : doc.status === 'error'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  {doc.status === 'processed' ? 'Processado' : 
                                   doc.status === 'processing' ? 'Processando' : 
                                   doc.status === 'error' ? 'Erro' : 'Pendente'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                    title="Visualizar"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  
                                  <button
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                    title="Download"
                                  >
                                    <Download size={16} />
                                  </button>
                                  
                                  {deleteConfirmation === doc.id ? (
                                    <>
                                      <button
                                        onClick={cancelDelete}
                                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                        title="Cancelar"
                                      >
                                        <X size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteDocument(doc.id)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                        title="Confirmar exclusão"
                                      >
                                        <Check size={16} />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleDeleteDocument(doc.id)}
                                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                      title="Excluir"
                                    >
                                      <Trash size={16} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center border border-gray-200 dark:border-gray-700">
                  <Database className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhuma base selecionada</h3>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">
                    Selecione uma base de conhecimento para ver seus documentos.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Modal de Upload (simplificado) */}
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
              </div>
              
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 sm:mx-0 sm:h-10 sm:w-10">
                      <UploadCloud className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        Adicionar Documento
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Selecione um arquivo para adicionar à base de conhecimento.
                        </p>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Título do Documento
                        </label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Título do documento"
                        />
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Arquivo
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600 dark:text-gray-400">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                              >
                                <span>Selecionar arquivo</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                              </label>
                              <p className="pl-1">ou arraste e solte</p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              PDF, DOCX, TXT, CSV até 10MB
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Enviar
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminRedirect>
  );
};

export default KnowledgeBaseIndex;