"use client";
import React from "react";
import { useRouter } from "next/navigation";
import landingLogo from "@/assets/landingPagelogo.png";
import Image from "next/image";
import { Playfair_Display, Montserrat } from 'next/font/google'
import { motion } from "framer-motion"

const playfair = Playfair_Display({ subsets: ['latin'] })
const montserrat = Montserrat({ subsets: ['latin'] })

export default function Home() {
  const router = useRouter()

  return (
    <div className={`${montserrat.className} min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex flex-col items-center justify-center`}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full max-w-4xl p-8 space-y-12"
      >
        <header className="text-center">
          <motion.h1 
            className={`${playfair.className} text-6xl font-bold text-[#FDE979]`}
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            Tic Tac Toe
          </motion.h1>
          <motion.p 
            className="mt-4 text-2xl text-yellow-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            A Classic Game of Strategy
          </motion.p>
        </header>

        <motion.div 
          className="flex justify-center"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div className="p-6 border-8 border-yellow-400 rounded-lg shadow-2xl shadow-yellow-400/20 bg-gray-800">
            <Image
              src={landingLogo.src}
              alt="Tic Tac Toe Logo"
              width={300}
              height={300}
              className="rounded-lg"
            />
          </div>
        </motion.div>

        <motion.div 
          className="flex justify-center"
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <button
            onClick={() => router.push("/game?connection=true")}
            className="group bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-4 px-8 rounded-full text-xl shadow-lg hover:from-yellow-500 hover:to-yellow-700 transform hover:scale-105 transition duration-300 ease-in-out border-2 border-yellow-300 flex items-center space-x-2"
          >
            <span className=" text-[#FDE979]">Start A Game</span>
            {/* <ChevronDoubleRightIcon className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" /> */}
          </button>
        </motion.div>

        <motion.footer 
          className="text-center text-yellow-200 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p>&copy; 2025 Premium Tic Tac Toe. All rights reserved.</p>
        </motion.footer>
      </motion.div>
    </div>
  )
}


