'use client'

import cn from 'clsx'
import { getSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ReactElement, startTransition, useState } from 'react'
import { Button } from '@components/ui/common/button'

export default function LogoutButton({
  label,
  className = '',
}: {
  label: string | ReactElement
  className?: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onClick = async () => {
    const session = await getSession()
    setLoading(true)

    await signOut({ redirect: false })


    startTransition(() => {
      router.push('/login')
    })

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
      >
        {label}
      </Button>
    </>
  )
}
