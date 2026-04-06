import { fetchApi } from '../api/client'
import type { Transaction, TransactionType } from './types'

export async function fetchBalance(): Promise<number> {
  try {
    const data = await fetchApi('/finance/balance')
    return data.balance || 0
  } catch (err) {
    console.error('Bakiye çekilemedi:', err)
    return 0
  }
}

export async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const data = await fetchApi('/finance/history')
    return data.transactions || []
  } catch (err) {
    console.error('İşlem geçmişi çekilemedi:', err)
    return []
  }
}

type CreateTxInput = {
  type: TransactionType
  amount: number
  method: string
}

export async function createApiTransaction(input: CreateTxInput): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    const data = await fetchApi('/finance/transaction', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return { success: true, newBalance: data.balance }
  } catch (err: any) {
    return { success: false, error: err.message || 'İşlem başarısız' }
  }
}
