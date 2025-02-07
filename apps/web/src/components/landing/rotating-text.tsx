'use client'

import { LayoutGroup, motion } from 'motion/react'
import TextRotate from '../fancy/text-rotate'

export default function RotatingText() {
  return (
    <div className="w-full h-full text-2xl sm:text-3xl md:text-5xl flex flex-row items-center justify-center  bg-transparent font-light overflow-hidden p-8">
      <LayoutGroup>
        <motion.div className="flex whitespace-pre" layout>
          <motion.span
            className="pt-0.5 sm:pt-1 md:pt-2 text-black"
            layout
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            Write it{' '}
          </motion.span>
          <TextRotate
            texts={['better', 'faster', 'smarter']}
            mainClassName="text-white px-2 sm:px-2 md:px-5 bg-blue-600 overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
            staggerFrom={'last'}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-120%' }}
            // staggerDuration={0.025}
            splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            rotationInterval={2000}
          />
        </motion.div>
      </LayoutGroup>
    </div>
  )
}
