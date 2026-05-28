import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const isImage = file.type.startsWith('image/')

  const prompt = `Você é um especialista em análise de extratos bancários brasileiros.

Analise este documento (extrato ou fatura bancária) e extraia as seguintes informações em JSON:

{
  "bank": "Nome exato do banco/instituição (ex: Nubank, Itaú, Bradesco, Sicoob, Sicredi, Inter, C6 Bank, etc.)",
  "accountType": "checking|savings|investment|credit",
  "accountHolder": "Nome do titular se visível",
  "period": "Período do extrato (ex: maio/2026)",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "Descrição da transação",
      "amount": 150.00,
      "type": "credit|debit",
      "category": "Alimentação|Transporte|Moradia|Saúde|Educação|Lazer|Assinatura|Transferência|Outros"
    }
  ],
  "openingBalance": 0.00,
  "closingBalance": 0.00
}

IMPORTANTE:
- type "credit" = entrada de dinheiro (depósito, transferência recebida, salário, etc.)
- type "debit" = saída de dinheiro (pagamento, compra, transferência enviada, etc.)
- amount SEMPRE positivo (o tipo já indica entrada/saída)
- Se não conseguir identificar algum campo, use null
- Retorne APENAS o JSON, sem texto adicional`

  try {
    // Build content block based on file type
    // PDFs → document block; images → image block
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileBlock: any = isImage
      ? {
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.type, // image/jpeg | image/png | image/webp
            data: base64,
          },
        }
      : {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64,
          },
        }

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [fileBlock, { type: 'text', text: prompt }],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const data = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[documents/analyze] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
