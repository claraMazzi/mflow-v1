'use client'

import cn from 'clsx'
import { signOut } from 'next-auth/react'
import { ReactElement, useState } from 'react'
import { Button } from '@components/ui/common/button'

export default function LogoutButton({
  label,
  className = '',
  variant = 'primary',
}: {
  label: string | ReactElement
  className?: string
  variant?: "primary" | "outline" | "secondary" | "tertiary" | "ghost" | "optionList"
}) {
  const [loading, setLoading] = useState(false)

  const onClick = async () => {
    setLoading(true)

    await signOut({  callbackUrl: '/login' })

    setLoading(false)
  }

  return (
    <>
      <Button
        className={cn(
          'text-inherit h-auto p-0 text-base font-normal capitalize transition-none hover:text-primary-default',
          className
        )}
        isLoading={loading}
        onClick={onClick}
        variant={variant}
      >
        {label}
      </Button>
    </>
  )
}
