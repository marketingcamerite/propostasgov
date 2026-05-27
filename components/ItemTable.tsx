
import React from 'react';
import { ProposalItem } from '../types';
import { Search } from 'lucide-react';

interface ItemTableProps {
  items: ProposalItem[];
  onUpdateItem: (id: number, field: 'quantity' | 'unitPrice', value: number) => void;
}

const ItemTable: React.FC<ItemTableProps> = ({ items, onUpdateItem }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredItems = items.filter(item => 
    item.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(val);
  };

  const REALOCACAO_IDS = [26, 27, 28];
  const TREINAMENTO_ID = 25;
  const INSTALACAO_ID = 29;
  const INTEGRACAO_GOV_ID = 41;
  const LICENCA_ID = 22;
  const LINK_INTERNET_ID = 23;
  const PONTO_ENERGIA_ID = 24;

  const EDITABLE_PRICE_IDS = [INSTALACAO_ID, LINK_INTERNET_ID, PONTO_ENERGIA_ID];

  const totalMensal = items
    .filter(i => i.type === 'mensal')
    .reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
  
  const totalTreinamento = items
    .filter(i => i.id === TREINAMENTO_ID)
    .reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);

  const totalRealocacoes = items
    .filter(i => REALOCACAO_IDS.includes(i.id))
    .reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);

  const totalInstalacao = items
    .filter(i => i.id === INSTALACAO_ID)
    .reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);

  const totalIntegracao = items
    .filter(i => i.id === INTEGRACAO_GOV_ID)
    .reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);

  const totalImplantacao = items
    .filter(i => i.type === 'unico' && !REALOCACAO_IDS.includes(i.id) && i.id !== TREINAMENTO_ID && i.id !== INSTALACAO_ID && i.id !== INTEGRACAO_GOV_ID)
    .reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);

  const totalAnualGeral = (totalMensal * 12) + totalImplantacao + totalRealocacoes + totalTreinamento + totalInstalacao + totalIntegracao;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-xl font-bold text-camerite-main">Seleção de Itens</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar por descrição..." 
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-camerite-main"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-gray-900 text-gray-400 font-medium border-b border-gray-700">
              <tr>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3 w-24 text-center">Qtd.</th>
                <th className="px-4 py-3 w-40 text-right">Unitário</th>
                <th className="px-4 py-3 w-40 text-right">Mensal</th>
                <th className="px-4 py-3 w-48 text-right">Anual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredItems.map((item) => {
                const isSelected = item.quantity > 0;
                const isFixedItem = item.id === LICENCA_ID;
                const isEditablePrice = EDITABLE_PRICE_IDS.includes(item.id);
                const isMonthly = item.type === 'mensal';
                
                const valorAnualItem = isMonthly 
                  ? (item.quantity * item.unitPrice * 12)
                  : (item.quantity * item.unitPrice);

                return (
                  <tr key={item.id} className={`hover:bg-gray-750 transition-colors ${isSelected ? 'bg-camerite-main/5' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="text-white line-clamp-2" title={item.desc}>{item.desc}</p>
                      <div className="flex gap-1 mt-1">
                        <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${isMonthly ? 'bg-blue-900 text-blue-200' : 'bg-orange-900 text-orange-200'}`}>
                          {item.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number" 
                        min="0"
                        disabled={isFixedItem}
                        className={`w-16 bg-gray-900 border ${isSelected ? 'border-camerite-main text-camerite-main font-bold' : 'border-gray-600 text-gray-300'} rounded p-1 text-center focus:outline-none focus:border-camerite-main transition-all ${isFixedItem ? 'opacity-50 cursor-not-allowed' : ''}`}
                        value={item.quantity}
                        onChange={(e) => onUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditablePrice ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-camerite-main text-xs font-bold">R$</span>
                          <input 
                            type="number" 
                            min="0"
                            step="0.01"
                            className="w-32 bg-gray-900 border border-camerite-main/30 rounded px-2 py-1 text-right text-white focus:outline-none focus:border-camerite-main transition-all"
                            value={item.unitPrice}
                            onChange={(e) => onUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      ) : (
                        <span className={`font-medium ${isFixedItem ? 'text-white font-bold' : 'text-gray-300'}`}>
                          {formatCurrency(item.unitPrice)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 italic">
                      {isMonthly ? formatCurrency(item.quantity * item.unitPrice) : '------'}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                      {formatCurrency(valorAnualItem)}
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Nenhum item encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-6">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Mensal</p>
          <p className="text-lg font-bold text-white mt-1 break-all">{formatCurrency(totalMensal)}</p>
        </div>
        {totalInstalacao > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Instalação</p>
            <p className="text-lg font-bold text-white mt-1 break-all">{formatCurrency(totalInstalacao)}</p>
          </div>
        )}
        {totalImplantacao > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Implantação</p>
            <p className="text-lg font-bold text-white mt-1 break-all">{formatCurrency(totalImplantacao)}</p>
          </div>
        )}
        {totalTreinamento > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Treinamento</p>
            <p className="text-lg font-bold text-white mt-1 break-all">{formatCurrency(totalTreinamento)}</p>
          </div>
        )}
        {totalRealocacoes > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Realocações</p>
            <p className="text-lg font-bold text-white mt-1 break-all">{formatCurrency(totalRealocacoes)}</p>
          </div>
        )}
        {totalIntegracao > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Integração</p>
            <p className="text-lg font-bold text-white mt-1 break-all">{formatCurrency(totalIntegracao)}</p>
          </div>
        )}
        <div className="bg-gradient-to-r from-camerite-dark to-camerite-main p-4 rounded-lg shadow-lg">
          <p className="text-white/80 text-[10px] uppercase font-bold tracking-wider">Total Anual</p>
          <p className="text-lg font-bold text-white mt-1 break-all">{formatCurrency(totalAnualGeral)}</p>
        </div>
      </div>
    </div>
  );
};

export default ItemTable;
