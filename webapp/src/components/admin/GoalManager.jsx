import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus, Trash2, Save, Loader2, BookOpen, Star } from 'lucide-react';
import { apiClient } from '../../api/client';

const COLOR_STYLES = {
  blue: {
    header: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    button: 'hover:bg-blue-50 hover:text-blue-700',
  },
  orange: {
    header: 'bg-orange-50',
    icon: 'bg-orange-100 text-orange-600',
    button: 'hover:bg-orange-50 hover:text-orange-700',
  },
};

export default function GoalManager() {
  const [goals, setGoals] = useState({ prioritarias: [], complementarias: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.post('getMetas');
      setGoals(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.post('saveMetasConfig', goals);
      alert('Banco de Metas actualizado con éxito en la base de datos viva.');
    } catch {
      alert('Error al guardar las metas.');
    } finally {
      setIsSaving(false);
    }
  };

  const addGoal = (type) => {
    const newGoal = { id: Date.now(), text: '', dimension: 'general', type: type.slice(0, -1) };
    setGoals(prev => ({
      ...prev,
      [type]: [...prev[type], newGoal]
    }));
  };

  const updateGoal = (type, id, field, value) => {
    setGoals(prev => ({
      ...prev,
      [type]: prev[type].map(g => g.id === id ? { ...g, [field]: value } : g)
    }));
  };

  const removeGoal = (type, id) => {
    if(!window.confirm("¿Seguro que deseas eliminar esta meta del catálogo?")) return;
    setGoals(prev => ({
      ...prev,
      [type]: prev[type].filter(g => g.id !== id)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 flex-col text-brand-600">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium">Cargando catálogo desde la Base de Datos...</p>
      </div>
    );
  }

  const renderSection = (type, title, description, Icon, colorClass) => {
    const styles = COLOR_STYLES[colorClass];

    return (
    <Card className="shadow-sm border-gray-200 mb-8 overflow-hidden">
      <div className={`p-4 border-b border-gray-100 flex items-center ${styles.header}`}>
        <div className={`p-2 rounded-lg mr-3 ${styles.icon}`}>
          <Icon className="w-5 h-5"/>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <CardContent className="p-4 bg-gray-50/50">
        <div className="space-y-3">
          {goals[type].map((goal, index) => (
            <div key={goal.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-center focus-within:ring-2 focus-within:ring-brand-500 transition-all">
              <span className="text-gray-400 font-mono text-xs w-6 text-center">{index + 1}</span>
              <input
                type="text"
                className="flex-1 border-0 focus:ring-0 p-2 text-gray-900 bg-transparent"
                placeholder="Escribe el texto de la meta..."
                value={goal.text}
                onChange={(e) => updateGoal(type, goal.id, 'text', e.target.value)}
              />
              <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 px-2 md:px-0 justify-between items-center">
                <input 
                  type="text"
                  className="w-28 text-center text-xs border border-gray-200 rounded-md px-2 py-1 uppercase font-medium text-gray-600"
                  placeholder="Dimensión"
                  value={goal.dimension}
                  onChange={(e) => updateGoal(type, goal.id, 'dimension', e.target.value)}
                />
                <button 
                  onClick={() => removeGoal(type, goal.id)}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button 
          variant="outline" 
          className={`w-full mt-4 border-dashed border-2 ${styles.button}`}
          onClick={() => addGoal(type)}
        >
          <Plus className="w-4 h-4 mr-2"/> Añadir {title.replace("Metas ", "Meta ").toLowerCase()}
        </Button>
      </CardContent>
    </Card>
    );
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Banco Vivo de Metas</h2>
          <p className="text-gray-500 text-sm mt-1">Este catálogo alimentará dinámicamente el Generador de Metas de los estudiantes.</p>
        </div>
        <Button 
          onClick={handleSave} 
          isLoading={isSaving}
          className="bg-brand-600 hover:bg-brand-700 shadow-sm"
        >
          <Save className="w-4 h-4 mr-2"/> Guardar Cambios
        </Button>
      </div>

      {renderSection('prioritarias', 'Metas Prioritarias', 'Enfocadas en resolver áreas de oportunidad académica (idiomas, retención, reprobados).', BookOpen, 'blue')}
      
      {renderSection('complementarias', 'Metas Complementarias', 'Orientadas al desarrollo personal, bienestar y habilidades blandas.', Star, 'orange')}
      
    </div>
  );
}
