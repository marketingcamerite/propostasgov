import React from 'react';
import { ColorSettings } from '../types';
import { Palette } from 'lucide-react';

interface ColorControlsProps {
  colors: ColorSettings;
  onChange: (key: keyof ColorSettings, value: string) => void;
}

const PRESET_COLORS = [
  { label: 'Roxo Camerite', value: '#7B48EA' },
  { label: 'Roxo Escuro', value: '#3E2475' },
  { label: 'Branco', value: '#FFFFFF' },
];

const ColorControls: React.FC<ColorControlsProps> = ({ colors, onChange }) => {
  
  const renderColorOptions = (settingKey: keyof ColorSettings, currentValue: string) => (
    <div className="flex gap-3 mt-2">
      {PRESET_COLORS.map((preset) => (
        <button
          key={preset.value}
          onClick={() => onChange(settingKey, preset.value)}
          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none ${
            currentValue === preset.value 
              ? 'border-green-400 ring-2 ring-green-400/30' 
              : 'border-gray-600'
          }`}
          style={{ backgroundColor: preset.value }}
          title={preset.label}
        />
      ))}
    </div>
  );

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-camerite-main" />
        <h3 className="text-lg font-bold text-white">Personalização do PDF</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="text-xs uppercase text-gray-400 font-bold tracking-wider">Fundo (Cabeçalho/Totais)</label>
          <p className="text-[10px] text-gray-500 mb-1">A cor do texto se ajusta automaticamente para contraste.</p>
          {renderColorOptions('headerFooterBg', colors.headerFooterBg)}
        </div>
        
        <div>
          <label className="text-xs uppercase text-gray-400 font-bold tracking-wider">Texto dos Itens</label>
          <p className="text-[10px] text-gray-500 mb-1">Cor do texto da lista de itens.</p>
          {renderColorOptions('tableText', colors.tableText)}
        </div>
      </div>
    </div>
  );
};

export default ColorControls;