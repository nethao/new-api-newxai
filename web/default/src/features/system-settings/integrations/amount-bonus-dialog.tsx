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
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as z from 'zod'

import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const createAmountBonusDialogSchema = (t: (key: string) => string) =>
  z.object({
    amount: z
      .number()
      .positive(t('充值金额必须大于 0'))
      .int(t('充值金额必须是整数')),
    bonusAmount: z
      .number()
      .positive(t('赠送额度必须大于 0'))
      .int(t('赠送额度必须是整数')),
  })

type AmountBonusDialogFormValues = z.infer<
  ReturnType<typeof createAmountBonusDialogSchema>
>

const AMOUNT_BONUS_FORM_ID = 'amount-bonus-form'

export type AmountBonusData = {
  amount: number
  bonusAmount: number
}

type AmountBonusDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: AmountBonusData) => void
  editData?: AmountBonusData | null
}

export function AmountBonusDialog({
  open,
  onOpenChange,
  onSave,
  editData,
}: AmountBonusDialogProps) {
  const { t } = useTranslation()
  const isEditMode = !!editData
  const schema = createAmountBonusDialogSchema(t)

  const form = useForm<AmountBonusDialogFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0,
      bonusAmount: 0,
    },
  })

  useEffect(() => {
    if (editData) {
      form.reset(editData)
    } else {
      form.reset({
        amount: 0,
        bonusAmount: 0,
      })
    }
  }, [editData, form, open])

  const handleSubmit = (values: AmountBonusDialogFormValues) => {
    onSave(values)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? t('编辑赠送规则') : t('添加赠送规则')}
      description={t('为指定充值金额配置额外赠送额度。')}
      contentClassName='sm:max-w-[500px]'
      contentHeight='auto'
      bodyClassName='space-y-4'
      footer={
        <>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button type='submit' form={AMOUNT_BONUS_FORM_ID}>
            {isEditMode ? t('更新') : t('添加')}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id={AMOUNT_BONUS_FORM_ID}
          onSubmit={form.handleSubmit(handleSubmit)}
          className='space-y-4'
        >
          <FormField
            control={form.control}
            name='amount'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('充值金额')}</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    step='1'
                    min='1'
                    placeholder={t('例如：100')}
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                    disabled={isEditMode}
                  />
                </FormControl>
                <FormDescription>
                  {isEditMode
                    ? t('编辑时不能修改充值金额。')
                    : t('用户实际支付的充值金额。')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='bonusAmount'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('赠送额度')}</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    step='1'
                    min='1'
                    placeholder={t('例如：50')}
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormDescription>
                  {t('例如：充值 100，赠送 50，最终到账 150 额度。')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Dialog>
  )
}
