import { User, Device, SimCard, SystemSettings, DeviceModel, DeviceBrand, AssetType, ReturnChecklist } from '../types';

interface GenerateTermProps {
  user: User;
  asset: Device | SimCard;
  settings: SystemSettings;
  model?: DeviceModel;
  brand?: DeviceBrand;
  type?: AssetType;
  actionType: 'ENTREGA' | 'DEVOLUCAO';
  linkedSim?: SimCard;
  sectorName?: string;
  checklist?: ReturnChecklist;
  notes?: string;
}

export const generateAndPrintTerm = ({ 
  user, asset, settings, model, brand, type, actionType, linkedSim, sectorName, checklist, notes 
}: GenerateTermProps) => {
  
  // SELECIONA O TEMPLATE CORRETO
  let template = '';
  if (actionType === 'ENTREGA') {
      template = settings.termTemplate || '<p>Erro: Template de Entrega não configurado.</p>';
  } else {
      template = settings.returnTermTemplate || settings.termTemplate || '<p>Erro: Template de Devolução não configurado.</p>';
  }

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Identification Logic
  let assetName = '';
  let serial = '';
  let idCode = ''; // IMEI or ICCID
  let accessories = 'Carregador, Cabo de dados (Padrão)'; // Fallback

  if ('serialNumber' in asset) {
    // It's a Device
    assetName = `${type?.name || 'Equipamento'} ${brand?.name || ''} ${model?.name || ''}`.trim();
    serial = asset.serialNumber;
    idCode = asset.assetTag;
    
    if (asset.imei) {
        idCode += ` / IMEI: ${asset.imei}`;
    }

    // CORREÇÃO 1: Listar acessórios dinâmicos do dispositivo
    if (asset.accessories && asset.accessories.length > 0) {
        accessories = asset.accessories.map(a => a.name).join(', ');
    }

  } else {
    // It's a SIM
    assetName = `Chip SIM Card - ${asset.operator}`;
    serial = 'N/A';
    idCode = asset.iccid;
    accessories = 'Cartão do Chip (PIN/PUK)';
  }

  // Generate HTML for Linked Chip if present
  let linkedChipHtml = '';
  if (linkedSim) {
      linkedChipHtml = `
        <tr>
          <td style="padding: 6px; border: 1px solid #d1d5db; background-color: #f9fafb;" colspan="2">
            <strong style="font-size: 11px;">Item Vinculado: Chip / SIM Card</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #d1d5db;"><strong>Número:</strong> ${linkedSim.phoneNumber} (${linkedSim.operator})</td>
          <td style="padding: 6px; border: 1px solid #d1d5db;"><strong>ICCID:</strong> ${linkedSim.iccid}</td>
        </tr>
      `;
  }

  // --- CHECKLIST LOGIC FOR CHECKIN (CORREÇÃO 2: Tabela Dinâmica) ---
  let itemsTable = '';
  let additionalClauses = '';

  if (actionType === 'DEVOLUCAO' && checklist) {
      // Create Checklist Table Dynamically based on keys
      let tableRows = '';
      const missingItems: string[] = [];

      Object.entries(checklist).forEach(([itemName, isReturned]) => {
          if (!isReturned) {
              missingItems.push(itemName);
          }

          tableRows += `
            <tr>
                <td style="border: 1px solid #cbd5e1; padding: 6px;">${itemName}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold; color: ${isReturned ? 'green' : 'red'};">
                    ${isReturned ? 'SIM' : 'NÃO'}
                </td>
                <td style="border: 1px solid #cbd5e1; padding: 6px;">${isReturned ? 'Recebido' : 'PENDENTE'}</td>
            </tr>
          `;
      });

      itemsTable = `
        <h3 style="font-size: 12px; margin-bottom: 8px; color: #0f172a; text-transform: uppercase;">Checklist de Itens Devolvidos</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px;">
            <thead>
                <tr style="background-color: #f1f5f9;">
                    <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Item</th>
                    <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; width: 100px;">Devolvido?</th>
                    <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Observação</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
      `;

      if (missingItems.length > 0) {
          additionalClauses = `
            <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
                <strong style="color: #991b1b; font-size: 11px;">⚠️ ITENS PENDENTES DE DEVOLUÇÃO:</strong>
                <p style="font-size: 11px; color: #7f1d1d; margin: 5px 0 0 0;">
                    O colaborador declara estar ciente que os itens listados como NÃO devolvidos acima (<strong>${missingItems.join(', ')}</strong>) 
                    deverão ser entregues no prazo de 48 horas. O não cumprimento acarretará no desconto do valor correspondente em folha de pagamento 
                    ou verbas rescisórias, conforme Art. 462 da CLT.
                </p>
            </div>
          `;
      }
  }

  // Replace Placeholders
  const replacements: Record<string, string> = {
    '{LOGO_URL}': settings.logoUrl || '',
    '{NOME_COLABORADOR}': user.fullName,
    '{CPF}': user.cpf,
    '{RG}': user.rg || '-',
    '{NOME_SETOR}': sectorName || 'Não Informado',
    '{NOME_EMPRESA}': settings.appName || 'Minha Empresa', 
    '{CNPJ}': settings.cnpj || 'CNPJ não informado',
    '{MODELO_DISPOSITIVO}': assetName,
    '{TAG_PATRIMONIO}': 'assetTag' in asset ? asset.assetTag : 'N/A',
    '{NUMERO_SERIE}': serial,
    '{IMEI_ICCID}': idCode,
    '{ACESSORIOS}': accessories,
    '{CIDADE_DATA}': `São Paulo, ${today}`, 
    '{TIPO_TERMO}': actionType === 'ENTREGA' ? 'Entrega' : 'Devolução',
    '{CHIP_VINCULADO_HTML}': linkedChipHtml,
    '{OBSERVACOES}': notes || 'Nenhuma observação registrada.',
    '{ID_TERMO_AUTO}': Math.random().toString(36).substr(2, 6).toUpperCase()
  };

  Object.keys(replacements).forEach(key => {
    // Global replace
    const regex = new RegExp(key, 'g');
    template = template.replace(regex, replacements[key]);
  });

  // Handle Action Specifics (Inject Checklist if Return)
  if (actionType === 'DEVOLUCAO' && checklist) {
     if (template.includes('<!-- TABELA DE ITENS -->')) {
         template = template.replace('<!-- TABELA DE ITENS -->', itemsTable);
     } else if (template.includes('1. Detalhes do Equipamento')) {
         // Fallback if marker missing
         template = template.replace('1. Detalhes do Equipamento', itemsTable + '<br><strong>1. Detalhes do Equipamento (Referência)</strong>');
     }

     if (template.includes('<!-- CLAUSULAS COMPLETAS -->')) {
         template = template.replace('<!-- CLAUSULAS COMPLETAS -->', additionalClauses);
     }
  }

  // Create Print Window
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
      alert('Permita popups para imprimir o termo.');
      return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Termo de ${actionType === 'ENTREGA' ? 'Entrega' : 'Devolução'}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; padding: 20px; margin: 0; background-color: #fff; }
        @media print {
            body { padding: 0; margin: 0; -webkit-print-color-adjust: exact; }
            @page { margin: 10mm; size: A4 portrait; }
        }
      </style>
    </head>
    <body>
      ${template}
      <script>
        window.onload = function() { setTimeout(function(){ window.print(); }, 500); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};