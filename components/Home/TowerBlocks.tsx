'use client'

import { useState, useEffect, useRef } from 'react';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedo, faShare, faVolumeUp, faVolumeMute, faSpinner, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useAccount, useContractWrite, useWaitForTransactionReceipt } from 'wagmi';
import { authenticatedFetch } from '@/lib/auth';
import { getPlayerData } from '@/lib/leaderboard';
import { APP_URL } from '@/lib/constants';
import { CONTRACT_ADDRESSES, MINI_GAME_ABI } from '@/lib/contracts';
import GiftBox from '../GiftBox';

interface TowerBlockGameProps {
  onBackToMenu: () => void;
}

// Main component using iframe approach for complete isolation
export default function TowerBlocks({ onBackToMenu }: TowerBlockGameProps) {
  const { context,actions } = useMiniAppContext();
  const { address } = useAccount();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [previousBestScore, setPreviousBestScore] = useState(0);
  const [showGiftBox, setShowGiftBox] = useState(false);
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const isMounted = useRef(false);
  const canClaimGift = useRef(true);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const gameInstance = useRef<any>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // Blockchain transaction state for score saving
  const { writeContract: writeStoreScore, data: storeScoreTx, isSuccess: storeScoreSuccess, isError: storeScoreError, error: storeScoreErrorObj } = useContractWrite();
  const { isLoading: isStoreScoreLoading, isSuccess: isStoreScoreConfirmed } = useWaitForTransactionReceipt({ hash: storeScoreTx });
  
  // Blockchain transaction status
  const [blockchainStatus, setBlockchainStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [blockchainError, setBlockchainError] = useState<string | null>(null);
  const [showBlockchainStatus, setShowBlockchainStatus] = useState(true);
  
  // Initialize game when component mounts
  useEffect(() => {
    isMounted.current = true;

    // Don't start the game immediately - we'll let the user click to start
    setGameStarted(false);
    
    // Try to play background music on user interaction (required by most browsers)
    const playBackgroundMusic = () => {
      if (backgroundMusicRef.current && backgroundMusicRef.current.paused) {
        // Respect mute state - don't override if muted
        if (!isMuted) {
          backgroundMusicRef.current.volume = 0.5;
        }
        console.log('Setting volume to:', backgroundMusicRef.current.volume);
        
        backgroundMusicRef.current.play().catch(error => {
          console.warn('Failed to play background music on interaction:', error);
        });
      }
    };
    
    // Add event listeners for user interaction to play music
    document.addEventListener('click', playBackgroundMusic);
    document.addEventListener('touchstart', playBackgroundMusic);
    
    // Add a custom event listener for game over
    const gameOverHandler = (event: CustomEvent) => {
      console.log('Custom game over event received:', event.detail);
      if (event.detail && typeof event.detail.score === 'number') {
        setScore(event.detail.score);
        setGameOver(true);
      }
    };
    
    // Add the event listener
    document.addEventListener('baseBlockGameOver', gameOverHandler as EventListener);

    // Clean up when component unmounts
    return () => {
      isMounted.current = false;
      document.removeEventListener('baseBlockGameOver', gameOverHandler as EventListener);
      document.removeEventListener('click', playBackgroundMusic);
      document.removeEventListener('touchstart', playBackgroundMusic);
      
      // Clean up three.js resources if necessary
      if (gameInstance) {
        // Add any cleanup logic here
      }
    };
  }, []);

  // Check for global game over variables as a fallback
  useEffect(() => {
    const checkGameOverInterval = setInterval(() => {
      if ((window as any).BASE_BLOCK_GAME_OVER && typeof (window as any).BASE_BLOCK_SCORE === 'number') {
        console.log('Detected game over from global variables');
        setScore((window as any).BASE_BLOCK_SCORE);
        setGameOver(true);
        
        // Reset the globals to prevent duplicate triggers
        (window as any).BASE_BLOCK_GAME_OVER = false;
        clearInterval(checkGameOverInterval);
      }
    }, 500);
    
    return () => clearInterval(checkGameOverInterval);
  }, []);

  // Handle blockchain transaction status changes
  useEffect(() => {
    if (storeScoreSuccess && !isStoreScoreLoading) {
      setBlockchainStatus('success');
      console.log('Score saved to blockchain successfully!');
    } else if (storeScoreError) {
      // Handle different types of errors gracefully
      let errorMessage = 'Failed to save score to blockchain';
      
      if (storeScoreErrorObj?.message) {
        if (storeScoreErrorObj.message.includes('User rejected')) {
          errorMessage = 'Transaction cancelled - score saved locally only';
        } else if (storeScoreErrorObj.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction';
        } else if (storeScoreErrorObj.message.includes('network')) {
          errorMessage = 'Network error - please try again';
        } else if (storeScoreErrorObj.message.includes('gas')) {
          errorMessage = 'Transaction failed - please try again';
        } else {
          errorMessage = 'Transaction failed - score saved locally only';
        }
      }
      
      setBlockchainStatus('error');
      setBlockchainError(errorMessage);
      console.warn('Blockchain transaction failed:', storeScoreErrorObj);
    } else if (isStoreScoreLoading) {
      setBlockchainStatus('saving');
      console.log('Saving score to blockchain...');
    }
  }, [storeScoreSuccess, storeScoreError, isStoreScoreLoading, storeScoreErrorObj]);

  // Handle game over and score submission
  useEffect(() => {
    console.log('Game over effect triggered:', { gameOver, score, address, isScoreSubmitted });
    
    if (gameOver && score > 0 && address && !isScoreSubmitted) {
      console.log('Submitting score and checking for gift box eligibility');
      submitScore(score);
      
      // Try to save to blockchain (non-blocking - won't affect game flow if it fails)
      try {
        saveScoreToBlockchain(score);
      } catch (error) {
        console.warn('Blockchain save failed, but continuing with game flow:', error);
      }
      
      // Check if user can claim gift box - ALWAYS attempt to show gift box at game over
      console.log('canClaimGift.current status:', canClaimGift.current);
      if (canClaimGift.current) {
        console.log('Checking for gift box availability...');
        checkAndShowGiftBox();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver, score, address, isScoreSubmitted]);

  // Function to check and display gift box
  const checkAndShowGiftBox = async () => {
    console.log('checkAndShowGiftBox called with:', { address, fid: context?.user?.fid });
    
    if (!address || !context?.user?.fid) {
      console.log('Missing address or fid, cannot check for gift box');
      return;
    }

    try {
      console.log('Fetching gift box availability from API...');
      const response = await fetch(
        `/api/claim-gift-box?userAddress=${address}&fid=${context.user.fid}&stats=true`
      );
      const result = await response.json();
      console.log('Gift box API response:', result);

      if (result.success && result.stats && result.stats.remainingClaims > 0) {
        console.log('User CAN claim gift box, showing after delay');
        // Show gift box after a short delay for better UX
        setTimeout(() => {
          if (isMounted.current) {
            console.log('Setting showGiftBox to true');
            setShowGiftBox(true);
          } else {
            console.log('Component no longer mounted, not showing gift box');
          }
        }, 1000);
      } else {
        console.log('No gift boxes remaining or API check failed');
        setShowGiftBox(false);
      }
    } catch (error) {
      console.error('Error checking gift box availability:', error);
      setShowGiftBox(false);
    }
  };

  // Function to submit score to database - matching VerticalJumperGame pattern
  const submitScoreToDatabase = async (
    fid: number,
    pfpUrl: string,
    username: string,
    gameScore: number,
    gameLevel: number,
    gameDurationSeconds?: number,
    userAddress?: string
  ) => {
    try {
      const { authenticatedFetch } = await import('@/lib/auth');
      const response = await authenticatedFetch('/api/submit-score', {
        method: 'POST',
        body: JSON.stringify({
          fid,
          pfpUrl,
          username,
          score: gameScore,
          level: gameLevel,
          duration: gameDurationSeconds || 0,
          userAddress
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to submit score:', result.error);
      } else {
        console.log('Score submitted successfully:', result.data);
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  // Function to save score to blockchain
  const saveScoreToBlockchain = async (gameScore: number) => {
    if (!address) {
      console.log('No address available to save score to blockchain - skipping blockchain save');
      return;
    }

    try {
      console.log('Saving score to blockchain:', gameScore);
      setBlockchainStatus('saving');
      setBlockchainError(null);
      
      // Use the MiniGame contract to store the score
      writeStoreScore({
        address: CONTRACT_ADDRESSES.MINI_GAME as `0x${string}`,
        abi: MINI_GAME_ABI,
        functionName: 'storeScore',
        args: [BigInt(gameScore)]
      });
    } catch (error) {
      console.warn('Error initiating blockchain transaction:', error);
      setBlockchainStatus('error');
      setBlockchainError('Failed to initiate blockchain transaction');
    }
  };

  // Function to retry blockchain save
  const retryBlockchainSave = () => {
    if (score > 0) {
      console.log('Retrying blockchain save for score:', score);
      saveScoreToBlockchain(score);
    }
  };

  // Function to submit score - wrapper for backward compatibility
  const submitScore = async (gameScore: number) => {
    if (!address) {
      console.error('No address available to submit score');
      return;
    }

    setSubmissionStatus('loading');

    try {
      // Get player data
      const playerData = getPlayerData(context);
      
      // Check if this is a new high score
      const prevMaxScore = parseInt(localStorage.getItem('baseBlockMaxScore') || '0');
      
      if (gameScore > prevMaxScore) {
        // Submit to database only if it's a new high score
        await submitScoreToDatabase(
          playerData.fid,
          playerData.pfpUrl,
          playerData.username,
          gameScore,
          1, // level
          0, // duration (Base Block doesn't track time)
          (typeof address === 'string' ? address : undefined)
        );
        
        // Update localStorage
        localStorage.setItem('baseBlockMaxScore', gameScore.toString());
        setBestScore(gameScore);
        setSubmissionStatus('success');
        setIsScoreSubmitted(true);
      } else {
        // Not a high score, but still mark as submitted
        setSubmissionStatus('idle');
        setIsScoreSubmitted(true);
      }
      
      setPreviousBestScore(prevMaxScore);
    } catch (error) {
      console.error('Error submitting score:', error);
      setSubmissionStatus('error');
    }
  };

  // Initialize THREE.js game
  const initGame = () => {
    console.log('🎮 Initializing game...');
    
    // Clean up global functions
    delete (window as any).handleGameOver;
    delete (window as any).updateScore;
    delete (window as any).playAgainGame;
    delete (window as any).emergencyRestartGame;
    delete (window as any).BASE_BLOCK_GAME_OVER;
    delete (window as any).BASE_BLOCK_SCORE;
    
    // Instead of using an iframe, we'll directly initialize the game in the container
    if (gameContainerRef.current) {
      // Clear any existing content
      gameContainerRef.current.innerHTML = '';
      
      // Create a container for the game
      const gameDiv = document.createElement('div');
      gameDiv.id = 'game-container';
      gameDiv.style.width = '100%';
      gameDiv.style.height = '100%';
      gameDiv.style.position = 'relative';
      gameDiv.style.backgroundColor = '#F5F7FA';
      gameDiv.style.overflow = 'hidden';
      gameDiv.style.display = 'block';
      
      // Make sure the game container takes up the full space
      gameContainerRef.current.style.width = '100%';
      gameContainerRef.current.style.height = '100%';
      gameContainerRef.current.style.position = 'relative';
      gameContainerRef.current.style.overflow = 'hidden';
      gameContainerRef.current.style.display = 'block';
      
      gameContainerRef.current.appendChild(gameDiv);
      
      console.log('Game container created with ID: game-container');
      
      // Add CSS to ensure the game container is visible
      let styleElement = document.getElementById('base-block-style');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'base-block-style';
        styleElement.textContent = `
          #game-container {
            width: 100% !important;
            height: 100% !important;
            position: relative !important;
            overflow: hidden !important;
            z-index: 1 !important;
          }
          #game-container canvas {
            width: 100% !important;
            height: 100% !important;
            display: block !important;
          }
        `;
        document.head.appendChild(styleElement);
      }
      
      // Load Three.js library
      const loadThreeJS = () => {
        return new Promise((resolve) => {
          if ((window as any).THREE) {
            console.log('Three.js already loaded');
            resolve(true);
            return;
          }
          
          console.log('Loading Three.js...');
          const script = document.createElement('script');
          script.id = 'threejs-script';
          script.src = 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js';
          script.onload = () => {
            console.log('Three.js loaded successfully');
            resolve(true);
          };
          script.onerror = (e) => {
            console.error('Error loading Three.js:', e);
            resolve(false);
          };
          document.head.appendChild(script);
        });
      };
      
      // Initialize the game after Three.js is loaded
      loadThreeJS().then((loaded) => {
        if (!loaded) {
          console.error('Failed to load Three.js, cannot initialize game');
          return;
        }
        
        console.log('Initializing game after Three.js loaded');
        
        // Create a global function to handle game over
        (window as any).handleGameOver = (score: number) => {
          console.log('Game over handler called with score:', score);
          setScore(score);
          setGameOver(true);
        };
        
        // Create a global function to update score
        (window as any).updateScore = (score: number) => {
          setScore(score);
        };
        
        // Create emergency restart function
        (window as any).emergencyRestartGame = () => {
          console.log('Emergency restart triggered');
          performGameRestart();
        };
        
        // Double-check no game scripts exist before adding new one
        const finalCheck = document.querySelectorAll('script[id*="base-block-game-script"]');
        finalCheck.forEach(script => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
            console.log('Removed stale script during final check:', script.id);
          }
        });
        
        // Execute the game script with a unique ID
        const gameScriptId = 'base-block-game-script-' + Date.now();
        const gameScript = document.createElement('script');
        gameScript.id = gameScriptId;
        
        try {
          gameScript.textContent = generateGameScript();
          // Add the script to the body
          document.body.appendChild(gameScript);
          console.log('Game script added with ID:', gameScriptId);
        } catch (error) {
          console.error('Error adding game script:', error);
        }
      });
    }
  };

  // Handle messages from the game script
  const handleGameMessage = (event: MessageEvent) => {
    console.log('Message received:', event.data);
    
    if (event.data?.type === "game_over") {
      const finalScore = event.data.data.score;
      console.log('Game over received! Score:', finalScore);
      
      // Use setTimeout to ensure state updates properly
      setTimeout(() => {
        setScore(finalScore);
        setGameOver(true);
      }, 0);
    } else if (event.data?.type === "score_update") {
      setScore(event.data.data.score);
    }
  };

  // Generate the game script that will be injected
  const generateGameScript = () => {
    return `
    class TowerBlock {
      constructor(object, property, from, to, duration, easingFunction, onComplete, delay=0) {
        this.object = object;
        this.property = property;
        this.from = from;
        this.to = to;
        this.duration = duration * 1000; // convert to milliseconds
        this.startTime = performance.now() + delay * 1000;
        this.easingFunction = easingFunction;
        this.onComplete = onComplete;
        this.delay = delay * 1000; // convert to milliseconds
      }

      update(currentTime) {
        if (currentTime < this.startTime) {
          return true; // Animation hasn't started yet
        }
        const elapsed = currentTime - this.startTime;
        const t = Math.min(elapsed / this.duration, 1);
        const value = this.from + (this.to - this.from) * this.easingFunction(t);
        this.object[this.property] = value;

        if (t >= 1) {
          if (this.onComplete)
            this.onComplete();
          return false; // Animation complete
        }
        return true; // Animation in progress
      }
    }

    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function easeIn(t) {
      return t * t;
    }

    class Stage {
      constructor() {
        // container - find the game container
        this.container = document.getElementById("game-container");
        if (!this.container) {
          console.error("Could not find game container element!");
          // Try to find it by other means
          this.container = document.querySelector("#game-container") || document.body;
        }
        console.log("Game container found:", this.container);
        // renderer

        try {
          this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
          });

          console.log("WebGLRenderer created");
          
          // Set renderer size and properties with Base theme
          this.renderer.setSize(window.innerWidth, window.innerHeight);
          this.renderer.setClearColor("#F5F7FA", 1);
          
          // Make sure the canvas is visible
          this.renderer.domElement.style.width = '100%';
          this.renderer.domElement.style.height = '100%';
          this.renderer.domElement.style.display = 'block';
          this.renderer.domElement.style.position = 'absolute';
          this.renderer.domElement.style.top = '0';
          this.renderer.domElement.style.left = '0';
          
          console.log("Appending renderer to container:", this.container);
          this.container.appendChild(this.renderer.domElement);
        } catch (e) {
          console.error("Error creating WebGLRenderer:", e);
        }

        // scene
        this.scene = new THREE.Scene();

        // camera
        const aspect = window.innerWidth / window.innerHeight;
        const d = 20;
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, -100, 1000);
        this.camera.position.set(2, 2, 2);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        // light
        this.light = new THREE.DirectionalLight(0xffffff, 1);
        this.light.position.set(0, 499, 0);
        this.scene.add(this.light);

        this.softLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(this.softLight);

        // audio listener
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

        // Expose the audio listener globally for the iframe to access
        window.threeAudioListener = this.listener;

        // Set initial mute state
        if (window.isMuted) {
          this.listener.setMasterVolume(0);
        }

        // Update audio loading
        const audioLoader = new THREE.AudioLoader();
        this.placeSoundBuffer = null;
        this.missSoundBuffer = null;
        this.stoneSoundBuffer = null;

        try {
          audioLoader.load("https://lqy3lriiybxcejon.public.blob.vercel-storage.com/0000-games-shared/blocks.wav", (buffer) => {
            this.placeSoundBuffer = buffer;
          });
          audioLoader.load("https://lqy3lriiybxcejon.public.blob.vercel-storage.com/0000-games-shared/miss.wav", (buffer) => {
            this.missSoundBuffer = buffer;
          });
          audioLoader.load("https://lqy3lriiybxcejon.public.blob.vercel-storage.com/0000-games-shared/stones.wav", (buffer) => {
            this.stoneSoundBuffer = buffer;
          });
        } catch (e) {
          console.warn("Audio loading failed");
        }

        window.addEventListener("resize", () => this.onResize());
        this.onResize();
        this.soundEnabled = true;

        this.towerBlocks = [];

        // Add mute state tracking
        this.isMuted = false;

        // Listen for mute toggle messages from parent
        window.addEventListener("message", (event) => {
          if (event.data?.type === "MUTE_TOGGLE") {
            this.isMuted = event.data.isMuted;
            // Update all existing audio
            if (this.listener) {
              this.listener.setMasterVolume(this.isMuted ? 0 : 1);
            }
          }
        });
      }

      setCamera(y, speed = 0.3) {
        const fromPositionY = this.camera.position.y;
        const toPositionY = y + 4;
        const fromLookAtY = this.camera.lookAt.y;
        const toLookAtY = y;

        this.towerBlocks.push(new TowerBlock(this.camera.position, "y", fromPositionY, toPositionY, speed, easeInOut));
        this.towerBlocks.push(new TowerBlock(this.camera.lookAt, "y", fromLookAtY, toLookAtY, speed, easeInOut));
      }

      onResize() {
        const viewSize = 30;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.left = window.innerWidth / -viewSize;
        this.camera.right = window.innerWidth / viewSize;
        this.camera.top = window.innerHeight / viewSize;
        this.camera.bottom = window.innerHeight / -viewSize;
        this.camera.updateProjectionMatrix();
      }

      render = () => {
        const currentTime = performance.now();
        this.towerBlocks = this.towerBlocks.filter((anim) => anim.update(currentTime));
        this.renderer.render(this.scene, this.camera);
      };

      add = (elem) => {
        this.scene.add(elem);
      };

      remove = (elem) => {
        this.scene.remove(elem);
      };

      playPlaceSound() {
        if (this.placeSoundBuffer && !this.isMuted) {
          try {
            const placeSound = new THREE.Audio(this.listener);
            placeSound.setBuffer(this.placeSoundBuffer);
            placeSound.setLoop(false);
            const randomVolume = Math.random() * 0.3 + 0.1;
            placeSound.setVolume(randomVolume);
            placeSound.play();
          } catch (e) {
            console.warn("Audio playback failed");
          }
        }
      }

      playMissSound() {
        if (this.missSoundBuffer && !this.isMuted) {
          try {
            const missSound = new THREE.Audio(this.listener);
            missSound.setBuffer(this.missSoundBuffer);
            missSound.setLoop(false);
            const randomVolume = Math.random() * 0.5 + 0.3;
            missSound.setVolume(randomVolume);
            missSound.play();
          } catch (e) {
            console.warn("Audio playback failed");
          }
        }
      }

      playStoneSound() {
        if (this.stoneSoundBuffer && !this.isMuted) {
          try {
            const stoneSound = new THREE.Audio(this.listener);
            stoneSound.setBuffer(this.stoneSoundBuffer);
            stoneSound.setLoop(false);
            const randomVolume = Math.random() * 0.3 + 0.1;
            stoneSound.setVolume(randomVolume);
            stoneSound.play();
          } catch (e) {
            console.warn("Audio playback failed");
          }
        }
      }
    }

    class Block {
      constructor(block) {
        this.STATES = {
          ACTIVE: "active",
          STOPPED: "stopped",
          MISSED: "missed",
        };
        this.MOVE_AMOUNT = 12;

        this.targetBlock = block;

        this.index = (this.targetBlock ? this.targetBlock.index : 0) + 1;
        this.workingPlane = this.index % 2 ? "x" : "z";
        this.workingDimension = this.index % 2 ? "width" : "depth";

        this.dimension = {
          width: this.targetBlock ? this.targetBlock.dimension.width : 10,
          height: this.targetBlock ? this.targetBlock.dimension.height : 2,
          depth: this.targetBlock ? this.targetBlock.dimension.depth : 10,
        };

        this.position = {
          x: this.targetBlock ? this.targetBlock.position.x : 0,
          y: this.dimension.height * this.index,
          z: this.targetBlock ? this.targetBlock.position.z : 0,
        };

        this.colorOffset = this.targetBlock ? this.targetBlock.colorOffset : Math.round(Math.random() * 100);

        if (!this.targetBlock) {
          this.color = 0x0052FF; // Base Blue for foundation
        } else {
          // Base-themed color palette with blues and whites
          const offset = this.index + this.colorOffset;
          // Oscillate between Base Blue and lighter shades
          const hue = 220; // Blue hue
          const saturation = 100 - (Math.sin(0.2 * offset) * 20 + 40); // 40-60%
          const lightness = Math.sin(0.15 * offset) * 15 + 60; // 45-75%
          
          // Convert HSL to RGB for THREE.Color
          const h = hue / 360;
          const s = saturation / 100;
          const l = lightness / 100;
          this.color = new THREE.Color().setHSL(h, s, l);
        }

        this.state = this.index > 1 ? this.STATES.ACTIVE : this.STATES.STOPPED;
        this.speed = -0.125 - Math.floor(this.index, 30) * 0.003;
        if (this.speed < -4)
          this.speed = -4;
        this.direction = this.speed;

        const geometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
        geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(this.dimension.width / 2, this.dimension.height / 2, this.dimension.depth / 2));
        this.material = new THREE.MeshToonMaterial({
          color: this.color,
        });
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);

        if (this.state === this.STATES.ACTIVE) {
          this.position[this.workingPlane] = Math.random() > 0.5 ? -this.MOVE_AMOUNT : this.MOVE_AMOUNT;
        }

        this.stage = block ? block.stage : null; // Pass stage reference from parent block
      }

      reverseDirection() {
        this.direction = this.direction > 0 ? this.speed : Math.abs(this.speed);
      }

      place() {
        this.state = this.STATES.STOPPED;

        let overlap = 0;
        if (this.targetBlock) {
          overlap = this.targetBlock.dimension[this.workingDimension] - Math.abs(this.position[this.workingPlane] - this.targetBlock.position[this.workingPlane]);
        }

        const blocksToReturn = {
          plane: this.workingPlane,
          direction: this.direction,
        };

        if (this.dimension[this.workingDimension] - overlap < 0.3) {
          overlap = this.dimension[this.workingDimension];
          blocksToReturn.bonus = true;
          if (this.targetBlock) {
            this.position.x = this.targetBlock.position.x;
            this.position.z = this.targetBlock.position.z;
            this.dimension.width = this.targetBlock.dimension.width;
            this.dimension.depth = this.targetBlock.dimension.depth;
          }
          this.stage?.playStoneSound();

          // Add back the placed block geometry
          const placedGeometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
          placedGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(this.dimension.width / 2, this.dimension.height / 2, this.dimension.depth / 2));
          const placedMesh = new THREE.Mesh(placedGeometry, this.material);
          placedMesh.position.set(this.position.x, this.position.y, this.position.z);
          blocksToReturn.placed = placedMesh;
        } else if (overlap > 0) {
          this.stage?.playPlaceSound();

          const choppedDimensions = {
            width: this.dimension.width,
            height: this.dimension.height,
            depth: this.dimension.depth,
          };
          choppedDimensions[this.workingDimension] -= overlap;
          this.dimension[this.workingDimension] = overlap;

          const placedGeometry = new THREE.BoxGeometry(this.dimension.width, this.dimension.height, this.dimension.depth);
          placedGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(this.dimension.width / 2, this.dimension.height / 2, this.dimension.depth / 2));
          const placedMesh = new THREE.Mesh(placedGeometry, this.material);

          const choppedGeometry = new THREE.BoxGeometry(choppedDimensions.width, choppedDimensions.height, choppedDimensions.depth);
          choppedGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(choppedDimensions.width / 2, choppedDimensions.height / 2, choppedDimensions.depth / 2));
          const choppedMesh = new THREE.Mesh(choppedGeometry, this.material);

          const choppedPosition = {
            x: this.position.x,
            y: this.position.y,
            z: this.position.z,
          };

          if (this.targetBlock && this.position[this.workingPlane] < this.targetBlock.position[this.workingPlane]) {
            this.position[this.workingPlane] = this.targetBlock.position[this.workingPlane];
          } else {
            choppedPosition[this.workingPlane] += overlap;
          }

          placedMesh.position.set(this.position.x, this.position.y, this.position.z);
          choppedMesh.position.set(choppedPosition.x, choppedPosition.y, choppedPosition.z);

          blocksToReturn.placed = placedMesh;
          if (!blocksToReturn.bonus)
            blocksToReturn.chopped = choppedMesh;
        } else {
          this.state = this.STATES.MISSED;
          this.stage?.playMissSound();
        }

        this.dimension[this.workingDimension] = overlap;

        return blocksToReturn;
      }

      tick() {
        if (this.state === this.STATES.ACTIVE) {
          const value = this.position[this.workingPlane];
          if (value > this.MOVE_AMOUNT || value < -this.MOVE_AMOUNT)
            this.reverseDirection();
          this.position[this.workingPlane] += this.direction;
          this.mesh.position[this.workingPlane] = this.position[this.workingPlane];
        }
      }
    }

    class Game {
      constructor() {
        this.STATES = {
          LOADING: "loading",
          PLAYING: "playing",
          READY: "ready",
          ENDED: "ended",
          RESETTING: "resetting",
        };
        this.blocks = [];
        this.state = this.STATES.LOADING;
        this.soundEnabled = true;
        this.stage = new Stage();
        this.stage.soundEnabled = this.soundEnabled;

        // Add score tracking
        this.score = 0;
        this.scoreElement = document.createElement("div");
        this.scoreElement.style.position = "absolute";
        this.scoreElement.style.top = "30px";
        this.scoreElement.style.left = "50%";
        this.scoreElement.style.transform = "translateX(-50%)";
        this.scoreElement.style.color = "#0052FF";
        this.scoreElement.style.fontSize = "56px";
        this.scoreElement.style.fontFamily = "'Inter', 'Poppins', sans-serif";
        this.scoreElement.style.fontWeight = "700";
        this.scoreElement.style.zIndex = "1000";
        this.scoreElement.style.textShadow = "0 2px 20px rgba(0, 82, 255, 0.3)";
        this.updateScoreDisplay();

        this.mainContainer = document.getElementById("game-container");
        this.mainContainer.appendChild(this.scoreElement);

        this.newBlocks = new THREE.Group();
        this.placedBlocks = new THREE.Group();
        this.choppedBlocks = new THREE.Group();

        this.stage.add(this.newBlocks);
        this.stage.add(this.placedBlocks);
        this.stage.add(this.choppedBlocks);

        this.addBlock();
        this.tick();

        // Update initial state and start automatically
        this.updateState(this.STATES.READY);
        this.startGame();

        document.addEventListener("keydown", (e) => {
          if (e.keyCode === 32)
            this.onAction();
        });

        document.addEventListener("pointerdown", (e) => {
          if (e.pointerType !== "mouse") {
            e.preventDefault();
          } else {
            this.onAction();
          }
        });

        document.addEventListener("touchstart", (e) => {
          e.preventDefault();
          this.onAction();
        });
      }

      updateState(newState) {
        for (const key in this.STATES)
          this.mainContainer.classList.remove(this.STATES[key]);
        this.mainContainer.classList.add(newState);
        this.state = newState;
      }

      onAction() {
        switch (this.state) {
          case this.STATES.PLAYING:
            this.placeBlock();
            break;
        }
      }

      startGame() {
        console.log('Game.startGame called, current state:', this.state);
        // Always allow starting a new game, regardless of current state
        this.score = 0;
        this.updateScoreDisplay();
        this.updateState(this.STATES.PLAYING);
        
        // Make sure we have at least one block to start with
        if (this.blocks.length === 0) {
          console.log('No blocks found, adding initial block');
          this.addBlock();
        } else {
          console.log('Adding new block to start game');
          this.addBlock();
        }
      }

      restartGame() {
        console.log('Game.restartGame called');
        this.updateState(this.STATES.RESETTING);

        try {
          // Clear all existing blocks safely
          try {
            while(this.placedBlocks.children.length > 0) {
              this.placedBlocks.remove(this.placedBlocks.children[0]);
            }
          } catch (e) {
            console.warn('Error clearing placed blocks:', e);
          }
          
          try {
            while(this.choppedBlocks.children.length > 0) {
              this.choppedBlocks.remove(this.choppedBlocks.children[0]);
            }
          } catch (e) {
            console.warn('Error clearing chopped blocks:', e);
          }
          
          try {
            while(this.newBlocks.children.length > 0) {
              this.newBlocks.remove(this.newBlocks.children[0]);
            }
          } catch (e) {
            console.warn('Error clearing new blocks:', e);
          }
          
          // Reset blocks array completely
          this.blocks = [];
          
          // Reset camera to initial position
          this.stage.setCamera(2, 0.3);
          
          // Reset score
          this.score = 0;
          this.updateScoreDisplay();
          
          // Clear animation queue
          this.stage.towerBlocks = [];
          
          // Start a new game after a short delay to ensure cleanup is complete
          setTimeout(() => {
            console.log('Starting new game after reset');
            // Make sure we're in the right state
            this.updateState(this.STATES.READY);
            // Add the first block
            this.addBlock();
            // Start playing
            this.startGame();
          }, 300);
        } catch (error) {
          console.error('Error in restartGame:', error);
          
          // Emergency restart - recreate the game
          try {
            console.log('Attempting emergency game restart');
            if (typeof window.emergencyRestartGame === 'function') {
              window.emergencyRestartGame();
            }
          } catch (e) {
            console.error('Emergency restart failed:', e);
          }
        }
      }

      placeBlock() {
        const currentBlock = this.blocks[this.blocks.length - 1];
        const newBlocks = currentBlock.place();
        this.newBlocks.remove(currentBlock.mesh);
        if (newBlocks.placed)
          this.placedBlocks.add(newBlocks.placed);
        if (newBlocks.chopped) {
          this.choppedBlocks.add(newBlocks.chopped);

          const positionParams = {
            y: newBlocks.chopped.position.y - 30,
            ease: easeIn,
          };

          const rotateRandomness = 10;
          const rotationParams = {
            delay: 0.05,
            x: newBlocks.plane === "z" ? Math.random() * rotateRandomness - rotateRandomness / 2 : 0.1,
            z: newBlocks.plane === "x" ? Math.random() * rotateRandomness - rotateRandomness / 2 : 0.1,
            y: Math.random() * 0.1,
          };

          const directionMultiplier = newBlocks.chopped.position[newBlocks.plane] > newBlocks.placed.position[newBlocks.plane] ? 1 : -1;

          const planePosition = newBlocks.chopped.position[newBlocks.plane] + 40 * Math.abs(newBlocks.direction) * directionMultiplier;

          // Animate chopped block position
          this.stage.towerBlocks.push(new TowerBlock(newBlocks.chopped.position, "y", newBlocks.chopped.position.y, newBlocks.chopped.position.y - 30, 1, easeIn, () => {
            this.choppedBlocks.remove(newBlocks.chopped);
          }));
          this.stage.towerBlocks.push(new TowerBlock(newBlocks.chopped.position, newBlocks.plane, newBlocks.chopped.position[newBlocks.plane], planePosition, 1, easeIn));

          // Animate rotation
          this.stage.towerBlocks.push(new TowerBlock(newBlocks.chopped.rotation, "x", newBlocks.chopped.rotation.x, rotationParams.x, 1, easeIn));
          this.stage.towerBlocks.push(new TowerBlock(newBlocks.chopped.rotation, "y", newBlocks.chopped.rotation.y, rotationParams.y, 1, easeIn));
          this.stage.towerBlocks.push(new TowerBlock(newBlocks.chopped.rotation, "z", newBlocks.chopped.rotation.z, rotationParams.z, 1, easeIn));
        }

        this.addBlock();
      }

      addBlock() {
        const lastBlock = this.blocks[this.blocks.length - 1];

        if (lastBlock && lastBlock.state === lastBlock.STATES.MISSED) {
          this.endGame();
          return;
        }

        const newKidOnTheBlock = new Block(lastBlock);
        newKidOnTheBlock.stage = this.stage;
        this.score = this.blocks.length - 1;
        this.updateScoreDisplay();
        this.newBlocks.add(newKidOnTheBlock.mesh);
        this.blocks.push(newKidOnTheBlock);

        this.stage.setCamera(this.blocks.length * 2);
        
        // Call the global function to update score
        if (typeof window.updateScore === 'function') {
          window.updateScore(this.score);
        }
      }

      endGame() {
        this.updateState(this.STATES.ENDED);
        
        console.log('Game over triggered! Score:', this.score);
        
        // Use multiple approaches to ensure the game over is detected
        
        // 1. Call the global function if available
        if (typeof window.handleGameOver === 'function') {
          console.log('Calling handleGameOver with score:', this.score);
          window.handleGameOver(this.score);
        } else {
          console.warn('handleGameOver function not found in window');
        }
        
        // 2. Dispatch a custom event (most reliable approach)
        try {
          console.log('Dispatching custom game over event');
          const gameOverEvent = new CustomEvent('baseBlockGameOver', { 
            detail: { score: this.score },
            bubbles: true,
            cancelable: true
          });
          document.dispatchEvent(gameOverEvent);
          
          // Dispatch again with delays to ensure it's received
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent('baseBlockGameOver', {
              detail: { score: this.score },
              bubbles: true,
              cancelable: true
            }));
          }, 200);
        } catch (e) {
          console.error('Error dispatching custom event:', e);
        }
        
        // 3. Try to directly set a global variable as a last resort
        try {
          window.BASE_BLOCK_GAME_OVER = true;
          window.BASE_BLOCK_SCORE = this.score;
        } catch (e) {
          console.error('Error setting global variable:', e);
        }
      }

      tick() {
        if (this.blocks && this.blocks.length > 0 && this.blocks[this.blocks.length - 1]) {
          this.blocks[this.blocks.length - 1].tick();
        }
        this.stage.render();
        requestAnimationFrame(() => {
          this.tick();
        });
      }

      updateScoreDisplay() {
        this.scoreElement.textContent = \`\${Math.max(0, this.score)}\`;
      }
    }

    const game = new Game();

    // Create global play again function
    window.playAgainGame = () => {
      console.log('Play again function called');
      try {
        if (!game) {
          console.error('Game instance not found');
          if (typeof window.emergencyRestartGame === 'function') {
            window.emergencyRestartGame();
          }
          return;
        }
        
        switch (game.state) {
          case game.STATES.READY:
            console.log('Game in READY state, starting game');
            game.startGame();
            break;
          case game.STATES.ENDED:
            console.log('Game in ENDED state, restarting game');
            game.restartGame();
            break;
          default:
            console.log('Game in unexpected state:', game.state);
            // Force restart
            if (typeof game.restartGame === 'function') {
              game.restartGame();
            } else {
              console.error('restartGame function not found');
              if (typeof window.emergencyRestartGame === 'function') {
                window.emergencyRestartGame();
              }
            }
        }
      } catch (error) {
        console.error('Error in playAgainGame:', error);
        // Try emergency restart
        if (typeof window.emergencyRestartGame === 'function') {
          window.emergencyRestartGame();
        }
      }
    };
    `;
  };

  // Handle play again - restart the game
  const handlePlayAgain = () => {
    console.log('Play again clicked - restarting game');
    
    // First, hide the game over screen and reset state
    setGameOver(false);
    setIsScoreSubmitted(false);
    setScore(0);
    setSubmissionStatus('idle');
    setShowGiftBox(false);
    
    // Reset blockchain status
    setBlockchainStatus('idle');
    setBlockchainError(null);
    setShowBlockchainStatus(true);
    
    // Try the game's internal restart first
    setTimeout(() => {
      console.log('Attempting to call game restart function...');
      
      // Check if the game's playAgainGame function exists and try to use it
      if (typeof (window as any).playAgainGame === 'function') {
        console.log('Calling window.playAgainGame()');
        try {
          (window as any).playAgainGame();
          console.log('Game restart function called successfully');
        } catch (error) {
          console.error('Error calling playAgainGame:', error);
          console.log('Falling back to full restart');
          performGameRestart();
        }
      } else {
        console.log('playAgainGame function not found, performing full restart');
        performGameRestart();
      }
    }, 100);
  };
  
  // Toggle mute function
  const toggleMute = () => {
    if (backgroundMusicRef.current) {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      
      if (newMutedState) {
        backgroundMusicRef.current.volume = 0;
      } else {
        backgroundMusicRef.current.volume = 0.5; // Set back to 50%
      }
    }
  };

  // Separate function to actually restart the game (following VerticalJumperGame pattern)
  const performGameRestart = () => {
    console.log('Performing complete game restart');
    
    // Don't reset state here since handlePlayAgain already does it
    // Just clean up and reinitialize the game
    
    try {
      // Clean up existing scripts and global functions
      const scripts = document.querySelectorAll('script:not([src])');
      scripts.forEach(script => {
        if (script.textContent && script.textContent.includes('class Game {')) {
          console.log('Removing existing game script');
          script.parentNode?.removeChild(script);
        }
      });
      
      // Clean up global functions
      delete (window as any).handleGameOver;
      delete (window as any).updateScore;
      delete (window as any).playAgainGame;
      delete (window as any).emergencyRestartGame;
      delete (window as any).BASE_BLOCK_GAME_OVER;
      delete (window as any).BASE_BLOCK_SCORE;
      
      // Clear the game container
      if (gameContainerRef.current) {
        console.log('Clearing game container');
        gameContainerRef.current.innerHTML = '';
      } else {
        console.error('Game container ref is null!');
        return;
      }
      
      // Short delay before reinitializing
      setTimeout(() => {
        console.log('Reinitializing game after cleanup');
        if (gameContainerRef.current) {
          initGame();
        } else {
          console.error('Game container ref is still null after cleanup!');
        }
      }, 150);
    } catch (error) {
      console.error('Error in performGameRestart:', error);
    }
  };

  // Custom CSS for the game - Base Chain themed
  const styles = {
    container: {
      position: 'relative' as const,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#F5F7FA',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    gameContainer: {
      width: '100%',
      height: '100%',
      margin: '0',
      padding: '0',
      flex: '1 1 auto',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    overlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(245, 247, 250, 0.98)',
      backdropFilter: 'blur(20px)',
      zIndex: 1000,
      color: '#0052FF',
      fontFamily: "'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      pointerEvents: 'all' as const,
    },
    button: {
      marginTop: '20px',
      padding: '14px 32px',
      background: '#0052FF',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 16px rgba(0, 82, 255, 0.3)',
      transition: 'all 0.3s ease',
    },
  };

  // Load and play background music
  useEffect(() => {
    // Create audio element for background music
    const bgMusic = new Audio('/music/bg.mp3');
    bgMusic.loop = true;
    
        // Ensure volume is set to 50%
    bgMusic.volume = 0.5; // 50% volume
    console.log('Initial background music volume set to:', bgMusic.volume);

    // Store in ref for later access
    backgroundMusicRef.current = bgMusic;

    // Play the music when component mounts
    bgMusic.play().catch(error => {
      console.warn('Failed to autoplay background music:', error);
      // Most browsers require user interaction before playing audio
    });
    
    // Cleanup function to stop music when component unmounts
    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.src = '';
        backgroundMusicRef.current = null;
      }
    };
  }, []);

  // Load game when component mounts
  useEffect(() => {
    console.log('Base Block component mounted with new instance');
    
    // ALWAYS clean up old scripts on mount (before guard check)
    const cleanupOldScripts = () => {
      const existingScripts = document.querySelectorAll('script:not([src])');
      let removedCount = 0;
      existingScripts.forEach(script => {
        if (script.textContent && (
          script.textContent.includes('class Game {') ||
          script.textContent.includes('class TowerBlock') ||
          script.textContent.includes('class Stage') ||
          script.textContent.includes('class Block')
        )) {
          try {
            script.parentNode?.removeChild(script);
            removedCount++;
          } catch (e) {
            console.warn('Could not remove script:', e);
          }
        }
      });
      if (removedCount > 0) {
        console.log(`🧹 Pre-mount cleanup: Removed ${removedCount} old game script(s)`);
      }
      
      // Also remove by ID
      const scriptsByID = document.querySelectorAll('script[id*="base-block-game-script"]');
      scriptsByID.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
          console.log('🧹 Removed script by ID:', script.id);
        }
      });
    };
    
    cleanupOldScripts();
    
    // Small delay to ensure cleanup completes before initialization
    setTimeout(() => {
      console.log('✅ Cleanup complete, starting game initialization...');
      setGameStarted(true);
      initGame();
    }, 50);
    
    // Cleanup function when component unmounts
    return () => {
      console.log('🧹 Component unmounting, cleaning up ALL resources');
      
      // Clean up global functions
      delete (window as any).handleGameOver;
      delete (window as any).updateScore;
      delete (window as any).playAgainGame;
      delete (window as any).emergencyRestartGame;
      delete (window as any).BASE_BLOCK_GAME_OVER;
      delete (window as any).BASE_BLOCK_SCORE;
      
      // Remove Three.js script
      const threejsScript = document.getElementById('threejs-script');
      if (threejsScript && threejsScript.parentNode) {
        console.log('Removing Three.js script');
        threejsScript.parentNode.removeChild(threejsScript);
      }
      
      // Remove ALL game scripts that might contain our game code
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (
          (script.id && script.id.includes('base-block-game-script')) ||
          (!script.src && script.textContent && (
            script.textContent.includes('class Game {') || 
            script.textContent.includes('class TowerBlock') ||
            script.textContent.includes('class Stage')
          ))
        ) {
          console.log('Removing game script:', script.id || 'unnamed script');
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        }
      });
      
      // Remove style element
      const styleElement = document.getElementById('base-block-style');
      if (styleElement && styleElement.parentNode) {
        console.log('Removing style element');
        styleElement.parentNode.removeChild(styleElement);
      }
      
      // Clear game container - capture ref value in cleanup scope
      const containerToClean = gameContainerRef.current;
      if (containerToClean) {
        console.log('Clearing game container');
        containerToClean.innerHTML = '';
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Type assertion to help with React's style types
  type CSSProperties = React.CSSProperties;

  return (
    <div style={styles.container as CSSProperties} data-base-block-component="true">
      
      {/* Mute button for background music */}
      <button
        onClick={toggleMute}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '2px solid #0052FF',
          background: 'white',
          color: '#0052FF',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 82, 255, 0.2)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#0052FF';
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 82, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.color = '#0052FF';
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 82, 255, 0.2)';
        }}
        title={isMuted ? 'Unmute music' : 'Mute music'}
      >
        <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
      </button>
      
      <div 
        id="base-block-wrapper"
        ref={gameContainerRef} 
        style={styles.gameContainer as CSSProperties}
      />
      
      {/* Blockchain Status Indicator - During Gameplay */}
      {blockchainStatus === 'saving' && !gameOver && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#FEF3C7',
          border: '2px solid #F59E0B',
          borderRadius: '12px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
        }}>
          <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#F59E0B', fontSize: '16px' }} />
          <span style={{ color: '#92400E', fontWeight: '600', fontSize: '14px' }}>
            Saving to blockchain...
          </span>
        </div>
      )}
      
      {showGiftBox && (
        <GiftBox 
          onClose={() => setShowGiftBox(false)}
          onClaimComplete={() => {
            setShowGiftBox(false);
          }}
        />
      )}
      
      {gameOver && (
        <>
          {/* Back to Games Button - Top Left - Base themed */}
          <button
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              zIndex: 2100,
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#0052FF',
              backgroundColor: 'white',
              border: '2px solid #0052FF',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              pointerEvents: 'auto',
              boxShadow: '0 4px 12px rgba(0, 82, 255, 0.15)',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            } as CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0052FF';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 82, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#0052FF';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 82, 255, 0.15)';
            }}
            onClick={() => window.location.reload()}
          >
            ← Back
          </button>
          
          {/* Game Over Content - Base themed */}
        <div style={styles.overlay as CSSProperties}>
          <div style={{
            background: 'white',
            padding: '48px',
            borderRadius: '24px',
            border: '2px solid #0052FF',
            boxShadow: '0 20px 60px rgba(0, 82, 255, 0.2), 0 0 80px rgba(0, 82, 255, 0.1)',
            textAlign: 'center',
            width: '90%',
            maxWidth: '480px',
            position: 'relative' as const,
          }}>
            {/* Base logo pulse animation */}
            <div style={{
              position: 'absolute' as const,
              top: '-30px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#0052FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0, 82, 255, 0.4)',
              animation: 'basePulse 2s ease-in-out infinite',
            }}>
              <img src="/images/base.png" alt="Base Logo" style={{ width: '32px', height: '32px' }} />
            </div>
            
            <h2 style={{ 
              fontSize: '32px', 
              margin: '20px 0 10px 0',
              color: '#0052FF',
              fontWeight: '700',
              fontFamily: "'Inter', 'Poppins', sans-serif",
            }}>Game Over</h2>
            
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              margin: '0 0 30px 0',
              fontWeight: '500',
            }}>but on Base, we never fall 😉</p>
            
            <div style={{
              backgroundColor: '#F5F7FA',
              borderRadius: '16px',
              padding: '24px',
              margin: '20px 0'
            }}>
              <p style={{ fontSize: '12px', margin: '0 0 8px 0', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Final Score</p>
              <p style={{ fontSize: '56px', margin: '0', fontWeight: '700', color: '#0052FF' }}>{score}</p>
            </div>
            
            {/* Blockchain Status Indicator */}
            {blockchainStatus !== 'idle' && showBlockchainStatus && (
              <div style={{
                backgroundColor: blockchainStatus === 'success' ? '#DBEAFE' : blockchainStatus === 'error' ? '#FEF3C7' : '#FEF3C7',
                borderRadius: '12px',
                padding: '16px',
                margin: '16px 0',
                border: `2px solid ${blockchainStatus === 'success' ? '#0052FF' : '#F59E0B'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  {blockchainStatus === 'saving' && (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#F59E0B', fontSize: '18px' }} />
                      <span style={{ color: '#92400E', fontWeight: '600', fontSize: '14px' }}>
                        Saving score to blockchain...
                      </span>
                    </>
                  )}
                  {blockchainStatus === 'success' && (
                    <>
                      <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#0052FF', fontSize: '18px' }} />
                      <span style={{ color: '#1E40AF', fontWeight: '600', fontSize: '14px' }}>
                        Score saved to blockchain! 🎉
                      </span>
                    </>
                  )}
                  {blockchainStatus === 'error' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#F59E0B', fontSize: '18px' }} />
                        <span style={{ color: '#92400E', fontWeight: '600', fontSize: '14px' }}>
                          {blockchainError || 'Failed to save to blockchain'}
                        </span>
                      </div>
                      <button
                        onClick={retryBlockchainSave}
                        style={{
                          background: '#F59E0B',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#D97706';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#F59E0B';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        Retry Save
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Dismiss button for error state */}
                {blockchainStatus === 'error' && (
                  <button
                    onClick={() => setShowBlockchainStatus(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#92400E',
                      fontSize: '16px',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(146, 64, 14, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title="Dismiss"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
            
            {bestScore > 0 && (
              <div style={{ 
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: score > previousBestScore ? '#DBEAFE' : '#F5F7FA',
                borderRadius: '12px',
                border: `2px solid ${score > previousBestScore ? '#0052FF' : '#E5E7EB'}`,
              }}>
                {score > previousBestScore && previousBestScore > 0 ? (
                  <>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#0052FF', marginBottom: '4px' }}>🎉 NEW HIGH SCORE!</div>
                    <div style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>
                      +{Math.round(((score - previousBestScore) / previousBestScore) * 100)}% improvement
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '16px', color: '#6B7280', fontWeight: '600' }}>Best Score: {bestScore}</div>
                )}
              </div>
            )}
            
            {/* Share Score Button */}
            <button 
              style={{
                background: 'white',
                padding: '16px 28px',
                fontSize: '16px',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '280px',
                marginTop: '8px',
                marginBottom: '12px',
                fontWeight: '600',
                color: '#0052FF',
                border: '2px solid #0052FF',
                boxShadow: '0 4px 16px rgba(0, 82, 255, 0.15)',
                fontFamily: "'Inter', 'Poppins', sans-serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
              onClick={async () => {
                try {
                  // Get player data
                  const playerData = getPlayerData(context);
                  
                  // Create hyped text with emojis and excitement
                  const improvementText = score > previousBestScore && previousBestScore > 0 
                    ? `\n\n🔥 CRUSHED my previous record by +${Math.round(((score - previousBestScore) / previousBestScore) * 100)}%! 🚀`
                    : '';
                  
                  const shareText = `Just stacked ${score} blocks in Base Block! ${score > 10 ? '🤯' : '💪'}${improvementText}\n\nThink you can beat me? Try it yourself! 👇`;
                  
                  // Create share URL
                  const shareUrl = `${APP_URL}`;
                  
                  // Use Farcaster composeCast if available
                  // if (context?.actions?.composeCast) {
                    await actions?.composeCast({
                      text: shareText,
                      embeds: [shareUrl],
                    });
                  // }
                } catch (error) {
                  console.error('Error sharing score:', error);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0052FF';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 82, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#0052FF';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 82, 255, 0.15)';
              }}
            >
              <FontAwesomeIcon icon={faShare} style={{ marginRight: '10px' }} />
              Share My Score
            </button>
            
            {/* Play Again Button */}
            <button 
              style={{
                ...styles.button,
                background: '#0052FF',
                padding: '16px 48px',
                fontSize: '18px',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '280px',
                marginTop: '8px',
                fontWeight: '600',
                boxShadow: '0 4px 16px rgba(0, 82, 255, 0.3)',
                fontFamily: "'Inter', 'Poppins', sans-serif",
              }} 
              onClick={handlePlayAgain}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 82, 255, 0.4)';
                e.currentTarget.style.backgroundColor = '#0041CC';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 82, 255, 0.3)';
                e.currentTarget.style.backgroundColor = '#0052FF';
              }}
            >
              <FontAwesomeIcon icon={faRedo} style={{ marginRight: '10px' }} />
              Play Again
            </button>
            
            {/* Base branding footer */}
            
          </div>
          
          {/* Add keyframe animation for pulse */}
          <style>{`
            @keyframes basePulse {
              0%, 100% {
                transform: translateX(-50%) scale(1);
                box-shadow: 0 4px 20px rgba(0, 82, 255, 0.4);
              }
              50% {
                transform: translateX(-50%) scale(1.1);
                box-shadow: 0 4px 30px rgba(0, 82, 255, 0.6);
              }
            }
          `}</style>
        </div>
        </>
      )}
    </div>
  );
}
