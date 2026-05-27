import logoImg from '@/assets/ricambiental_logo-01-500-porcento-fbb5f.png'

export function printStrategicReport(
  selected: any,
  images: any[],
  printedName: string,
  reportTitle: string = 'RELATÓRIO DE ANÁLISE ESTRATÉGICA',
  imagesLayout: '1' | '2' = '2',
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('O bloqueador de pop-ups impediu a impressão. Permita pop-ups para este site.')
    return
  }

  const escapeHtml = (unsafe: string) => {
    return (unsafe || '')
      .toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  const renderPrintSectionHtml = (title: string, content: string, section: string) => {
    const sectionFiles = images.filter(
      (i) => i.section === section || (section === 'geral' && !i.section),
    )

    const sectionImages = sectionFiles.filter(
      (i) =>
        i.type === 'image' ||
        i.type?.startsWith('image/') ||
        (!i.type && i.url?.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i)) ||
        i.name?.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i),
    )

    const sectionDocs = sectionFiles.filter((i) => !sectionImages.includes(i))

    if (!content && sectionImages.length === 0 && sectionDocs.length === 0) return ''

    let imagesHtml = ''
    if (sectionImages.length > 0) {
      imagesHtml = `
        <div class="images">
          ${sectionImages
            .map(
              (img) => `
            <div class="img-box">
              <img src="${img.url}" onerror="this.onerror=null; this.src='https://img.usecurling.com/p/400/300?q=broken%20link&color=red'; this.style.opacity='0.5';" />
              ${img.caption ? `<p>${escapeHtml(img.caption)}</p>` : ''}
            </div>
          `,
            )
            .join('')}
        </div>
      `
    }

    let docsHtml = ''
    if (sectionDocs.length > 0) {
      docsHtml = `
        <div class="digital-docs">
          <h4>Documentos e Anexos Digitais:</h4>
          <ul>
            ${sectionDocs
              .map(
                (doc) =>
                  `<li><strong>${escapeHtml(doc.name || doc.filename || 'Documento')}:</strong> ${escapeHtml(
                    doc.caption || 'Sem descrição',
                  )}</li>`,
              )
              .join('')}
          </ul>
        </div>
      `
    }

    return `
      <div class="section">
        <h2>${escapeHtml(title)}</h2>
        ${content ? `<p>${escapeHtml(content)}</p>` : ''}
        ${imagesHtml}
        ${docsHtml}
      </div>
    `
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Relatório de Análise - ${escapeHtml(selected?.uc)}</title>
        <style>
          @page {
            size: portrait;
            margin: 15mm;
            @bottom-right {
              content: "Página " counter(page) " de " counter(pages);
              font-family: Arial, sans-serif;
              font-size: 10px;
              color: #555;
            }
          }
          body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5; margin: 0; color: #000; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
          .brand-col { display: flex; flex-direction: column; align-items: center; width: 240px; }
          .brand-logo-img { height: 45px; margin-bottom: 6px; object-fit: contain; }
          .brand-title { font-size: 12px; font-weight: 800; color: #0369a1; text-align: center; line-height: 1.2; letter-spacing: -0.3px; text-transform: uppercase; }
          .brand-version { display: none; }
          .title-col { flex: 1; text-align: center; padding: 0 10px; }
          h1 { margin: 0; font-size: 18px; text-transform: uppercase; color: #111; white-space: nowrap; }
          .info-box { border: 1px solid #000; padding: 16px; border-radius: 6px; margin-bottom: 25px; }
          .info-row { display: flex; gap: 15px; width: 100%; margin-bottom: 15px; }
          .info-row:last-child { margin-bottom: 0; }
          .info-col { flex: 1; }
          .info-col-2x { flex: 2; }
          .info-box span { font-weight: bold; text-transform: uppercase; font-size: 10px; color: #555; display: block; margin-bottom: 4px; }
          .info-box strong { font-size: 14px; color: #000; font-weight: 600; display: block; line-height: 1.5; }
          
          .section { margin-bottom: 25px; page-break-inside: avoid; border: 1px solid #eee; padding: 15px; border-radius: 8px; background: #fff; }
          .section h2 { font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #f0f0f0; margin-top: 0; margin-bottom: 15px; padding-bottom: 8px; color: #111; }
          .section p { white-space: pre-wrap; margin: 0 0 15px 0; text-align: justify; font-size: 13px; line-height: 1.6; background: #fdfdfd; padding: 10px; border-radius: 4px; border-left: 3px solid #ccc; }
          
          .images { display: grid; grid-template-columns: ${imagesLayout === '1' ? '1fr' : '1fr 1fr'}; gap: 15px; margin-top: 15px; }
          .img-box { border: 1px solid #ddd; padding: 8px; border-radius: 6px; text-align: center; page-break-inside: avoid; background: #fff; }
          .img-box img { max-width: 100%; max-height: ${imagesLayout === '1' ? '800px' : '300px'}; object-fit: contain; border-radius: 4px; }
          .img-box p { font-size: 12px; font-weight: 600; color: #222; margin-top: 8px; text-align: center; padding: 6px; background: #f8f9fa; border-radius: 4px; border: 1px solid #eee; }
          
          .digital-docs { margin-top: 15px; background: #f8f9fa; padding: 10px; border-radius: 6px; border: 1px solid #eee; }
          .digital-docs h4 { margin: 0 0 10px 0; font-size: 12px; color: #444; text-transform: uppercase; }
          .digital-docs ul { list-style-type: none; padding: 0; margin: 0; }
          .digital-docs li { padding: 6px 10px; border: 1px solid #e0e0e0; margin-bottom: 6px; border-radius: 4px; font-size: 12px; page-break-inside: avoid; background: #fff; }
          .digital-docs li:last-child { margin-bottom: 0; }
          
          .footer-content { margin-top: 60px; page-break-inside: avoid; }
          .date-location { text-align: left; margin-bottom: 60px; font-size: 14px; font-weight: bold; color: #000; }
          .signatures { display: flex; justify-content: space-between; text-align: center; gap: 40px; padding: 0 20px; }
          .signatures > div { flex: 1; border-top: 1px solid #000; padding-top: 8px; }
          .signatures strong { display: block; font-size: 12px; text-transform: uppercase; color: #000; }
          .signatures span { font-weight: normal; font-size: 11px; color: #555; margin-top: 2px; display: block; }
          
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand-col">
            <img src="${logoImg}" class="brand-logo-img" alt="RIC Ambiental" />
            <div class="brand-title">Gestão Ágil<br/>Multidisciplinar</div>
          </div>
          <div class="title-col">
            <h1>${escapeHtml(reportTitle)}</h1>
          </div>
          <div style="width: 240px;"></div>
        </div>
        
        <div class="info-box">
          <div class="info-row">
            <div class="info-col"><span>Unidade Consumidora</span><strong>${escapeHtml(selected?.uc || '')}</strong></div>
            <div class="info-col-2x"><span>Cliente</span><strong>${escapeHtml(selected?.snapshot_nome_cliente || '')}</strong></div>
            <div class="info-col"><span>Valor Vencido</span><strong>${formatCurrency(selected?.snapshot_valor_vencido || 0)}</strong></div>
            <div class="info-col"><span>Faturas Pendentes</span><strong>${selected?.snapshot_qt_fats || ''} referências</strong></div>
          </div>
          <div class="info-row">
            <div style="width: 100%;"><span>Referências</span><strong>${escapeHtml(selected?.snapshot_refs || '')}</strong></div>
          </div>
          <div class="info-row">
            <div style="width: 100%;"><span>Endereço</span><strong>${escapeHtml(selected?.endereco || '')}</strong></div>
          </div>
        </div>

        ${renderPrintSectionHtml('1. Parecer Geral da Análise', selected?.parecer, 'geral')}
        ${renderPrintSectionHtml('2. Análise do Imóvel', selected?.parecer_imovel, 'imovel')}
        ${renderPrintSectionHtml('3. Análise do Consumo / Hidrômetro', selected?.parecer_consumo, 'consumo')}
        ${renderPrintSectionHtml('4. Perfil de Pagador', selected?.parecer_perfil_pagador, 'perfil_pagador')}
        ${renderPrintSectionHtml('5. Análise "In-Loco" - Fiscalização / Engenharia', selected?.parecer_inloco, 'inloco')}
        ${renderPrintSectionHtml('6. Telefones Localizados', selected?.telefones_localizados, 'telefones')}

        <div class="footer-content">
          <div class="date-location">Marília - SP, ${(function () {
            const now = new Date()
            const day = now.getDate()
            const monthNames = [
              'Janeiro',
              'Fevereiro',
              'Março',
              'Abril',
              'Maio',
              'Junho',
              'Julho',
              'Agosto',
              'Setembro',
              'Outubro',
              'Novembro',
              'Dezembro',
            ]
            const month = monthNames[now.getMonth()]
            const year = now.getFullYear().toString()
            const formattedYear = year.length === 4 ? `${year[0]}.${year.substring(1)}` : year
            return `${day} de ${month} de ${formattedYear}.`
          })()}</div>
          <div class="signatures">
            <div>
              <strong>${escapeHtml(printedName)}</strong>
              <span>Operador</span>
            </div>
            <div>
              <strong>&nbsp;</strong>
              <span>Coordenador</span>
            </div>
            <div>
              <strong>&nbsp;</strong>
              <span>Superintendente</span>
            </div>
          </div>
        </div>
        
        <script>
          window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 300); }
        </script>
      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
}
