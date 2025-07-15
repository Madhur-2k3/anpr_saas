import { Search } from 'lucide-react'
import React from 'react'
import {SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

const Header = () => {
  return (

      <header className="flex px-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">PlateRecon</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <button >About</button>
              <button >Pricing</button>
            </nav>
          </div>
          </div>

            <SignedOut>
              <SignInButton />
              {/* <SignUpButton>
                <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton> */}
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
      </header>
  )
}

export default Header