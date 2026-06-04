import { Suspense } from 'react'
import SignupForm from './form'

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
