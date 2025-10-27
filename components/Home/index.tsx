'use client'

import { useEffect, useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ethers } from 'ethers'
import { 
  faHome, faChartBar, faTrophy, faRocket, 
  faCrown, faCoins, faBolt, faFire, faUsers,
  faArrowRight, faChartLine, faGamepad, faPlay,
  faBullseye, faInfoCircle, faRefresh, faBullseye as faTarget,
  faCarrot, faBuilding, faExclamationTriangle, faBalanceScale, faMedal,
  faGift
} from '@fortawesome/free-solid-svg-icons'
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { incrementGamesPlayed } from '@/lib/game-counter';




import UserStats from '../UserStats'
import Leaderboard from '../Leaderboard'
import { useConnect, useAccount, useContractWrite, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
// import VerticalJumperGame from './VerticalJumperGame' 

// Dynamically import BaseBlock game to prevent SSR issues
  const BaseBlock = dynamic(() => import('./TowerBlocks'), {
    ssr: false,
    loading: () => (
      <div className="relative px-12 w-screen flex items-center justify-center h-screen overflow-hidden" style={{ background: '#F5F7FA' }}>
        
        {/* Main loading content */}
        <div className="relative text-center space-y-6">
          {/* Loading icon */}
          <div className="w-24 h-24 mx-auto relative">
            <div className="absolute inset-0 rounded-full shadow-lg animate-pulse" style={{ background: '#0052FF' }}></div>
            <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ background: '#ffffff' }}>
              <FontAwesomeIcon icon={faGamepad} className="text-4xl animate-bounce text-[#0052FF]" />
            </div>
            <div className="absolute -inset-1 rounded-full opacity-30 blur-sm" style={{ background: '#0052FF' }}></div>
          </div>
          
          {/* Loading text */}
          <div className="space-y-3">
            <h2 className="text-3xl font-bold drop-shadow-lg" style={{ fontFamily: 'var(--font-fredoka-one)', color: '#0052FF' }}>
              <img src="/images/base.png" alt="Base" className="w-10 h-10" /> Connecting to Base...
            </h2>
            <p className="text-lg" style={{ fontFamily: 'var(--font-nunito)', color: '#6B7280' }}>Preparing your onchain adventure...</p>
          </div>
          
          {/* Loading dots */}
          <div className="flex items-center justify-center space-x-3">
            <div className="w-3 h-3 bg-[#0052FF] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-[#0052FF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-[#0052FF] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    )
  })

