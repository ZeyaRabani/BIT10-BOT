"use client"

import React from 'react'
import Navbar from '@/components/Navbar'
import HomeIng from '@/assets/home-page.png'
import Image from 'next/image'

export default function page() {
  return (
    <div>
      <Navbar />
      <div>
        <Image src={HomeIng} alt='img' />
      </div>
    </div>
  )
}
