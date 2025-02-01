"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Circle } from "lucide-react";
import { Playfair_Display, Montserrat } from "next/font/google";
import axios from "axios";
import { environment } from "@/connections/socket";

const playfair = Playfair_Display({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });

interface GameProps {
  data: { player1: string; player2: string };
  socket: WebSocket | null;
  currentPlayer: { _id: string; name: string };
  setGameStart: (value: boolean) => void;
  setGameRequestPopup: (value: boolean) => void;
  handlingWhileMessage: (event: MessageEvent) => void;
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Game({
  data,
  socket,
  currentPlayer,
  setGameStart,
  setGameRequestPopup,
  handlingWhileMessage,
}: GameProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [board, setBoard] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [winner, setWinner] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [player1, setPlayer1] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [player2, setPlayer2] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentMovePlayer, setCurrentMovePlayer] = useState<any>(null); // current move player _id
  const [showWinner, setShowWinner] = useState<boolean>(false);
  const [countdown, setCountdown] = useState(2);

  const getPlayerData = async () => {
    const config = {
      url: `${environment.PROD_API}gameData?player1=${data.player1}&player2=${data.player2}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
    try {
      const res = await axios(config);
      setPlayer1(res?.data?.data?.player1);
      setPlayer2(res?.data?.data?.player2);
      setCurrentMovePlayer(res?.data?.data?.turn);
      setBoard(res?.data?.data?.board);
    } catch (error) {
      console.error("Error fetching player data:", error);
    }
  };

  const renderSquare = (index: number) => (
    <motion.button
      className="w-20 h-20 bg-gray-700 border border-yellow-400 flex items-center justify-center text-4xl font-bold rounded-md"
      onClick={() => {
        if (currentMovePlayer === currentPlayer._id && !board[index]) {
          handleClick(index);
        }
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {board[index] === "X" && <X className="text-blue-400" size={40} />}
      {board[index] === "O" && <Circle className="text-red-400" size={40} />}
    </motion.button>
  );

  const handleClick = (index: number) => {
    const newBoard = [...board];
    newBoard[index] = currentMovePlayer === player1._id ? "X" : "O";
    setBoard(newBoard);
    const dataToSend = {
      player1: player1._id,
      player2: player2._id,
      type: "move",
      board: newBoard,
      turn: currentMovePlayer === player1._id ? player2._id : player1._id,
    };
    socket?.send(JSON.stringify(dataToSend));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlingGameWhileMessage = async (event: any) => {
    const data = JSON.parse(event.data);
    if (data.type === "move") {
      setBoard(data.board);
      setCurrentMovePlayer(data.turn);
    }
    if (data.type === "gameEnd") {
      resetGame();
      setGameStart(false);
    }
    if (data.type === "endByRefresh") {
      resetGame();
      setGameStart(false);
    }
  };

  const endGame = () => {
    resetGame();
    setGameStart(false);
    const payloadForEndGame = {
      type: "endGame",
      from: currentPlayer._id,
      to: currentPlayer._id === player1._id ? player2._id : player1._id,
    };
    socket?.send(JSON.stringify(payloadForEndGame));
  };

  const resetGame = () => {
    setBoard([]);
    setWinner(null);
    setPlayer1(null);
    setPlayer2(null);
    setCurrentMovePlayer(null);
    setShowWinner(false);
    setGameRequestPopup(false);
    if (socket) {
      socket.onmessage = handlingWhileMessage;
    }
    
    // socket?.onmessage = handlingWhileMessage;
    setCountdown(2); // Reset countdown for the next game
  };

  useEffect(() => {
    console.log("socketgameArea", socket);
    if (socket) {
      socket.onmessage = handlingGameWhileMessage;
    }
    // socket?.onmessage = handlingGameWhileMessage;
  }, [socket]);

  useEffect(() => {
    getPlayerData();
  }, []);

  useEffect(() => {
    const winner = calculateWinner(board);
    if (winner === "X") {
      setWinner(player1);
      setShowWinner(true);
    } else if (winner === "O") {
      setWinner(player2);
      setShowWinner(true);
    }
  }, [board]);

  // useEffect(() => {
  //   if (winner && showWinner) {
  //     let timer = setInterval(() => {
  //       setCountdown((prev) => prev - 1);
  //     }, 1000);

  //     // When countdown reaches 0, reset the game and stop the timer
  //     const timeout = setTimeout(() => {
  //       setShowWinner(false); // Hide the winner modal
  //       setGameStart(false); // End the game
  //       resetGame(); // Reset the game state
  //       setCountdown(2); // Reset the countdown value
  //     }, 2000);

  //     // Clean up the interval and timeout
  //     return () => {
  //       clearInterval(timer);
  //       clearTimeout(timeout);
  //     };
  //   }
  // }, [winner, showWinner]);

  useEffect(() => {
    if (winner && showWinner) {
      const timer = setInterval(() => {  // ✅ Use 'const' instead of 'let'
        setCountdown((prev) => prev - 1);
      }, 1000);
  
      const timeout = setTimeout(() => {
        setShowWinner(false); // Hide the winner modal
        setGameStart(false); // End the game
        resetGame(); // Reset the game state
        setCountdown(2); // Reset the countdown value
      }, 2000);
  
      return () => {
        clearInterval(timer);
        clearTimeout(timeout);
      };
    }
  }, [winner, showWinner]);

  return (
    <div
      className={`${montserrat.className} w-full h-full bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white absolute top-0 left-0 flex flex-col items-center justify-center p-8 pt-8`}
    >
      <motion.h2
        className={`${
          playfair.className
        } text-3xl font-bold mb-8 text-yellow relative
        ${
          player1?._id === currentMovePlayer &&
          "animate-bounce border-[1px] border-yellow p-2 rounded-md pb-3 px-14"
        }
        `}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        {player1?._id === currentMovePlayer && (
          <div className="absolute -bottom-5 right-0 text-sm text-white font-sans">
            Your Turn
          </div>
        )}
        {currentPlayer._id === player1?._id && "You are"} {player1?.name}
      </motion.h2>

      <motion.div
        className="grid grid-cols-3 gap-2 mb-8"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
          return <div key={index}>{renderSquare(index)}</div>;
        })}
      </motion.div>

      <motion.h2
        className={`${
          playfair.className
        } text-3xl font-bold mb-8 text-yellow relative
        ${
          player2?._id === currentMovePlayer &&
          "animate-bounce border-[1px] border-yellow p-2 rounded-md pb-3 px-14 "
        }`}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        {player2?._id === currentMovePlayer && (
          <div className="absolute -bottom-5 right-0 text-sm text-white font-sans">
            Your Turn
          </div>
        )}
        {currentPlayer._id === player2?._id && "You are"} {player2?.name}
      </motion.h2>

      <motion.button
        className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition duration-300 ease-in-out"
        onClick={endGame}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        End Game
      </motion.button>

      {winner && showWinner && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-gray-800 text-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">
              🎉 Winner: {winner?.name} 🎉
            </h2>
            <p className="mb-6 text-gray-300">
              Congratulations to {winner?.name} for winning the game!
            </p>
            <p className="text-lg font-semibold text-yellow-400 mb-4">
              Restarting in {countdown} seconds...
            </p>
            {/* <button
              onClick={() => {
                setShowWinner(false);
                resetGame(); // Optional: Reset the game when closing the modal
              }}
              className=" w-full border-[0.5px] border-yellow-400 p-2 rounded-md transition-all duration-300 hover:scale-105"
            >
              Play Again
            </button> */}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default Game;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calculateWinner = (squares: any) => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
};
