import { User, Device, SimCard, SystemSettings, DeviceModel, DeviceBrand, AssetType } from '../types';

interface GenerateTermProps {
  user: User;
  asset: Device | SimCard;
  settings: SystemSettings;
  model?: DeviceModel;
  brand?: DeviceBrand;
  type?: AssetType;
  actionType: 'ENTREGA' | 'DEVOLUCAO';
  linkedSim?: SimCard;
  sectorName?: string; // Novo campo
}

export const generateAndPrintTerm = ({ 
  user, asset, settings, model, brand, type, actionType, linkedSim, sectorName 
}: GenerateTermProps) => {
  
  let template = settings.termTemplate || '<p>Erro: Template não configurado.</p>';
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Identification Logic
  let assetName = '';
  let serial = '';
  let idCode = ''; // IMEI or ICCID
  let accessories = '';

  if ('serialNumber' in asset) {
    // It's a Device
    assetName = `${type?.name || 'Equipamento'} ${brand?.name || ''} ${model?.name || ''}`.trim();
    serial = asset.serialNumber;
    idCode = asset.assetTag; // Using Tag as generic ID if needed
    accessories = 'Carregador, Cabo de dados'; // Default generic
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
    '{ID_TERMO_AUTO}': Math.random().toString(36).substr(2, 6).toUpperCase()
  };

  Object.keys(replacements).forEach(key => {
    // Global replace
    const regex = new RegExp(key, 'g');
    template = template.replace(regex, replacements[key]);
  });

  // Handle Action Specifics
  if (actionType === 'DEVOLUCAO') {
      template = template.replace(/Termo de Responsabilidade/g, 'Comprovante de Devolução');
      template = template.replace('recebi da empresa', 'devolvi à empresa');
      template = template.replace('Itens que estou recebendo', 'Itens que estou devolvendo');
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