'use client'

import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input'

export function PlaceholdersAndVanishInputDemo() {
  const placeholders = [
    'AI in Healthcare',
    'Climate Change and Biodiversity',
    'Quantum Computing Overview',
    'Neural Networks in NLP',
    'Sustainable Urban Energy',
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value)
  }
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('submitted')
  }
  return (
    <div className="h-[40rem] flex flex-col justify-center items-center px-4">
      {/* <h2 className="mb-10 sm:mb-12 text-xl font-VT323 text-center sm:text-5xl text-white">
        Start your Research Journey
      </h2> */}
      <PlaceholdersAndVanishInput
        placeholders={placeholders}
        onChange={handleChange}
        onSubmit={onSubmit}
      />
    </div>
  )
}
