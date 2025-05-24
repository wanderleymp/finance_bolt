import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, ChevronLeft, Package, DollarSign, CheckSquare, 
  AlertTriangle, Code, ChevronDown, Info
} from 'lucide-react';
import { SaaSModule } from '../../../types';
import { supabase, isUserAdmin } from '../../../lib/supabase';
import { updateModuleBypassRLS } from '../../../lib/supabaseAdmin';
import * as LucideIcons from 'lucide-react';
import { useUI } from '../../../contexts/UIContext';

// Lista de ícones disponíveis no Lucide-React
const availableIcons = [
  'activity', 'airplay', 'alert-circle', 'alert-triangle', 'archive', 'arrow-down',
  'arrow-up', 'bar-chart', 'battery', 'bell', 'bluetooth', 'book', 'bookmark',
  'box', 'briefcase', 'calendar', 'camera', 'cast', 'check', 'check-circle', 
  'check-square', 'chevron-down', 'chevron-left', 'chevron-right', 'chevron-up', 
  'clipboard', 'clock', 'cloud', 'code', 'codepen', 'coffee', 'command', 'compass',
  'copy', 'cpu', 'credit-card', 'crop', 'database', 'delete', 'disc', 'dollar-sign',
  'download', 'droplet', 'edit', 'edit-2', 'edit-3', 'external-link', 'eye', 
  'eye-off', 'facebook', 'fast-forward', 'feather', 'file', 'file-minus', 'file-plus',
  'file-text', 'film', 'filter', 'flag', 'folder', 'folder-minus', 'folder-plus', 
  'gift', 'git-branch', 'git-commit', 'git-merge', 'git-pull-request', 'github',
  'gitlab', 'globe', 'grid', 'hard-drive', 'hash', 'headphones', 'heart', 'help-circle',
  'home', 'image', 'inbox', 'info', 'instagram', 'layers', 'layout', 'link', 'link-2',
  'linkedin', 'list', 'loader', 'lock', 'log-in', 'log-out', 'mail', 'map', 'map-pin',
  'maximize', 'maximize-2', 'menu', 'message-circle', 'message-square', 'mic', 'mic-off',
  'minimize', 'minimize-2', 'minus', 'minus-circle', 'minus-square', 'monitor', 'moon',
  'more-horizontal', 'more-vertical', 'mouse-pointer', 'move', 'music', 'navigation',
  'navigation-2', 'octagon', 'package', 'paperclip', 'pause', 'pause-circle', 'percent',
  'phone', 'phone-call', 'phone-forwarded', 'phone-incoming', 'phone-missed', 'phone-off',
  'phone-outgoing', 'pie-chart', 'play', 'play-circle', 'plus', 'plus-circle', 'plus-square',
  'pocket', 'power', 'printer', 'radio', 'refresh-ccw', 'refresh-cw', 'repeat', 'rewind',
  'rotate-ccw', 'rotate-cw', 'rss', 'save', 'scissors', 'search', 'send', 'server',
  'settings', 'share', 'share-2', 'shield', 'shield-off', 'shopping-bag', 'shopping-cart',
  'shuffle', 'sidebar', 'skip-back', 'skip-forward', 'slack', 'slash', 'sliders', 'smartphone',
  'speaker', 'square', 'star', 'stop-circle', 'sun', 'sunrise', 'sunset', 'tablet',
  'tag', 'target', 'terminal', 'thermometer', 'thumbs-down', 'thumbs-up', 'toggle-left',
  'toggle-right', 'trash', 'trash-2', 'trello', 'trending-down', 'trending-up', 'triangle',
  'truck', 'tv', 'twitter', 'type', 'umbrella', 'underline', 'unlock', 'upload', 'user',
  'user-check', 'user-minus', 'user-plus', 'user-x', 'users', 'video', 'video-off', 'voicemail',
  'volume', 'volume-1', 'volume-2', 'volume-x', 'watch', 'wifi', 'wifi-off', 'wind', 'x',
  'x-circle', 'x-square', 'youtube', 'zap', 'zoom-in', 'zoom-out'
];

type FormMode = 'create' | 'edit';

const ModuleForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const mode: FormMode = id ? 'edit' : 'create';
  const { addToast } = useUI();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [iconSearchTerm, setIconSearchTerm] = useState('');
  const [showIconSelector, setShowIconSelector] = useState(false);
  
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    description: string;
    icon: string;
    isCore: boolean;
    price: number;
    isActive: boolean;
  }>({
    name: '',
    code: '',
    description: '',
    icon: 'package',
    isCore: false,
    price: 0,
    isActive: true
  });
  
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    code?: string;
    price?: string;
  }>({});

  useEffect(() => {
    // Se estamos no modo edição, buscar os dados do módulo
    if (mode === 'edit' && id) {
      fetchModuleData(id);
    }
  }, [mode, id]);

  const fetchModuleData = async (moduleId: string) => {
    try {
      setLoading(true);
      console.log("ModuleForm: Buscando dados do módulo:", moduleId);
      
      const { data, error } = await supabase
        .from('saas_modules')
        .select('*')
        .eq('id', moduleId)
        .single();
      
      if (error) {
        console.error("ModuleForm: Erro ao buscar dados do módulo:", error);
        throw error;
      }
      
      if (data) {
        console.log("ModuleForm: Dados do módulo encontrados:", data);
        
        setFormData({
          name: data.name,
          code: data.code,
          description: data.description || '',
          icon: data.icon || 'package',
          isCore: data.is_core,
          price: data.price,
          isActive: data.is_active
        });
      } else {
        console.log("ModuleForm: Nenhum dado encontrado para o módulo:", moduleId);
        throw new Error("Módulo não encontrado");
      }
    } catch (err) {
      console.error('Erro ao buscar dados do módulo:', err);
      
      addToast({
        title: 'Erro',
        message: 'Não foi possível carregar os dados do módulo',
        type: 'error'
      });
      
      setError('Não foi possível carregar os dados do módulo. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: {
      name?: string;
      code?: string;
      price?: string;
    } = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    if (!formData.code.trim()) {
      errors.code = 'Código é obrigatório';
    } else if (!/^[a-z0-9_]+$/.test(formData.code)) {
      errors.code = 'Código deve conter apenas letras minúsculas, números e underscores';
    }
    
    if (formData.price < 0) {
      errors.price = 'Preço não pode ser negativo';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addToast({
        title: 'Erro de validação',
        message: 'Verifique os campos do formulário',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (mode === 'create') {
        // Criar novo módulo
        console.log("ModuleForm: Criando novo módulo...", formData);
        
        const { data, error } = await supabase
          .from('saas_modules')
          .insert([{
            name: formData.name,
            code: formData.code,
            description: formData.description || null,
            icon: formData.icon,
            is_core: formData.isCore,
            price: formData.price,
            is_active: formData.isActive
          }]);
        
        if (error) {
          console.error("ModuleForm: Erro ao criar módulo:", error);
          throw error;
        }
        
        console.log("ModuleForm: Módulo criado com sucesso:", data);
        
        setSuccess('Módulo criado com sucesso!');
        
        addToast({
          title: 'Sucesso',
          message: 'Módulo criado com sucesso!',
          type: 'success'
        });
        
        // Limpar o formulário após criar
        setFormData({
          name: '',
          code: '',
          description: '',
          icon: 'package',
          isCore: false,
          price: 0,
          isActive: true
        });
        
        // Redirecionar para a lista após um breve delay
        setTimeout(() => {
          navigate('/admin/modules');
        }, 1500);
        
      } else if (mode === 'edit' && id) {
        // Atualizar módulo existente
        console.log("ModuleForm: Atualizando módulo existente...", formData);
        
        // Simplificar o payload para evitar problemas de tipagem ou campos inválidos
        const updatePayload = {
          name: formData.name,
          code: formData.code,
          description: formData.description || null,
          icon: formData.icon || 'package',
          is_core: Boolean(formData.isCore),
          price: Number(formData.price) || 0,
          is_active: Boolean(formData.isActive),
          updated_at: new Date().toISOString()
        };
        
        // Salva debug global para exibir na interface
        if (typeof window !== 'undefined') {
          (window as any)._lastModuleUpdateDebug = { id, updatePayload };
        }
        
        console.log('ModuleForm: Tentando atualizar módulo usando bypass RLS');
        
        // Usar a função especial que contorna as restrições de RLS
        const result = await updateModuleBypassRLS(id, updatePayload);
        console.log('ModuleForm: Resultado do bypass RLS:', result);
        
        if (result.error) {
          throw result.error;
        }
        
        if (!result.data || result.data.length === 0) {
          throw new Error('Nenhum dado retornado após a atualização. Verifique se o ID está correto.');
        }
        
        // Sucesso na atualização
        console.log("ModuleForm: Módulo atualizado com sucesso via bypass RLS");
        
        setSuccess('Módulo atualizado com sucesso!');
        
        addToast({
          title: 'Sucesso',
          message: 'Módulo atualizado com sucesso!',
          type: 'success'
        });
        
        // Redirecionar para a lista após um breve delay
        setTimeout(() => {
          navigate('/admin/modules');
        }, 1500);
      }
    } catch (err: any) {
      console.error('ModuleForm: Erro ao salvar módulo:', err);
      
      if (err && Object.keys(err).length === 0) {
        console.log('ModuleForm: Erro vazio detectado - possível problema de permissão no Supabase');
        setError('Erro de permissão: Você pode não ter permissão para atualizar este registro. Verifique as políticas RLS no Supabase.');
        
        addToast({
          title: 'Erro de Permissão',
          message: 'Você pode não ter permissão para atualizar este registro. Verifique as políticas RLS no Supabase.',
          type: 'error'
        });
        return;
      }
      
      // Mensagem de erro padrão
      const errorMessage = err.message || 'Ocorreu um erro ao salvar o módulo. Por favor, tente novamente.';
      setError(errorMessage);
      
      addToast({
        title: 'Erro',
        message: errorMessage,
        type: 'error'
      });
      
      // Verificar se é um erro de código duplicado
      if (err.code === '23505') {
        setError('Já existe um módulo com este código. Por favor, escolha outro código.');
        setFormErrors(prev => ({ ...prev, code: 'Código já em uso' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : name === 'price' 
          ? parseFloat(value) || 0 
          : value
    }));
    
    // Limpar erro específico deste campo
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name as keyof typeof formErrors];
        return updated;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const selectIcon = (icon: string) => {
    setFormData(prev => ({
      ...prev,
      icon
    }));
    setShowIconSelector(false);
    setIconSearchTerm('');
  };

  // Filtrar ícones pela pesquisa
  const filteredIcons = iconSearchTerm
    ? availableIcons.filter(icon => 
        icon.toLowerCase().includes(iconSearchTerm.toLowerCase())
      )
    : availableIcons;

  // Renderizar ícone do Lucide dinamicamente
  const renderIcon = (iconName: string, size = 20) => {
    try {
      const IconComponent = (LucideIcons as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase())];
      
      if (IconComponent) {
        return <IconComponent size={size} />;
      }
    } catch (err) {
      console.error(`Erro ao renderizar ícone ${iconName}:`, err);
    }
    
    // Ícone padrão se o especificado não existir
    return <Package size={size} />;
  };

  // Gerar código baseado no nome
  const generateCode = () => {
    if (formData.name && !formData.code) {
      const code = formData.name
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')  // Remove caracteres especiais
        .replace(/\s+/g, '_');      // Substitui espaços por underscores
      
      setFormData(prev => ({
        ...prev,
        code
      }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/modules')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Voltar para a lista de módulos
        </button>
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          {mode === 'create' ? 'Criar módulo' : 'Editar módulo'}
        </h2>
      </div>

      {/* ALERTA DE ERRO VISUAL */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 mb-6 rounded-md border border-red-200 dark:border-red-800 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 w-full">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </h3>
              {typeof window !== 'undefined' && (window as any)._lastModuleUpdateDebug && (
                <div className="mt-2 text-xs text-gray-700 dark:text-gray-200 break-all">
                  <strong>ID:</strong> {(window as any)._lastModuleUpdateDebug.id}<br/>
                  <strong>Payload:</strong> {JSON.stringify((window as any)._lastModuleUpdateDebug.updatePayload)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border ${formErrors.name ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            required
          />
          {formErrors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
          )}
        </div>
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Código <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border ${formErrors.code ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            required
          />
          {formErrors.code && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.code}</p>
          )}
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Descreva as funcionalidades deste módulo..."
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Preço (R$)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className={`w-full px-4 py-2 border ${formErrors.price ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
          />
          {formErrors.price && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.price}</p>
          )}
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isCore"
            name="isCore"
            checked={formData.isCore}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="isCore" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Módulo Essencial (incluso em todos os planos)
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Ativo
          </label>
        </div>
        <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6">
          <button
            type="button"
            onClick={() => navigate('/admin/modules')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar Módulo'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModuleForm;