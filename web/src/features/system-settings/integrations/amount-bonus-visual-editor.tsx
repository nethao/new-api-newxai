/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Gift, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StaticDataTable } from '@/components/data-table/static/static-data-table'
import { StaticRowActions } from '@/components/data-table/static/static-row-actions'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'

import { safeJsonParseWithValidation } from '../utils/json-parser'
import { isObjectRecord } from '../utils/json-validators'
import { AmountBonusDialog, type AmountBonusData } from './amount-bonus-dialog'

type AmountBonusVisualEditorProps = {
  value: string
  onChange: (value: string) => void
}

export function AmountBonusVisualEditor({
  value,
  onChange,
}: AmountBonusVisualEditorProps) {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState<AmountBonusData | null>(null)

  const bonuses = useMemo(() => {
    const parsed = safeJsonParseWithValidation<Record<string, unknown>>(value, {
      fallback: {},
      validator: isObjectRecord,
      validatorMessage: '充值赠送额度必须是 JSON 对象',
      context: '充值赠送额度',
    })

    return Object.entries(parsed)
      .map(([amount, bonus]) => ({
        amount: Number.parseInt(amount, 10),
        bonusAmount:
          typeof bonus === 'number' ? bonus : Number.parseInt(String(bonus), 10),
      }))
      .filter((item) => !isNaN(item.amount) && !isNaN(item.bonusAmount))
      .sort((a, b) => a.amount - b.amount)
  }, [value])

  const handleSave = (data: AmountBonusData) => {
    const bonusObject = safeJsonParseWithValidation<Record<string, unknown>>(
      value,
      {
        fallback: {},
        validator: isObjectRecord,
        silent: true,
      }
    )

    if (editData && editData.amount !== data.amount) {
      delete bonusObject[editData.amount.toString()]
    }

    bonusObject[data.amount.toString()] = data.bonusAmount
    onChange(JSON.stringify(bonusObject, null, 2))
  }

  const handleDelete = (amount: number) => {
    const bonusObject = safeJsonParseWithValidation<Record<string, unknown>>(
      value,
      {
        fallback: {},
        validator: isObjectRecord,
        silent: true,
      }
    )

    delete bonusObject[amount.toString()]
    onChange(JSON.stringify(bonusObject, null, 2))
  }

  const handleEdit = (bonus: AmountBonusData) => {
    setEditData(bonus)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditData(null)
    setDialogOpen(true)
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-muted-foreground text-sm'>
          {t('按充值金额配置额外赠送额度')}
        </p>
        <Button
          type='button'
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleAdd()
          }}
          size='sm'
          className='w-full sm:w-auto'
        >
          <Plus className='h-4 w-4 sm:mr-2' />
          <span className='sm:inline'>{t('添加赠送规则')}</span>
        </Button>
      </div>

      {bonuses.length === 0 ? (
        <div className='text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm'>
          {t('还没有配置赠送规则，点击“添加赠送规则”开始配置。')}
        </div>
      ) : (
        <div className='rounded-md border'>
          <StaticDataTable
            className='hidden rounded-none border-0 sm:block'
            data={bonuses}
            getRowKey={(bonus) => bonus.amount}
            columns={[
              {
                id: 'amount',
                header: t('充值金额'),
                cell: (bonus) => (
                  <span className='font-mono text-sm'>￥{bonus.amount}</span>
                ),
              },
              {
                id: 'bonus',
                header: t('赠送额度'),
                cell: (bonus) => (
                  <StatusBadge
                    variant='info'
                    className='font-mono'
                    copyable={false}
                  >
                    +{bonus.bonusAmount}
                  </StatusBadge>
                ),
              },
              {
                id: 'total',
                header: t('最终到账'),
                cell: (bonus) => (
                  <span className='font-mono text-sm'>
                    {bonus.amount + bonus.bonusAmount}
                  </span>
                ),
              },
              {
                id: 'actions',
                header: t('操作'),
                className: 'text-right',
                cellClassName: 'text-right',
                cell: (bonus) => (
                  <StaticRowActions
                    editLabel={t('编辑')}
                    deleteLabel={t('删除')}
                    menuLabel={t('打开菜单')}
                    onEdit={() => handleEdit(bonus)}
                    onDelete={() => handleDelete(bonus.amount)}
                  />
                ),
              },
            ]}
          />

          <div className='divide-y sm:hidden'>
            {bonuses.map((bonus) => (
              <div key={bonus.amount} className='p-4'>
                <div className='mb-3 flex items-start justify-between gap-3'>
                  <div className='flex min-w-0 flex-1 items-start gap-2'>
                    <Gift className='mt-0.5 h-4 w-4 text-emerald-600' />
                    <div>
                      <div className='font-mono text-base font-medium'>
                        ￥{bonus.amount}
                      </div>
                      <div className='text-muted-foreground mt-1 text-sm'>
                        {t('赠送额度')}: +{bonus.bonusAmount}
                      </div>
                    </div>
                  </div>
                  <div className='flex gap-1'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleEdit(bonus)
                      }}
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDelete(bonus.amount)
                      }}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AmountBonusDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        editData={editData}
      />
    </div>
  )
}
