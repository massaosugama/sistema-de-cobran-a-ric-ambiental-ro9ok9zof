export function generateEmailHtml(
  selected: any,
  images: any[],
  printedName: string,
  reportTitle: string = 'RELATÓRIO DE ANÁLISE ESTRATÉGICA',
) {
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
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
          ${sectionImages
            .map(
              (img) => `
            <div style="border: 1px solid #ddd; padding: 8px; border-radius: 6px; text-align: center; background: #fff;">
              <img src="${img.url}" style="max-width: 100%; max-height: 300px; object-fit: contain; border-radius: 4px;" alt="Anexo" />
              ${img.caption ? `<p style="font-size: 12px; font-weight: 600; color: #222; margin-top: 8px; padding: 6px; background: #f8f9fa; border-radius: 4px; border: 1px solid #eee;">${escapeHtml(img.caption)}</p>` : ''}
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
        <div style="margin-top: 15px; background: #f8f9fa; padding: 10px; border-radius: 6px; border: 1px solid #eee;">
          <h4 style="margin: 0 0 10px 0; font-size: 12px; color: #444; text-transform: uppercase;">Documentos e Anexos Digitais:</h4>
          <ul style="list-style-type: none; padding: 0; margin: 0;">
            ${sectionDocs
              .map(
                (doc) =>
                  `<li style="padding: 6px 10px; border: 1px solid #e0e0e0; margin-bottom: 6px; border-radius: 4px; font-size: 12px; background: #fff;"><strong>${escapeHtml(doc.name || doc.filename || 'Documento')}:</strong> ${escapeHtml(
                    doc.caption || 'Sem descrição',
                  )}</li>`,
              )
              .join('')}
          </ul>
        </div>
      `
    }

    return `
      <div style="margin-bottom: 25px; border: 1px solid #eee; padding: 15px; border-radius: 8px; background: #fff;">
        <h2 style="font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #f0f0f0; margin-top: 0; margin-bottom: 15px; padding-bottom: 8px; color: #111;">${escapeHtml(title)}</h2>
        ${content ? `<p style="white-space: pre-wrap; margin: 0 0 15px 0; text-align: justify; font-size: 13px; line-height: 1.6; background: #fdfdfd; padding: 10px; border-radius: 4px; border-left: 3px solid #ccc;">${escapeHtml(content)}</p>` : ''}
        ${imagesHtml}
        ${docsHtml}
      </div>
    `
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório de Análise - ${escapeHtml(selected?.uc)}</title>
      </head>
      <body style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5; margin: 0; padding: 20px; color: #000; background: #fafafa;">
        <div style="max-width: 800px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <div style="border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 18px; text-transform: uppercase; color: #111;">${escapeHtml(reportTitle)}</h1>
          </div>
          
          <div style="border: 1px solid #000; padding: 16px; border-radius: 6px; margin-bottom: 25px;">
            <table width="100%" cellpadding="5" cellspacing="0" style="margin-bottom: 15px;">
              <tr>
                <td width="25%" valign="top"><span style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #555; display: block; margin-bottom: 4px;">Unidade Consumidora</span><strong style="font-size: 14px; color: #000; font-weight: 600;">${escapeHtml(selected?.uc || '')}</strong></td>
                <td width="35%" valign="top"><span style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #555; display: block; margin-bottom: 4px;">Cliente</span><strong style="font-size: 14px; color: #000; font-weight: 600;">${escapeHtml(selected?.snapshot_nome_cliente || '')}</strong></td>
                <td width="20%" valign="top"><span style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #555; display: block; margin-bottom: 4px;">Valor Vencido</span><strong style="font-size: 14px; color: #000; font-weight: 600;">${formatCurrency(selected?.snapshot_valor_vencido || 0)}</strong></td>
                <td width="20%" valign="top"><span style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #555; display: block; margin-bottom: 4px;">Faturas Pendentes</span><strong style="font-size: 14px; color: #000; font-weight: 600;">${selected?.snapshot_qt_fats || ''} referências</strong></td>
              </tr>
            </table>
            <table width="100%" cellpadding="5" cellspacing="0" style="margin-bottom: 15px;">
              <tr>
                <td valign="top"><span style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #555; display: block; margin-bottom: 4px;">Referências</span><strong style="font-size: 14px; color: #000; font-weight: 600;">${escapeHtml(selected?.snapshot_refs || '')}</strong></td>
              </tr>
            </table>
            <table width="100%" cellpadding="5" cellspacing="0">
              <tr>
                <td valign="top"><span style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #555; display: block; margin-bottom: 4px;">Endereço</span><strong style="font-size: 14px; color: #000; font-weight: 600;">${escapeHtml(selected?.endereco || '')}</strong></td>
              </tr>
            </table>
          </div>

          ${renderPrintSectionHtml('1. Parecer Geral da Análise', selected?.parecer, 'geral')}
          ${renderPrintSectionHtml('2. Análise do Imóvel', selected?.parecer_imovel, 'imovel')}
          ${renderPrintSectionHtml('3. Análise do Consumo / Hidrômetro', selected?.parecer_consumo, 'consumo')}
          ${renderPrintSectionHtml('4. Perfil de Pagador', selected?.parecer_perfil_pagador, 'perfil_pagador')}
          ${renderPrintSectionHtml('5. Análise "In-Loco" - Fiscalização / Engenharia', selected?.parecer_inloco, 'inloco')}
          ${renderPrintSectionHtml('6. Telefones Localizados', selected?.telefones_localizados, 'telefones')}

          <div style="margin-top: 40px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            <p>Enviado por: <strong>${escapeHtml(printedName)}</strong></p>
            <p>Este é um e-mail gerado automaticamente pelo Sistema de Cobrança RIC Ambiental.</p>
          </div>
        </div>
      </body>
    </html>
  `
  return html
}
