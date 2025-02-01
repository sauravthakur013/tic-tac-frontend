"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Playfair_Display, Montserrat } from "next/font/google";
import { UserIcon } from "@heroicons/react/20/solid";
import GameArea from "@/components/GameArea";
import { useRouter } from "next/navigation";
import { environment } from "@/connections/socket";


const playfair = Playfair_Display({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });

interface Player {
  _id: string;
  name: string;
  isReady: boolean;
}

function GamePage() {
  // primary parameters
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [startGame, setStartGame] = useState<boolean>(false);
  const router = useRouter()

  // secondary parameters
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allPlayersList, setAllPlayersList] = useState<any>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);

  // handle game request from other player
  const [gameRequestPopup, setGameRequestPopup] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [requestPlayer, setRequestPlayer] = useState<any>(null);
  const [senderPopup, setSenderPopup] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [senderPlayer, setSenderPlayer] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(10);
  const [countdownGameRequest, setCountdownGameRequest] = useState<number>(10);

  // final stage of start game
  const [gameStart, setGameStart] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [gameplayers, setGameplayers] = useState<any>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlingWhileOpen = async () => {
    socket?.send(
      JSON.stringify({ type: "setName", name: name || "player456" })
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateAllPlayersListAndCurrentPlayer = async (data: any) => {
    const allPlayersList = data.payload;
    const currentPlayer = allPlayersList.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (player: any) => player.name === name
    );
    setAllPlayersList(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allPlayersList.filter((player: any) => player.name !== name)
    );
    setCurrentPlayer(currentPlayer);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gettingNewRequest = async (data: any) => {
    if (data?.fromPlayerId) {
      setGameRequestPopup(true);
      const player = await axios.get(
        `${environment.PROD_API}players?id=${data.fromPlayerId}`
      );
      setRequestPlayer(player.data.data);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlingWhileClose = async () => {
    console.log("connection closed");
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlingWhileMessage = async (event: any) => {
    const data = JSON.parse(event.data);
    if (data.type === "broadcastToAll") {
      updateAllPlayersListAndCurrentPlayer(data);
    }
    if (data.type === "gameRequest") {
      gettingNewRequest(data);
    }
    if (data.type === "gameDecline") {
      setGameRequestPopup(false);
      const payload = {
        type: "declinedGameRequest",
        fromPlayerId: currentPlayer._id,
        toPlayerId: requestPlayer.id,
      };
      socket?.send(JSON.stringify(payload));
    }
    if (data.type === "gameDeclineResponse") {
      setGameRequestPopup(false);
      setSenderPopup(false);
    }
    if (data.type === "gameAcceptResponse") {
      setGameRequestPopup(false);
      setSenderPopup(false);
      setRequestPlayer(null);
      // route to game start page
      // router.push(`/game/start?player1=${`${data?.toPlayerId}`}&player2=${`${data?.fromPlayerId}`}`);
      setGameplayers({
        player1: data?.toPlayerId,
        player2: data?.fromPlayerId,
      });
      setGameStart(true);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleWhileError = async (error: any) => {
    console.log(error);
  };

  const functionForConnection = async () => {
    const socket = await new WebSocket(environment.SOCKET_API_PROD);
    setSocket(socket);
  };

  const handleGameStart = () => {
    if (!name) return;
    setStartGame(true);
    functionForConnection();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeConnection = async (player: any) => {
    if (socket) {
      const payload = JSON.stringify({
        type: "gameRequest",
        fromPlayerId: currentPlayer._id,
        toPlayerId: player._id,
      });
      setSenderPopup(true);
      setSenderPlayer(player);
      await socket.send(payload);
    }
  };

  const declineFunction = async () => {
    if (socket) {
      const payload = JSON.stringify({
        type: "gameDecline",
        fromPlayerId: currentPlayer._id,
        toPlayerId: requestPlayer.id,
      });
      //   setRequestPlayer(null);
      setGameRequestPopup(false);
      await socket.send(payload);
    }
  };

  const acceptGameRequest = async () => {
    if (socket) {
      const payload = JSON.stringify({
        type: "gameAccept",
        fromPlayerId: currentPlayer._id,
        toPlayerId: requestPlayer.id,
      });
      setRequestPlayer(null);
      setGameRequestPopup(false);
      setRequestPlayer(null);
      await socket.send(payload);
    }
    setGameplayers({ player1: requestPlayer.id, player2: currentPlayer._id });
    setGameStart(true);
  };

  useEffect(() => {
    if (socket) {
      socket.onopen = handlingWhileOpen;
      socket.onclose = handlingWhileClose;
      socket.onmessage = handlingWhileMessage;
      socket.onerror = handleWhileError;
    }

    return () => {
      if (socket) {
        console.log("Closing WebSocket connection...");
        socket.close();
      }
    };
  }, [socket]);

  useEffect(() => {
    if (senderPopup) {
      setCountdown(5); // Reset countdown when popup is shown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setSenderPopup(false); // Close the popup
            setRequestPlayer(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer); // Cleanup on unmount
    }
  }, [senderPopup]);

  useEffect(() => {
    if (gameRequestPopup) {
      setCountdownGameRequest(5); // Reset countdown for game request
      const timer = setInterval(() => {
        setCountdownGameRequest((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameRequestPopup(false); // Close the popup
            setRequestPlayer(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer); // Cleanup on unmount
    }
  }, [gameRequestPopup]);

  //   console.log(currentPlayer, "current player");
  //   console.log(requestPlayer, "request player");
  // console.log(gameStart, "gameplayers");

  return (
    <div
      className={`${montserrat.className} min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex flex-col items-center justify-center p-8`}
    >
      <motion.h1
        className={`${playfair.className} text-4xl font-bold mb-8 text-[#FFD700]`}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        Welcome, {currentPlayer?.name || name || "Player"}
      </motion.h1>

      <motion.div
        className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-xl border border-yellow-400"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2
          className={`${playfair.className} text-2xl font-semibold mb-4 text-yellow-300`}
        >
          Available Players
        </h2>
        {allPlayersList.length > 0 ? (
          <ul className="space-y-2">
            
            {allPlayersList.map((player: Player, idx: number) => (
              <motion.li
                key={idx}
                className="bg-gray-700 p-3 rounded-md flex items-center justify-between cursor-pointer hover:bg-gray-600 transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => makeConnection(player)}
              >
                <span className="flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-yellow-400 text-yellow" />
                  {player.name}
                </span>
                {/* <XMarkIcon className="w-5 h-5 text-red-400 hover:text-red-500" onClick={(e) => {
                  e.stopPropagation()
                  removePlayer(player._id)
                }} /> */}
              </motion.li>
            ))}
          </ul>
        ) : (
          <motion.div
            className="flex flex-col items-center justify-center h-32"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <div className="w-16 h-16 border-t-4 border-yellow-400 border-solid rounded-full animate-spin"></div>
            <p className="mt-4 text-yellow-300">Searching for players...</p>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {!startGame && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-800 p-8 rounded-lg shadow-2xl border-2 border-yellow-400 w-full max-w-md"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h2
                className={`${playfair.className} text-2xl font-bold mb-4 text-yellow-300`}
              >
                Enter Your Name
              </h2>
              <input
                className="w-full bg-gray-700 text-white border border-gray-600 p-3 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                type="text"
                placeholder="Your name"
                onChange={(e) => setName(e.target.value)}
              />
              <button
                onClick={handleGameStart}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 font-bold py-3 px-6 rounded-md shadow-lg hover:from-yellow-500 hover:to-yellow-700 transition duration-300 ease-in-out transform hover:scale-105 text-yellow"
              >
                Start Game
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameRequestPopup && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-800 p-8 rounded-lg shadow-2xl border-2 border-yellow-400 w-full max-w-md"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h2
                className={`${playfair.className} text-2xl font-bold mb-4 text-yellow-300`}
              >
                Game Request
              </h2>
              <p className="text-yellow-300 mb-4">
                {requestPlayer?.name} wants to play with you. Accept the game?
              </p>
              <p className="text-yellow-400 mb-4">
                Closing in {countdownGameRequest} seconds...
              </p>
              <button
                onClick={acceptGameRequest}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md mr-4"
              >
                Accept
              </button>
              <button
                onClick={() => {
                  declineFunction();
                }}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md"
              >
                Decline
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {senderPopup && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-800 p-8 rounded-lg shadow-2xl border-2 border-yellow-400 w-full max-w-md"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h2
                className={`${playfair.className} text-2xl font-bold mb-4 text-yellow-300`}
              >
                Game Request
              </h2>
              <p className="text-yellow-300 mb-4">
                You send game request to {senderPlayer?.name}.
              </p>
              <p className="text-yellow-400">
                Closing in {countdown} seconds...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameStart && (
          <GameArea
            data={gameplayers}
            socket={socket && socket}
            handlingWhileMessage={handlingWhileMessage}
            currentPlayer={currentPlayer}
            setGameStart={setGameStart}
            setGameRequestPopup={setGameRequestPopup}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <motion.div
          onClick={()=>{
            socket?.close()
            router.push("/")
          }}
          className="bg-gray-800 rounded-lg shadow-2xl border-2 border-yellow-400 w-full max-w-md mt-10 text-center py-3 cursor-pointer text-yellow"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          Exit Room
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default GamePage;