export function Demo() {
  const [showGame, setShowGame] = useState(false)
  const [showStoneShooter, setShowStoneShooter] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const { actions, context } = useMiniAppContext();
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'leaderboard'>('home')
  const [showRewardPopup, setShowRewardPopup] = useState(false)
  const [tokenTxCount, setTokenTxCount] = useState<number | null>(null)
  const [isLoadingTxCount, setIsLoadingTxCount] = useState(false)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [gameKey, setGameKey] = useState(0) // Key to force remount of game component

  // Check if user has seen welcome popup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome) {
        // Show popup after a short delay for better UX
        setTimeout(() => {
          setShowWelcomePopup(true);
        }, 1000);
      }
    }
  }, []);

  // Close welcome popup and mark as seen
  const closeWelcomePopup = () => {
    setShowWelcomePopup(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  };
  
  const { connect, connectors } = useConnect()
  const { isConnected, address } = useAccount()
  const client = usePublicClient()
  
  // Blockchain contract write for starting Base jump game
  const { writeContract: writeStartGame, data: startGameTx, isSuccess: startGameSuccess, isError: startGameContractError, error: startGameErrorObj, reset: resetStartGame } = useContractWrite();
  const { isLoading: isStartGameLoading, isSuccess: isStartGameSuccess } = useWaitForTransactionReceipt({ hash: startGameTx });
  
  // Base jump game start state
  const [isStartingStoneShooter, setIsStartingStoneShooter] = useState(false);
  const [stoneShooterError, setStoneShooterError] = useState<string | null>(null);
  const [stoneShooterSuccess, setStoneShooterSuccess] = useState(false);
  const [hasActiveTransaction, setHasActiveTransaction] = useState(false);

  // Function to fetch parsnips collected (transaction count from contract)
  const fetchParsnipsCollected = async () => {
    if (!client) return;
    
    setIsLoadingTxCount(true);
    try {
      const txCount = await client.getTransactionCount({
        address: "0x696dCAb161e5818FAC129860BB68d1644169Ec63",
      });
      console.log("Parsnips collected (Tx count):", txCount);
      setTokenTxCount(Number(txCount));
    } catch (error) {
      console.error("Error fetching parsnips collected:", error);
      setTokenTxCount(0);
    } finally {
      setIsLoadingTxCount(false);
    }
  };

  // Fetch parsnips collected on component mount
  useEffect(() => {
    fetchParsnipsCollected();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  // Digital grid elements for modern blockchain aesthetic
  const gridElements = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => {
      const shapes = ['line-h', 'line-v', 'dot-grid', 'cube'];
      const colors = ['#3b82f6', '#60a5fa', '#FFFFFF', '#1d4ed8'];
      return {
        shape: shapes[i % shapes.length],
        color: colors[i % colors.length],
        size: Math.random() * 100 + 50,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        rotation: Math.random() * 45,
        duration: Math.random() * 25 + 20,
        delay: Math.random() * 8,
        opacity: Math.random() * 0.15 + 0.05,
      };
    }),
    []
  );
  
  const dataStreamParticles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      size: Math.random() * 2 + 1,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: Math.random() * 10 + 8,
      delay: Math.random() * 5,
      length: Math.random() * 50 + 20,
      color: ['#3b82f6', '#60a5fa', '#FFFFFF', '#1d4ed8'][i % 4],
    })),
    []
  );

  // Star data for animated background
  const starData = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => {
      const size = Math.random() * 8 + 4;
      const starColor = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ffff88' : '#88ccff';
      return {
        size,
        color: starColor,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 5}s`,
        opacity: Math.random() * 0.8 + 0.2,
        textShadow: `0 0 ${size/2}px ${starColor}`,
      };
    }),
    []
  );

  // Shooting star data for animated background
  const shootingStarData = useMemo(() =>
    Array.from({ length: 3 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 50}%`,
      animation: `shoot ${Math.random() * 15 + 10}s linear infinite`,
      animationDelay: `${Math.random() * 10}s`,
    })),
    []
  );

  // Check if user has seen the reward popup before
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenRewardPopup = localStorage.getItem('hasSeenRewardnewPopup')
      if (!hasSeenRewardPopup) {
        // Show popup after a short delay for better UX
        const timer = setTimeout(() => {
          setShowRewardPopup(true)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const handleCloseRewardPopup = () => {
    setShowRewardPopup(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenRewardnewPopup', 'true')
    }
  }

  // Handle Base jump game start with blockchain transaction
  const handleStartStoneShooter1 = async() => {
    setShowStoneShooter(true);
  }

  const handleStartStoneShooter = async () => {
    if (!address) {
      console.warn('No wallet address available for Base jump');
      setStoneShooterError('Please connect your wallet first');
      return;
    }

    if (isStartingStoneShooter) {
      console.log('🔄 Base Block transaction already in progress');
      return;
    }

    setIsStartingStoneShooter(true);
    setStoneShooterError(null);
    setStoneShooterSuccess(false);
    setHasActiveTransaction(true);

    try {
      // Reset any previous transaction state
      resetStartGame();
      
      // Call the startGame function on the blockchain
      const { CONTRACT_ADDRESSES, MINI_GAME_ABI } = await import('@/lib/contracts');
      const { getPlayerData } = await import('@/lib/leaderboard');
      
      const playerData = getPlayerData(context);
      
      if (!playerData.fid) {
        setStoneShooterError('Unable to get Farcaster ID. Please try again.');
        setIsStartingStoneShooter(false);
        setHasActiveTransaction(false);
        return;
      }
      
      writeStartGame({
        address: CONTRACT_ADDRESSES.MINI_GAME as `0x${string}`,
        abi: MINI_GAME_ABI,
        functionName: 'startGame',
        args: [BigInt(playerData.fid)]
      });
      // Don't set showStoneShooter here - let the transaction success handler do it
      console.log('✅ Base Block blockchain transaction initiated with FID:', playerData.fid);
      
      // The transaction is now pending, the useEffect will handle success/failure
      
    } catch (error: any) {
      console.error('Error starting Base jump game:', error);
      setStoneShooterError(error.message || 'Failed to start Base jump game');
      setIsStartingStoneShooter(false);
      setHasActiveTransaction(false);
    }
  };

  useEffect(()=>{
    if(isConnected){
      actions?.addFrame()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[isConnected])

  // Fetch token transaction count from blockchain
  const fetchTokenTransactionCount = async () => {
    try {
      setIsLoadingTxCount(true)
      const { CONTRACT_ADDRESSES } = await import('@/lib/contracts')
      
      // Use Base network RPC endpoint
      const provider = new ethers.JsonRpcProvider("https://mainnet.base.org")
      
      // Get transaction count for the baseblock contract
      const txCount = await provider.getTransactionCount(CONTRACT_ADDRESSES.BASE_JUMP)
      
      // Add a multiplier to represent "parsnips collected" - each tx represents multiple items
      const parsnipsCollected = txCount * 25 // Each transaction represents approximately 25 parsnips
      
      setTokenTxCount(parsnipsCollected)
      setIsLoadingTxCount(false)
    } catch (error) {
      console.error("Error fetching token transaction count:", error)
      setIsLoadingTxCount(false)
    }
  }
  
  // Fetch transaction count on component mount
  useEffect(() => {
    fetchTokenTransactionCount()
    
    // Refresh transaction count every 60 seconds
    const intervalId = setInterval(fetchTokenTransactionCount, 60000)
    
    return () => clearInterval(intervalId)
  }, [])

  // Handle successful Base jump blockchain transaction
  useEffect(() => {
    if (isStartGameSuccess && isStartingStoneShooter && startGameTx) {
      console.log('✅ Base Block blockchain transaction confirmed');
      
      // Immediately start the game
      console.log('🚀 Launching Base Block game...');
      incrementGamesPlayed();
      
      // First, hide the loader
      setIsStartingStoneShooter(false);
      setStoneShooterSuccess(false);
      setHasActiveTransaction(false);
      
      // Then show the game (this should be done after hiding the loader)
      setTimeout(() => {
        setShowStoneShooter(true);
        console.log('✅ Base Block game state set to true');
      }, 100); // Small delay to ensure state updates properly
    }
  }, [isStartGameSuccess, isStartingStoneShooter, startGameTx]);

  // Handle Base Block blockchain transaction error
  useEffect(() => {
    if (startGameContractError && isStartingStoneShooter) {
      console.error('❌ Base Block blockchain transaction failed:', startGameErrorObj);
      setStoneShooterError(startGameErrorObj?.message || 'Blockchain transaction failed');
      setIsStartingStoneShooter(false);
      setStoneShooterSuccess(false);
      setHasActiveTransaction(false);
    }
  }, [startGameContractError, startGameErrorObj, isStartingStoneShooter]);

  // Reset wagmi state when returning from Base Block game
  useEffect(() => {
    // Only reset when we're on home page (not showing any game) and have a successful transaction
    // and we're not currently in an active transaction
    if (!showStoneShooter && !showGame && !showStats && !showLeaderboard && 
        (startGameSuccess || isStartGameSuccess) && !hasActiveTransaction) {
      console.log('🔄 Resetting Base jump transaction state');
      resetStartGame();
    }
  }, [showStoneShooter, showGame, showStats, showLeaderboard, startGameSuccess, isStartGameSuccess, hasActiveTransaction, resetStartGame]);
  
  // Additional cleanup effect when game is hidden
  useEffect(() => {
    // When hiding the game, ensure all game scripts are cleaned up
    if (!showStoneShooter) {
      // Clean up any remaining game scripts after a delay
      const cleanupGameScripts = () => {
        const scripts = document.querySelectorAll('script');
        let cleanedCount = 0;
        scripts.forEach(script => {
          if (
            (script.id && script.id.includes('base-block-game-script')) || 
            (!script.src && script.textContent && (
              script.textContent.includes('class Game {') || 
              script.textContent.includes('class TowerBlock') ||
              script.textContent.includes('class Stage')
            ))
          ) {
            try {
              if (script.parentNode) {
                script.parentNode.removeChild(script);
                cleanedCount++;
              }
            } catch (e) {
              console.warn('Could not remove script:', e);
            }
          }
        });
        if (cleanedCount > 0) {
          console.log(`🧹 Cleaned up ${cleanedCount} stale game script(s)`);
        }
      };
      
      // Delay cleanup to ensure component unmount completes
      const cleanupTimer = setTimeout(cleanupGameScripts, 300);
      return () => clearTimeout(cleanupTimer);
    }
  }, [showStoneShooter]);

  // Debug: Monitor showStoneShooter state
  useEffect(() => {
    console.log('🔍 showStoneShooter state changed:', showStoneShooter);
  }, [showStoneShooter]);

  // Sync activeTab with current view
  useEffect(() => {
    if (showStats) {
      setActiveTab('stats')
    } else if (showLeaderboard) {
      setActiveTab('leaderboard')
    } else {
      setActiveTab('home')
    }
  }, [showStats, showLeaderboard])



  if (showStoneShooter) {
    return (
      <div className="min-h-screen overflow-hidden">
        <BaseBlock 
          key={gameKey} 
          onBackToMenu={() => {
            console.log('🏠 Going back to home from Base Block');
            
            // First, ensure all Three.js and game resources are cleaned up
            // Clean up global game functions
            try {
              delete (window as any).handleGameOver;
              delete (window as any).updateScore;
              delete (window as any).playAgainGame;
              delete (window as any).emergencyRestartGame;
              delete (window as any).TOWER_BLOCKS_GAME_OVER;
              delete (window as any).TOWER_BLOCKS_SCORE;
              console.log('🧹 Cleaned up global game functions');
            } catch (e) {
              console.warn('Error cleaning up globals:', e);
            }
            
            // Reset transaction states first
            setIsStartingStoneShooter(false);
            setStoneShooterError(null);
            setStoneShooterSuccess(false);
            setHasActiveTransaction(false);
            
            // Then hide the game and reset navigation
            setShowStoneShooter(false);
            setShowGame(false);
            setShowStats(false);
            setShowLeaderboard(false);
            setActiveTab('home');
            
            // Increment gameKey immediately (not in setTimeout)
            // This forces a complete remount on next game start
            setGameKey(prev => prev + 1);
            
            console.log('✅ All states reset, ready for next game');
          }}
        />
      </div>
    )
  }

  if (showStats) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ background: '#F5F7FA' }}>
        {/* Animated Stars Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Stars */}
          {starData.map((star, i) => (
            <div
              key={i}
              className="star absolute"
              style={{
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                color: star.color,
                fontSize: `${star.size}px`,
                lineHeight: '1',
                animation: star.animation,
                animationDelay: star.animationDelay,
                opacity: star.opacity,
                textShadow: star.textShadow,
                pointerEvents: 'none'
              }}
            >
              ★
            </div>
          ))}
          
          {/* Shooting Stars */}
          {shootingStarData.map((shoot, i) => (
            <div
              key={`shooting-${i}`}
              className="shooting-star absolute"
              style={{
                left: shoot.left,
                top: shoot.top,
                width: '12px',
                height: '12px',
                color: '#ffffff',
                fontSize: '12px',
                lineHeight: '1',
                animation: shoot.animation,
                animationDelay: shoot.animationDelay,
                opacity: 0.9,
                textShadow: '0 0 8px #ffffff',
                pointerEvents: 'none'
              }}
            >
              ★
            </div>
          ))}
        </div>
        
        <div className="px-4 pb-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <UserStats />
          </motion.div>
        </div>
        <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} onShowGame={setShowGame} onShowStats={setShowStats} onShowLeaderboard={setShowLeaderboard} />
        
        <style jsx>{`
          @keyframes twinkle {
            0%, 100% { 
              opacity: 0.2;
              transform: scale(1);
            }
            50% { 
              opacity: 1;
              transform: scale(1.2);
            }
          }
          @keyframes shoot {
            0% {
              transform: translateX(0) translateY(0);
              opacity: 1;
            }
            70% {
              opacity: 1;
            }
            100% {
              transform: translateX(-100vw) translateY(100vh);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    )
  }

  if (showLeaderboard) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ background: '#F5F7FA' }}>
        {/* Animated Stars Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Stars */}
          {starData.map((star, i) => (
            <div
              key={i}
              className="star absolute"
              style={{
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                color: star.color,
                fontSize: `${star.size}px`,
                lineHeight: '1',
                animation: star.animation,
                animationDelay: star.animationDelay,
                opacity: star.opacity,
                textShadow: star.textShadow,
                pointerEvents: 'none'
              }}
            >
              ★
            </div>
          ))}
          
          {/* Shooting Stars */}
          {shootingStarData.map((shoot, i) => (
            <div
              key={`shooting-${i}`}
              className="shooting-star absolute"
              style={{
                left: shoot.left,
                top: shoot.top,
                width: '12px',
                height: '12px',
                color: '#ffffff',
                fontSize: '12px',
                lineHeight: '1',
                animation: shoot.animation,
                animationDelay: shoot.animationDelay,
                opacity: 0.9,
                textShadow: '0 0 8px #ffffff',
                pointerEvents: 'none'
              }}
            >
              ★
            </div>
          ))}
        </div>
        
        <div className=" pb-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Leaderboard />
          </motion.div>
        </div>
        <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} onShowGame={setShowGame} onShowStats={setShowStats} onShowLeaderboard={setShowLeaderboard} />
        
        <style jsx>{`
          @keyframes twinkle {
            0%, 100% { 
              opacity: 0.2;
              transform: scale(1);
            }
            50% { 
              opacity: 1;
              transform: scale(1.2);
            }
          }
          @keyframes shoot {
            0% {
              transform: translateX(0) translateY(0);
              opacity: 1;
            }
            70% {
              opacity: 1;
            }
            100% {
              transform: translateX(-100vw) translateY(100vh);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-hidden relative" style={{ 
      background: '#F5F7FA'
    }}>
      {/* Blockchain Transaction Loader Overlay */}
      {isStartingStoneShooter && (
        <div className="fixed inset-0 backdrop-blur-xl z-50 flex items-center justify-center" style={{ background: 'rgba(245, 247, 250, 0.98)' }}>
          <motion.div 
            className="relative border-2 rounded-3xl p-12 max-w-md mx-4 text-center shadow-2xl overflow-hidden"
            style={{
              background: 'white',
              border: '2px solid #0052FF',
              boxShadow: '0 20px 60px rgba(0, 82, 255, 0.2)'
            }}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {/* Main loading icon */}
            <motion.div 
              className="w-24 h-24 mx-auto mb-8 relative"
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 rounded-full shadow-lg" style={{ background: '#0052FF' }}></div>
              <div className="absolute inset-2 bg-white backdrop-blur-sm rounded-full flex items-center justify-center">
                <motion.div 
                  className="text-4xl"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                 <img src="/images/base.png" alt="Base" className="w-10 h-10" />
                </motion.div>
              </div>
              <div className="absolute -inset-1 rounded-full opacity-30 blur-sm" style={{ background: '#0052FF' }}></div>
            </motion.div>

            <h3 className="text-3xl font-bold mb-4 drop-shadow-lg flex items-center justify-center gap-3" style={{ fontFamily: 'var(--font-fredoka-one)', color: '#0052FF' }}>
              <FontAwesomeIcon icon={faGamepad} /> Launching Base Block
            </h3>
            <p className="mb-8 text-lg font-medium" style={{ color: '#6B7280' }}>
              <img src="/images/base.png" alt="Base" className="w-10 h-10" /> Connecting to Base...
            </p>

            {/* Enhanced loading indicators */}
            <div className="flex items-center justify-center space-x-4 text-sm" style={{ color: '#6B7280' }}>
              <motion.div 
                className="w-3 h-3 rounded-full shadow-lg" 
                style={{ background: '#0052FF' }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} 
                transition={{ duration: 1.2, repeat: Infinity }}
              ></motion.div>
              <span className="font-semibold">Processing onchain...</span>
              <motion.div 
                className="w-3 h-3 rounded-full shadow-lg" 
                style={{ background: '#0052FF' }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} 
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
              ></motion.div>
            </div>

            {/* Progress bar */}
            <div className="mt-6 w-full rounded-full h-2 overflow-hidden" style={{ background: 'rgba(0, 82, 255, 0.1)' }}>
              <motion.div 
                className="h-full rounded-full"
                style={{ background: '#0052FF' }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Subtle particle background */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        
        {/* Stars */}
        {starData.map((star, i) => (
          <div
            key={i}
            className="star absolute"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              color: star.color,
              fontSize: `${star.size}px`,
              lineHeight: '1',
              animation: star.animation,
              animationDelay: star.animationDelay,
              opacity: star.opacity,
              textShadow: star.textShadow,
              pointerEvents: 'none'
            }}
          >
            ★
          </div>
        ))}
        
        {/* Shooting Stars */}
        {shootingStarData.map((shoot, i) => (
          <div
            key={`shooting-${i}`}
            className="shooting-star absolute"
            style={{
              left: shoot.left,
              top: shoot.top,
              width: '12px',
              height: '12px',
              color: '#ffffff',
              fontSize: '12px',
              lineHeight: '1',
              animation: shoot.animation,
              animationDelay: shoot.animationDelay,
              opacity: 0.9,
              textShadow: '0 0 8px #ffffff',
              pointerEvents: 'none'
            }}
          >
            ★
          </div>
        ))}
        
        {/* Sparkle particles - Base Blue themed */}
        {[...Array(40)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              backgroundColor: i % 3 === 0 ? '#0052FF' : i % 3 === 1 ? '#60a5fa' : '#ffffff',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.7 + 0.3,
              boxShadow: `0 0 ${Math.random() * 8 + 4}px ${i % 3 === 0 ? '#0052FF' : i % 3 === 1 ? '#60a5fa' : '#ffffff'}`,
              pointerEvents: 'none'
            }}
          />
        ))}
      </div>

      {/* Hero Section - Centered Layout */}
      <div className="relative z-10">
        <div className="px-6 pt-20 pb-12">
          <motion.div 
            className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, type: "spring" }}
          >
            {/* Game Icon - Centered with Glow */}
            <motion.div
              className="relative mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
              whileHover={{ scale: 1.1 }}
            >
              <div className="w-32 h-32 relative">
                {/* Animated glow rings */}
                <div className="absolute inset-0 rounded-3xl blur-2xl opacity-60 animate-pulse" style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)' }}></div>
                <div className="absolute -inset-2 rounded-3xl opacity-40" style={{ 
                  background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                  animation: 'spin 10s linear infinite'
                }}></div>
                <img 
                  src="/images/icon.jpg" 
                  alt="Base Block" 
                  className="relative w-32 h-32 rounded-3xl shadow-2xl border-4 border-white/30 object-cover z-10"
                />
              </div>
            </motion.div>
            
            {/* Title with Gradient */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <h1 className="text-6xl lg:text-8xl font-bold mb-4 leading-none" style={{ 
                fontFamily: 'var(--font-fredoka-one)',
                color: '#0052FF',
                textShadow: '0 4px 20px rgba(0, 82, 255, 0.3)'
              }}>
                Base Block
              </h1>
              
              {/* Decorative line */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-16 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #0052FF, transparent)' }}></div>
                <div className="w-2 h-2 rounded-full" style={{ background: '#0052FF' }}></div>
                <div className="w-16 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #0052FF, transparent)' }}></div>
              </div>
            </motion.div>
            
            {/* Description */}
            <motion.p 
              className="text-lg font-light max-w-lg leading-relaxed mb-8"
              style={{ fontFamily: 'var(--font-nunito)', color: '#6B7280' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              Stack blocks with perfect precision to build the tallest tower! Test your timing, compete on leaderboards, and win exciting rewards.
            </motion.p>
          </motion.div>

          {/* Action Buttons - Centered */}
          <div className="flex flex-col items-center justify-center">
          {isConnected && (
            <motion.div 
              className="mb-8 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.8, type: "spring" }}
            >
                {/* Game Button */}
                <motion.button
                  onClick={handleStartStoneShooter}
                  disabled={isStartingStoneShooter}
                  className={`relative group overflow-hidden text-white font-bold py-6 px-8 rounded-2xl shadow-xl w-full ${isStartingStoneShooter ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{
                    background: '#0052FF',
                    boxShadow: '0 10px 30px rgba(0, 82, 255, 0.4)'
                  }}
                  whileHover={isStartingStoneShooter ? {} : { 
                    scale: 1.05,
                    y: -3,
                    boxShadow: "0 20px 40px rgba(0, 82, 255, 0.5)",
                    backgroundColor: "#0041CC"
                  }}
                  whileTap={isStartingStoneShooter ? {} : { scale: 0.97 }}
                >
                  {/* Glowing overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50" />
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
                    {isStartingStoneShooter ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-white"></div>
                        <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-fredoka-one)' }}>LOADING...</span>
                        <span className="text-sm opacity-90" style={{ fontFamily: 'var(--font-nunito)' }}>GAME STARTING</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faGamepad} className="text-4xl mb-1" />
                        <span className="font-bold text-3xl" style={{ fontFamily: 'var(--font-fredoka-one)', textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)' }}>PLAY NOW</span>
                        <span className="text-sm opacity-90" style={{ fontFamily: 'var(--font-nunito)' }}>START STACKING!</span>
                      </>
                    )}
                  </div>
                  
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  {/* Pulse animation on hover */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                    boxShadow: '0 0 30px rgba(139, 195, 74, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                  }} />
                </motion.button>
            </motion.div>
          )}

          {/* Protocol Error Display */}
          {stoneShooterError && (
            <motion.div 
              className="mb-8 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="border border-red-500 bg-transparent px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-1 h-8 bg-red-500 mr-3"></div>
                    <div>
                      <div className="text-red-500 text-xs font-medium uppercase tracking-wider mb-1">ERROR</div>
                      <span className="text-sm font-light text-white">Something Went Wrong</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setStoneShooterError(null)}
                    className="text-red-500 hover:text-red-400 ml-4 h-8 w-8 flex items-center justify-center border border-red-500"
                  >
                    ×
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {!isConnected && (
            <motion.div 
              className="mb-8 w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <motion.button
                type="button"
                onClick={() => connect({ connector: connectors[0] })}
                className="w-full text-white font-medium py-5 px-8 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden group"
                style={{ background: '#0052FF', boxShadow: '0 4px 16px rgba(0, 82, 255, 0.3)' }}
                whileHover={{ 
                  scale: 1.02,
                  y: -1,
                  backgroundColor: "#0041CC",
                  boxShadow: "0 6px 20px rgba(0, 82, 255, 0.4)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <FontAwesomeIcon icon={faBolt} className="text-white text-xs" />
                </div>
                  <span className="font-medium tracking-wider text-white">CONNECT WALLET</span>
                </div>
                <div className="flex items-center">
                  <div className="h-[1px] w-10 bg-white/50 mr-3"></div>
                  <FontAwesomeIcon icon={faArrowRight} className="text-sm text-white" />
                </div>
                
                {/* Platform shine effect */}
                <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </motion.button>
            </motion.div>
          )}
          </div>
          {/* </motion.div> */}
        </div>

          {/* Stats Dashboard */}
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto px-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <StatsCard 
              icon={faUsers} 
              title="Active Stackers" 
              value="300" 
              trend="+23%" 
              color="from-[#0052FF] to-[#0041CC]"
            />
            <StatsCard 
              icon={faCoins} 
              title="Rewards Pool" 
              value="3200 DEGEN" 
              trend="LIVE" 
              color="from-[#0052FF] to-[#0041CC]"
            />
            <StatsCard 
              icon={faFire} 
              title="Games Today" 
              value="454" 
              trend="+12%" 
              color="from-[#0052FF] to-[#0041CC]"
            />
            <motion.div
              className="relative overflow-hidden p-6 rounded-2xl shadow-lg border"
              style={{
                background: 'white',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 16px rgba(0, 82, 255, 0.1)'
              }}
              whileHover={{ 
                scale: 1.05,
                y: -3,
                boxShadow: "0 8px 24px rgba(0, 82, 255, 0.2)"
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: '#0052FF' }}>
                  <FontAwesomeIcon icon={faGamepad} className="text-white text-sm" />
                </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-[1px] w-8 mr-2" style={{ background: 'rgba(0, 82, 255, 0.3)' }}></div>
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ fontFamily: 'var(--font-nunito)', color: '#0052FF' }}>Live</span>
                    <motion.button
                      onClick={fetchParsnipsCollected}
                      disabled={isLoadingTxCount}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                      style={{ background: 'rgba(0, 82, 255, 0.1)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 82, 255, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 82, 255, 0.1)'}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FontAwesomeIcon 
                        icon={faRefresh} 
                        className={`text-xs ${isLoadingTxCount ? 'animate-spin' : ''}`}
                        style={{ color: '#0052FF' }}
                      />
                    </motion.button>
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-fredoka-one)', color: '#0052FF' }}>
                  {isLoadingTxCount ? "Loading..." : tokenTxCount ? tokenTxCount.toLocaleString() : "0"}
                </div>
                <div className="text-xs uppercase tracking-wider mt-2 font-medium" style={{ fontFamily: 'var(--font-nunito)', color: '#6B7280' }}>Total Blocks Stacked</div>
              </div>
            </motion.div>
            </motion.div>
          </div>
      

          {/* More Info Button */}
          <motion.div 
            className="flex justify-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            <motion.button
              onClick={() => setShowRewardPopup(true)}
              className="w-full text-white font-medium py-5 px-8 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden group"
              style={{ background: '#0052FF', boxShadow: '0 4px 16px rgba(0, 82, 255, 0.3)' }}
              whileHover={{ 
                scale: 1.02,
                y: -1,
                backgroundColor: "#0041CC",
                boxShadow: "0 6px 20px rgba(0, 82, 255, 0.4)"
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-white text-xs" />
                </div>
                <span className="font-medium tracking-wider text-white">MORE INFO</span>
              </div>
              <div className="flex items-center">
                <div className="h-[1px] w-10 bg-white/50 mr-3"></div>
                <FontAwesomeIcon icon={faArrowRight} className="text-sm text-white" />
              </div>
              
              {/* Platform shine effect */}
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </motion.button>
          </motion.div>

      {/* Features Grid */}
      <div className="relative z-10 px-4 pb-32">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* <motion.div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"> */}
          <FeatureCard
            icon={faGamepad}
            title="Precision Stacking"
            description="Time your placement perfectly to stack blocks in this addictive tower building game. Each block must align perfectly with the previous one!"
            gradient="from-[#0052FF] to-[#0041CC]"
            delay={0}
          />
          <FeatureCard
            icon={faCoins}
            title="Tower Building"
            description="Test your reflexes and build the tallest tower possible! The taller your tower gets, the more challenging it becomes."
            gradient="from-[#0052FF] to-[#0041CC]"
            delay={0.2}
          />
          <FeatureCard
            icon={faTrophy}
            title="Compete & Win"
            description="Climb the leaderboards and compete for massive weekly prize pools with your tower building skills"
            gradient="from-[#0052FF] to-[#0041CC]"
            delay={0.4}
          />
        {/* </motion.div> */}

        </div>
        
        {/* Base Branding Footer */}
        <motion.div
          className="mt-12 flex items-center justify-center gap-2 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.8 }}
        >
       
          <img src="/images/base.png" alt="Base" className="w-10 h-10" />
         
        </motion.div>
      </div>
      
      {/* Welcome Popup - One Time Only */}
      <AnimatePresence>
        {showWelcomePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 4000,
              padding: '20px'
            }}
            onClick={closeWelcomePopup}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(20, 20, 40, 0.9) 0%, rgba(30, 30, 50, 0.85) 100%)',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                borderTop: '2px solid rgba(96, 165, 250, 0.4)',
                borderLeft: '2px solid rgba(59, 130, 246, 0.35)',
                borderRadius: '30px',
                padding: '40px 30px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                textAlign: 'center',
                boxShadow: '0 8px 40px 0 rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(96, 165, 250, 0.2)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)'
              }}
            >
              {/* Animated background elements */}
              <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-10%',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(96, 165, 250, 0.3) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'pulse 3s ease-in-out infinite'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-10%',
                left: '-10%',
                width: '120px',
                height: '120px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'pulse 3s ease-in-out infinite 1.5s'
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Hero Icon */}
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    fontSize: '80px',
                    marginBottom: '20px',
                    filter: 'drop-shadow(0 4px 20px rgba(255,215,0,0.5))'
                  }}
                >
                  🎁
                </motion.div>

                {/* Title */}
                <h2 style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.95) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '16px',
                  textShadow: '0 2px 20px rgba(255,255,255,0.5)',
                  fontFamily: 'var(--font-fredoka-one, system-ui)'
                }}>
                  Welcome to Base Block! 🚀
                </h2>

                <p style={{
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontSize: '16px',
                  marginBottom: '30px',
                  lineHeight: '1.6',
                  textShadow: '0 1px 10px rgba(0,0,0,0.2)'
                }}>
                  Jump, earn, and win REAL crypto tokens!
                </p>

                {/* Earning Methods */}
                <div style={{ 
                  textAlign: 'left', 
                  marginBottom: '30px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  padding: '24px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '20px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-fredoka-one, system-ui)'
                  }}>
                    💰 How to Earn Daily Rewards
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Gift Boxes */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(29, 78, 216, 0.2) 100%)',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1.5px solid rgba(96, 165, 250, 0.4)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '28px' }}>🎁</div>
                        <div>
                          <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                            3 Gift Boxes Every 12 Hours
                          </p>
                          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)' }}>
                            Beat your high score to unlock gift boxes with $DEGEN, $NOICE & $PEPE tokens!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Share Bonus */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(139, 195, 74, 0.25) 0%, rgba(111, 174, 62, 0.2) 100%)',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1.5px solid rgba(139, 195, 74, 0.4)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '28px' }}>📢</div>
                        <div>
                          <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                            Share & Get +2 Bonus Claims
                          </p>
                          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)' }}>
                            Share the game every 6 hours to earn 2 extra gift box claims!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Follow Bonus */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.2) 100%)',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1.5px solid rgba(96, 165, 250, 0.4)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '28px' }}>👤</div>
                        <div>
                          <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                            Follow for Exclusive Updates
                          </p>
                          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)' }}>
                            Follow @baseblock for special events, airdrops & bonus rewards!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px',
                  marginBottom: '30px'
                }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '12px 8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>⏰</div>
                    <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 'bold' }}>
                      12hr Periods
                    </p>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '12px 8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>💎</div>
                    <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 'bold' }}>
                      3 Tokens
                    </p>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '12px 8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏆</div>
                    <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 'bold' }}>
                      High Scores
                    </p>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={closeWelcomePopup}
                  style={{
                    width: '100%',
                    padding: '18px 24px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    background: 'linear-gradient(135deg, rgb(139, 195, 74), rgb(111, 174, 62))',
                    color: 'white',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    boxShadow: '0 8px 30px rgba(139, 195, 74, 0.5)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(139, 195, 74, 0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(139, 195, 74, 0.5)';
                  }}
                >
                  Let&apos;s Start Earning! 🚀
                </button>

                <p style={{
                  marginTop: '16px',
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontStyle: 'italic'
                }}>
                  Pro tip: Higher scores = Better rewards!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward Popup for First-Time Users */}
      {showRewardPopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
          }}
          onClick={handleCloseRewardPopup}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(90vw, 500px)',
                maxHeight: '85vh',
              borderRadius: '20px',
                padding: '25px',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(20px)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1))',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseRewardPopup}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: '50%',
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                zIndex: 10
              }}
            >
              ✕
            </button>

            {/* Content */}
            <div 
              className="popup-content-scrollable"
              style={{ 
                textAlign: 'center', 
                color: '#fff',
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                flex: 1,
                overflowY: 'auto',
                paddingRight: '10px',
                paddingTop: '10px'
              }}
            >
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                Welcome to Base Block! <FontAwesomeIcon icon={faRocket} />
              </h2>
              <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '20px', lineHeight: '1.5' }}>
                Get ready for epic block stacking adventures! Play Base Block daily and compete for $DEGEN tokens.
              </p>
              
              {/* How to Play Section */}
              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '15px', 
                padding: '20px',
                marginBottom: '20px',
                width: '100%'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-fredoka-one)' }}>
                  <FontAwesomeIcon icon={faGamepad} /> How to Play
                </h3>
                <div style={{ textAlign: 'left', fontSize: '13px', lineHeight: '1.4', fontFamily: 'var(--font-nunito)' }}>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faBullseye} style={{ marginRight: '8px', color: '#60a5fa', width: '16px' }} />
                    <span><strong>Objective:</strong> Stack blocks precisely to build the tallest tower possible</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '8px', color: '#8BC34A', width: '16px' }} />
                    <span><strong>Blocks:</strong> Each new block must be placed perfectly on the previous one</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faRocket} style={{ marginRight: '8px', color: '#60a5fa', width: '16px' }} />
                    <span><strong>Controls:</strong> Tap/click to place a block at the right moment</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px', color: '#FFD700', width: '16px' }} />
                    <span><strong>Precision:</strong> If blocks aren&apos;t aligned perfectly, the overhanging part will fall</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faBolt} style={{ marginRight: '8px', color: '#FFD700', width: '16px' }} />
                    <span><strong>Scoring:</strong> Points based on the number of blocks in your tower</span>
                  </div>
                </div>
              </div>
              {/* Competition Rules Section */}
              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '15px', 
                padding: '20px',
                marginBottom: '20px',
                width: '100%'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#FFD700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FontAwesomeIcon icon={faTrophy} /> Competition Rules
                </h3>
                <div style={{ textAlign: 'left', fontSize: '13px', lineHeight: '1.4' }}>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faMedal} style={{ marginRight: '8px', color: '#FFD700', width: '16px' }} />
                    <span><strong>Top 10 Only:</strong> Only top 10 players get $DEGEN rewards</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faBalanceScale} style={{ marginRight: '8px', color: '#60a5fa', width: '16px' }} />
                    <span><strong>Fair Play:</strong> No cheating or exploiting bugs</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faUsers} style={{ marginRight: '8px', color: '#3b82f6', width: '16px' }} />
                    <span><strong>One Account:</strong> One wallet per player only</span>
                  </div>
                </div>
              </div>

              {/* Reward Info */}
             
              
              {/* Gift Box System Section */}
              
            </div>
            
            {/* Fixed Button at Bottom */}
            <div style={{ 
              paddingTop: '20px', 
              borderTop: '1px solid rgba(255,255,255,0.1)',
              marginTop: '20px'
            }}>
              <motion.button
                onClick={handleCloseRewardPopup}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%',
                  fontFamily: 'var(--font-fredoka-one)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  Let&apos;s Start Stacking! <FontAwesomeIcon icon={faRocket} />
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
      
      <BottomNavbar
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onShowGame={setShowGame} 
        onShowStats={setShowStats} 
        onShowLeaderboard={setShowLeaderboard} 
      />
      
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { 
            opacity: 0.2;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }
        @keyframes shoot {
          0% {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateX(-100vw) translateY(100vh);
            opacity: 0;
          }
        }
        
        .popup-content-scrollable::-webkit-scrollbar {
          width: 6px;
        }
        .popup-content-scrollable::-webkit-scrollbar-track {
          background: transparent;
        }
        .popup-content-scrollable::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 3px;
        }
        .popup-content-scrollable::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.5);
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-10px) translateX(5px); }
          50% { transform: translateY(-5px) translateX(-5px); }
          75% { transform: translateY(-15px) translateX(3px); }
        }
        
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-8px) translateX(-3px); }
          66% { transform: translateY(-12px) translateX(4px); }
        }
        
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-6px) translateX(2px); }
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animate-float-medium {
          animation: float-medium 6s ease-in-out infinite;
        }
        
        .animate-float-fast {
          animation: float-fast 4s ease-in-out infinite;
        }
        
        /* Bounce animation for buttons */
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0,-8px,0);
          }
          70% {
            transform: translate3d(0,-4px,0);
          }
          90% {
            transform: translate3d(0,-2px,0);
          }
        }
        
        .hover\:animate-bounce:hover {
          animation: bounce 1s ease-in-out;
        }
      `}</style>
    </div>
  )
}

interface BottomNavbarProps {
  activeTab: 'home' | 'stats' | 'leaderboard'
  onTabChange: (tab: 'home' | 'stats' | 'leaderboard') => void
  onShowGame: (show: boolean) => void
  onShowStats: (show: boolean) => void
  onShowLeaderboard: (show: boolean) => void
}

// Stats Card Component
const StatsCard = ({ icon, title, value, trend, color }: {
  icon: any;
  title: string;
  value: string;
  trend: string;
  color: string;
}) => (
  <motion.div
    className="relative overflow-hidden p-6 rounded-2xl shadow-lg border"
    style={{
      background: 'white',
      border: '1px solid #E5E7EB',
      boxShadow: '0 4px 16px rgba(0, 82, 255, 0.1)'
    }}
    whileHover={{ 
      scale: 1.05,
      y: -3,
      boxShadow: "0 8px 24px rgba(0, 82, 255, 0.2)"
    }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-md`}>
          <FontAwesomeIcon icon={icon} className="text-white text-sm" />
        </div>
        <div className="flex items-center">
          <div className="h-[1px] w-8 mr-2" style={{ background: 'rgba(0, 82, 255, 0.3)' }}></div>
          <span className="text-xs font-medium uppercase tracking-wider" style={{ fontFamily: 'var(--font-nunito)', color: '#0052FF' }}>
            {trend}
          </span>
        </div>
      </div>
      <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-fredoka-one)', color: '#0052FF' }}>
        {value}
      </div>
      <div className="text-xs uppercase tracking-wider mt-2 font-medium" style={{ fontFamily: 'var(--font-nunito)', color: '#6B7280' }}>{title}</div>
    </div>
  </motion.div>
);

// Feature Card Component
const FeatureCard = ({ icon, title, description, gradient, delay }: {
  icon: any;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}) => (
  <motion.div
    className="relative group"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.4 + delay, duration: 0.6 }}
  >
    <div className="relative overflow-hidden p-6 h-full rounded-2xl shadow-lg border" 
      style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        boxShadow: '0 4px 16px rgba(0, 82, 255, 0.1)'
      }}
    >
      <div className="flex flex-col items-center mb-6">
        <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-md mb-4`}>
          <FontAwesomeIcon icon={icon} className="text-white text-2xl" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold mb-3 text-center" style={{ fontFamily: 'var(--font-fredoka-one)', color: '#0052FF' }}>{title}</h3>
      <p className="leading-relaxed text-sm text-center" style={{ fontFamily: 'var(--font-nunito)', color: '#6B7280' }}>{description}</p>
      
      {/* Hover effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-all duration-500 ease-in-out rounded-2xl`} />
    </div>
  </motion.div>
);

function BottomNavbar({ activeTab, onTabChange, onShowGame, onShowStats, onShowLeaderboard }: BottomNavbarProps) {
  const handleTabClick = (tab: 'home' | 'stats' | 'leaderboard') => {
    onTabChange(tab)
    
    switch (tab) {
      case 'stats':
        onShowGame(false)
        onShowStats(true)
        onShowLeaderboard(false)
        break
      case 'leaderboard':
        onShowGame(false)
        onShowStats(false)
        onShowLeaderboard(true)
        break
      case 'home':
      default:
        onShowGame(false)
        onShowStats(false)
        onShowLeaderboard(false)
        break
    }
  }

  const tabs = [
    { id: 'home', icon: faHome, label: 'Home', color: 'from-[#0052FF] to-[#0041CC]' },
    { id: 'stats', icon: faChartBar, label: 'Analytics', color: 'from-[#0052FF] to-[#0041CC]' },
    { id: 'leaderboard', icon: faTrophy, label: 'Champions', color: 'from-[#0052FF] to-[#0041CC]' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div 
        className="relative overflow-hidden backdrop-blur-xl mx-auto max-w-md rounded-3xl border"
        style={{
          background: 'white',
          border: '1px solid #E5E7EB',
          boxShadow: '0 -10px 40px rgba(0, 82, 255, 0.15)'
        }}
      >
        {/* Animated glow effect */}
        <div className="absolute inset-0 opacity-10" style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(0, 82, 255, 0.2) 0%, transparent 60%)',
        }}></div>
        
        <div className="relative z-10 flex justify-around items-center py-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as any)}
                className="relative flex flex-col items-center justify-center px-6 py-3 rounded-2xl transition-all duration-300"
                style={{
                  background: isActive ? 'rgba(0, 82, 255, 0.1)' : 'transparent'
                }}
                whileHover={{ 
                  backgroundColor: isActive ? "rgba(0, 82, 255, 0.15)" : "rgba(0, 82, 255, 0.05)",
                  scale: 1.05
                }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Icon */}
                <motion.div
                  animate={{
                    color: isActive ? '#0052FF' : '#6B7280',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <FontAwesomeIcon 
                    icon={tab.icon} 
                    className="text-lg mb-1 relative z-10" 
                  />
                </motion.div>
                
                {/* Label */}
                <motion.div 
                  className="text-[10px] uppercase tracking-wider relative z-10 font-semibold"
                  style={{ fontFamily: 'var(--font-nunito)' }}
                  animate={{
                    color: isActive ? '#0052FF' : '#6B7280',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.label}
                </motion.div>
                
                {/* Active indicator dot */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="absolute top-1 right-1 w-2 h-2 rounded-full"
                      style={{ background: '#0052FF' }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </AnimatePresence>
                
                {/* Hover glow */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl" style={{
                    boxShadow: '0 0 20px rgba(0, 82, 255, 0.2), inset 0 0 10px rgba(0, 82, 255, 0.05)'
                  }} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  )
}

