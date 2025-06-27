import Link from 'next/link'

export default function Unauthorized() {
  return (
    <div className="mb-8 mt-20 w-[200%] max-w-full px-4 text-center">
      <p>You have to log in to see this page</p>
      <Link className="ml-2 block underline" href={`/login`}>
        Login
      </Link>
    </div>
  )
}
