
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import { ProposalItem, ColorSettings, ProposalSettings } from '../types';
import { numeroPorExtenso, valorPorExtenso, MESES } from '../constants';

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? rgb(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      )
    : rgb(0, 0, 0);
};

export const generateProposalPDF = async (
  originalPdfBytes: ArrayBuffer,
  items: ProposalItem[],
  colors: ColorSettings,
  proposalSettings: ProposalSettings
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const templateDoc = await PDFDocument.load(originalPdfBytes);
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const colorPurpleBrand = hexToRgb('#7B48EA'); 
  const colorGrayLight = hexToRgb('#E5E7EB');
  const colorGraySummary = hexToRgb('#D1D5DB'); 
  const colorWhite = rgb(1, 1, 1);
  const colorBlack = rgb(0, 0, 0);

  const margins = { top: 80, bottom: 60, left: 35, right: 35 }; 
  const lastPageIndex = pdfDoc.getPageCount() - 1;
  let currentPage = pdfDoc.getPage(lastPageIndex);
  const { width, height } = currentPage.getSize();
  const availableWidth = width - margins.left - margins.right;

  const addNewPage = async () => {
    const [cleanPage] = await pdfDoc.copyPages(templateDoc, [lastPageIndex]);
    pdfDoc.addPage(cleanPage);
    return pdfDoc.getPage(pdfDoc.getPageCount() - 1);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const splitText = (text: string, maxWidth: number, size: number, fontObj: PDFFont) => {
    if (!text) return [""];
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const widthText = fontObj.widthOfTextAtSize(currentLine + " " + word, size);
        if (widthText < maxWidth) { currentLine += " " + word; } 
        else { lines.push(currentLine); currentLine = word; }
    }
    lines.push(currentLine);
    return lines;
  };

  // Cálculos de Totais
  const activeItems = items.filter(i => i.quantity > 0);
  const REALOCACAO_IDS = [26, 27, 28];
  const TREINAMENTO_ID = 25;
  const INSTALACAO_ID = 29;
  const INTEGRACAO_GOV_ID = 41;
  const totalMensal = activeItems.filter(i => i.type === 'mensal').reduce((a, b) => a + (b.quantity * b.unitPrice), 0);
  const totalTreinamento = activeItems.filter(i => i.id === TREINAMENTO_ID).reduce((a, b) => a + (b.quantity * b.unitPrice), 0);
  const totalRealocacoes = activeItems.filter(i => REALOCACAO_IDS.includes(i.id)).reduce((a, b) => a + (b.quantity * b.unitPrice), 0);
  const totalInstalacao = activeItems.filter(i => i.id === INSTALACAO_ID).reduce((a, b) => a + (b.quantity * b.unitPrice), 0);
  const totalIntegracao = activeItems.filter(i => i.id === INTEGRACAO_GOV_ID).reduce((a, b) => a + (b.quantity * b.unitPrice), 0);
  const totalImplantacao = activeItems.filter(i => i.type === 'unico' && !REALOCACAO_IDS.includes(i.id) && i.id !== TREINAMENTO_ID && i.id !== INSTALACAO_ID && i.id !== INTEGRACAO_GOV_ID).reduce((a, b) => a + (b.quantity * b.unitPrice), 0);
  const totalGlobal = (totalMensal * 12) + totalImplantacao + totalRealocacoes + totalTreinamento + totalInstalacao + totalIntegracao;

  // --- LÓGICA DE LARGURA INTELIGENTE ---
  const fontSizeHeader = 8.5;
  const fontSizeBody = 7.5;
  const paddingCell = 8;

  const stdW = {
    qtd: 35,
    unit: 80,
    mensal: 80,
    anual: 95
  };

  let reqWQtd = fontBold.widthOfTextAtSize("Qtd.", fontSizeHeader);
  let reqWUnit = fontBold.widthOfTextAtSize("Unitário", fontSizeHeader);
  let reqWMensal = fontBold.widthOfTextAtSize("Mensal", fontSizeHeader);
  let reqWAnual = fontBold.widthOfTextAtSize("Anual", fontSizeHeader);

  activeItems.forEach(item => {
    const isMonthly = item.type === 'mensal';
    const wQ = font.widthOfTextAtSize(item.quantity.toString(), fontSizeBody);
    const wU = font.widthOfTextAtSize(formatCurrency(item.unitPrice), fontSizeBody);
    const wM = isMonthly ? font.widthOfTextAtSize(formatCurrency(item.quantity * item.unitPrice), fontSizeBody) : 0;
    const valAnual = isMonthly ? (item.quantity * item.unitPrice * 12) : (item.quantity * item.unitPrice);
    const wA = fontBold.widthOfTextAtSize(formatCurrency(valAnual), fontSizeBody);

    if (wQ > reqWQtd) reqWQtd = wQ;
    if (wU > reqWUnit) reqWUnit = wU;
    if (wM > reqWMensal) reqWMensal = wM;
    if (wA > reqWAnual) reqWAnual = wA;
  });

  const fWQtd = Math.max(stdW.qtd, reqWQtd + paddingCell);
  const fWUnit = Math.max(stdW.unit, reqWUnit + paddingCell);
  const fWMensal = Math.max(stdW.mensal, reqWMensal + paddingCell);
  const fWAnual = Math.max(stdW.anual, reqWAnual + paddingCell);

  const fWItem = availableWidth - (fWQtd + fWUnit + fWMensal + fWAnual);

  const colX = {
    item: margins.left,
    qtd: margins.left + fWItem,
    unit: margins.left + fWItem + fWQtd,
    mensal: margins.left + fWItem + fWQtd + fWUnit,
    anual: margins.left + fWItem + fWQtd + fWUnit + fWMensal
  };

  let currentY = height - margins.top - 40; // Adicionado 40 unidades de espaço extra do cabeçalho

  // --- INFORMAÇÕES DO DESTINATÁRIO ---
  const recipientLines: string[] = [];
  if (proposalSettings.recipientName) recipientLines.push(`À ${proposalSettings.recipientName}`);
  if (proposalSettings.cnpj) recipientLines.push(`CNPJ/MF: ${proposalSettings.cnpj}`);
  if (proposalSettings.address) recipientLines.push(`Endereço: ${proposalSettings.address}`);

  if (recipientLines.length > 0) {
    const heightNeeded = recipientLines.length * 16 + 30; // linhas + margem extra
    if (currentY - heightNeeded < margins.bottom + 50) {
      currentPage = await addNewPage();
      currentY = height - margins.top - 40;
    }

    recipientLines.forEach(line => {
      currentPage.drawText(line, {
        x: margins.left,
        y: currentY,
        size: 11,
        font: font,
        color: colorBlack
      });
      currentY -= 16;
    });
    currentY -= 10; // Espaço extra antes da tabela
  }

  const drawTableHeader = () => {
    currentPage.drawRectangle({
      x: margins.left,
      y: currentY - 20,
      width: availableWidth,
      height: 20,
      color: colorPurpleBrand,
    });
    
    const headers = [
      { t: "Item", x: colX.item + 5 },
      { t: "Qtd.", x: colX.qtd + 5 },
      { t: "Unitário", x: colX.unit + 5 },
      { t: "Mensal", x: colX.mensal + 5 },
      { t: "Anual", x: colX.anual + 5 }
    ];
    
    headers.forEach(h => {
      currentPage.drawText(h.t, { x: h.x, y: currentY - 14, size: fontSizeHeader, font: fontBold, color: colorWhite });
    });
    currentY -= 20;
  };

  drawTableHeader();

  for (const item of activeItems) {
    const isMonthly = item.type === 'mensal';
    const valorMensal = item.quantity * item.unitPrice;
    const valorAnualLinha = isMonthly ? (valorMensal * 12) : valorMensal;

    const descLines = splitText(item.desc, fWItem - 10, fontSizeBody, font); 
    const rowHeight = Math.max(22, descLines.length * 9 + 6);

    if (currentY - rowHeight < margins.bottom + 120) {
      currentPage = await addNewPage();
      currentY = height - margins.top - 40;
      drawTableHeader();
    }

    currentPage.drawLine({
      start: { x: margins.left, y: currentY - rowHeight },
      end: { x: width - margins.right, y: currentY - rowHeight },
      thickness: 0.5,
      color: colorGrayLight,
    });

    descLines.forEach((line, idx) => {
      currentPage.drawText(line, { x: colX.item + 5, y: currentY - 12 - (idx * 9), size: fontSizeBody, font: font, color: colorBlack });
    });

    currentPage.drawText(item.quantity.toString(), { x: colX.qtd + 5, y: currentY - 12, size: fontSizeBody, font: font, color: colorBlack });
    currentPage.drawText(formatCurrency(item.unitPrice), { x: colX.unit + 5, y: currentY - 12, size: fontSizeBody, font: font, color: colorBlack });
    currentPage.drawText(isMonthly ? formatCurrency(valorMensal) : "---", { x: colX.mensal + 5, y: currentY - 12, size: fontSizeBody, font: font, color: colorBlack });
    currentPage.drawText(formatCurrency(valorAnualLinha), { x: colX.anual + 5, y: currentY - 12, size: fontSizeBody, font: fontBold, color: colorBlack });

    currentY -= rowHeight;
  }

  // --- RESUMO FINAL ---
  const drawSummaryRow = (label: string, value: number) => {
    const rowHeight = 24;
    const valStr = formatCurrency(value);
    const valWidthNeeded = fontBold.widthOfTextAtSize(valStr, 9.5) + 20;
    const dynamicSplitPointX = width - margins.right - Math.max(160, valWidthNeeded); 
    
    currentPage.drawRectangle({
      x: margins.left,
      y: currentY - rowHeight,
      width: dynamicSplitPointX - margins.left,
      height: rowHeight,
      color: colorPurpleBrand,
    });

    currentPage.drawRectangle({
      x: dynamicSplitPointX,
      y: currentY - rowHeight,
      width: (width - margins.right) - dynamicSplitPointX,
      height: rowHeight,
      color: colorGraySummary,
    });

    const labelLines = splitText(label, dynamicSplitPointX - margins.left - 10, 8, fontBold);
    labelLines.forEach((line, i) => {
        const lWidth = fontBold.widthOfTextAtSize(line, 8);
        const lX = margins.left + ((dynamicSplitPointX - margins.left) / 2) - (lWidth / 2);
        const lY = currentY - (rowHeight / 2) + 3 - (i * 9) + (labelLines.length > 1 ? 4 : 0);
        currentPage.drawText(line, { x: lX, y: lY, size: 8, font: fontBold, color: colorWhite });
    });

    const vWidth = fontBold.widthOfTextAtSize(valStr, 9.5);
    currentPage.drawText(valStr, { x: (width - margins.right) - vWidth - 8, y: currentY - 15, size: 9.5, font: fontBold, color: colorBlack });

    currentPage.drawLine({
        start: { x: margins.left, y: currentY - rowHeight },
        end: { x: width - margins.right, y: currentY - rowHeight },
        thickness: 0.5,
        color: colorWhite
    });
    currentY -= rowHeight;
  };

  currentY -= 5;
  if (currentY - 60 < margins.bottom) {
    currentPage = await addNewPage();
    currentY = height - margins.top - 40;
  }

  drawSummaryRow("TOTAL MENSAL", totalMensal);
  drawSummaryRow("TOTAL PARA 12 (DOZE) MESES DE CONTRATO", totalGlobal);

  currentY -= 35;

  const investmentTitle = 'DO INVESTIMENTO';
  const investmentText1 = `O investimento mensal para a contratação de todos os produtos e serviços é de ${formatCurrency(totalMensal)} (${valorPorExtenso(totalMensal)}).`;
  const investmentTextInstalacao = totalInstalacao > 0 ? `O investimento referente à instalação e infraestrutura do projeto é de ${formatCurrency(totalInstalacao)} (${valorPorExtenso(totalInstalacao)}).` : null;
  const investmentTextImplantacao = totalImplantacao > 0 ? `O investimento referente à implantação do projeto é de ${formatCurrency(totalImplantacao)} (${valorPorExtenso(totalImplantacao)}).` : null;
  const investmentTextTreinamento = totalTreinamento > 0 ? `O investimento referente ao treinamento do projeto é de ${formatCurrency(totalTreinamento)} (${valorPorExtenso(totalTreinamento)}).` : null;
  const investmentTextRealocacoes = totalRealocacoes > 0 ? `O investimento referente as realocações do projeto são de ${formatCurrency(totalRealocacoes)} (${valorPorExtenso(totalRealocacoes)}).` : null;
  const investmentTextIntegracao = totalIntegracao > 0 ? `O investimento referente à integração do projeto com órgãos governamentais é de ${formatCurrency(totalIntegracao)} (${valorPorExtenso(totalIntegracao)}).` : null;
  const investmentTextTotal = `Assim, o investimento total anual da proposta é de ${formatCurrency(totalGlobal)} (${valorPorExtenso(totalGlobal)}).`;

  const wrapWidth = width - margins.left - margins.right;
  const lines1 = splitText(investmentText1, wrapWidth, 11, font);
  const linesInstalacao = investmentTextInstalacao ? splitText(investmentTextInstalacao, wrapWidth, 11, font) : [];
  const linesImplantacao = investmentTextImplantacao ? splitText(investmentTextImplantacao, wrapWidth, 11, font) : [];
  const linesTreinamento = investmentTextTreinamento ? splitText(investmentTextTreinamento, wrapWidth, 11, font) : [];
  const linesRealocacoes = investmentTextRealocacoes ? splitText(investmentTextRealocacoes, wrapWidth, 11, font) : [];
  const linesIntegracao = investmentTextIntegracao ? splitText(investmentTextIntegracao, wrapWidth, 11, font) : [];
  const linesTotal = splitText(investmentTextTotal, wrapWidth, 11, font);

  const investmentHeightReq = 40 + (
    lines1.length + 
    linesInstalacao.length + 
    linesImplantacao.length + 
    linesTreinamento.length + 
    linesRealocacoes.length + 
    linesIntegracao.length + 
    linesTotal.length
  ) * 14 + 40;

  if (currentY - investmentHeightReq < margins.bottom) {
    currentPage = await addNewPage();
    currentY = height - margins.top - 40;
  }

  currentPage.drawText(investmentTitle, { x: margins.left, y: currentY, size: 11, font: fontBold, color: hexToRgb('#7030A0') });
  currentY -= 20;

  const drawParagraph = (lines: string[]) => {
    if (lines.length === 0) return;
    lines.forEach(line => {
      currentPage.drawText(line, { x: margins.left, y: currentY, size: 11, font: font, color: colorBlack });
      currentY -= 14;
    });
    currentY -= 8;
  };

  drawParagraph(lines1);
  drawParagraph(linesInstalacao);
  drawParagraph(linesImplantacao);
  drawParagraph(linesTreinamento);
  drawParagraph(linesRealocacoes);
  drawParagraph(linesIntegracao);
  drawParagraph(linesTotal);
  
  currentY -= 20;

  const validityTitle = 'DA VALIDADE DA PROPOSTA';
  const validityText = `A presente proposta possui validade de ${proposalSettings.validityDays} (${numeroPorExtenso(proposalSettings.validityDays)}) dias corridos, contados a partir da data de seu envio.`;
  const validityLines = splitText(validityText, wrapWidth, 11, font);
  
  if (currentY - (validityLines.length * 14 + 40) < margins.bottom) {
    currentPage = await addNewPage();
    currentY = height - margins.top - 40;
  }

  currentPage.drawText(validityTitle, { x: margins.left, y: currentY, size: 11, font: fontBold, color: hexToRgb('#7030A0') });
  currentY -= 18;

  validityLines.forEach((line, i) => {
    currentPage.drawText(line, { x: margins.left, y: currentY - (i * 14), size: 11, font: font, color: colorBlack });
  });
  currentY -= (validityLines.length * 14 + 50);

  const dateObj = new Date(proposalSettings.proposalDate + 'T12:00:00');
  // Ajuste do formato da data: "Cidade, Dia de Mês de Ano"
  const dateStr = `${proposalSettings.city}, ${dateObj.getDate()} de ${MESES[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;
  const dateTextWidth = font.widthOfTextAtSize(dateStr, 11);

  if (currentY - 120 < margins.bottom) {
    currentPage = await addNewPage();
    currentY = height - margins.top - 40;
  }

  currentPage.drawText(dateStr, { x: width - margins.right - dateTextWidth, y: currentY, size: 11, font: font, color: colorBlack });
  currentY -= 70;

  const sign1 = "Camerite Sistemas S/A";
  const sign2 = "CNPJ/MF 05.818.541/0001-45";
  const sign1Width = fontBold.widthOfTextAtSize(sign1, 11);
  const sign2Width = font.widthOfTextAtSize(sign2, 11);

  currentPage.drawText(sign1, { x: (width / 2) - (sign1Width / 2), y: currentY, size: 11, font: fontBold, color: hexToRgb('#7030A0') });
  currentY -= 16;
  currentPage.drawText(sign2, { x: (width / 2) - (sign2Width / 2), y: currentY, size: 11, font: font, color: colorBlack });

  return await pdfDoc.save();
};
