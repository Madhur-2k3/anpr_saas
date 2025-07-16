"use client";

import { Search, Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import Link from 'next/link';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/#about", label: "About" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/add-vehicle", label: "Add Vehicle" },
  ];

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-950 dark:border-gray-800">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo and Brand Name */}
        <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
            <Search className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">PlateRecon</h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center space-x-4 md:flex">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-lg px-4 py-2 text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(true)}>
            <Menu className="h-6 w-6 text-gray-800 dark:text-gray-200" />
          </button>
        </div>
      </div>

      {/* ============== MOBILE MENU (SLIDE-IN PANEL) ============== */}
      
      {/* Backdrop Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Side Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-4/5 max-w-sm flex-col shadow-xl transition-transform duration-300 ease-in-out
                   bg-white dark:bg-gray-950
                   ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-end p-4 border-b dark:border-gray-800">
          <button onClick={() => setIsMenuOpen(false)}>
            <X className="h-6 w-6 text-gray-800 dark:text-gray-200" />
          </button>
        </div>
        
        <nav className="flex flex-col space-y-1 p-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={handleLinkClick}
              className="rounded-md px-3 py-3 text-lg font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        
        <div className="mt-auto border-t p-4 dark:border-gray-800">
          <div className="flex flex-col space-y-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  onClick={handleLinkClick}
                  className="w-full rounded-lg px-4 py-2.5 text-center font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  onClick={handleLinkClick}
                  className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700"
                >
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center space-x-4">
                <UserButton afterSignOutUrl="/" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Profile</span>
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;