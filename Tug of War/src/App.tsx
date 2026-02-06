import { useState, useEffect, useRef } from 'react';
import { ref, onValue, runTransaction, push, update } from 'firebase/database';
import { db } from './firebase';
import './App.css';

interface Game {
  id: string;
  score: number;
  status: 'waiting' | 'playing' | 'ended';
  hostTeam: 'left' | 'right';
  createdAt: number;
}

function App() {
  const [view, setView] = useState<'lobby' | 'game'>('lobby');
  const [games, setGames] = useState<Game[]>([]);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const lastPressTime = useRef<number>(0);
  
  // Game State
  const [score, setScore] = useState<number>(0);
  const [myTeam, setMyTeam] = useState<'left' | 'right' | null>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'ended'>('waiting');
  
  // Lobby: Listen for available games
  useEffect(() => {
    if (view !== 'lobby') return;
    
    const gamesRef = ref(db, 'games');
    const unsubscribe = onValue(gamesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedGames: Game[] = [];
      if (data) {
        Object.entries(data).forEach(([key, val]: [string, any]) => {
          // Only show waiting games in lobby
          if (val.status === 'waiting') {
             loadedGames.push({
               id: key,
               ...val
             });
          }
        });
      }
      setGames(loadedGames.sort((a,b) => b.createdAt - a.createdAt));
    });

    return () => unsubscribe();
  }, [view]);

  // Game: Listen for specific game updates
  useEffect(() => {
    if (view !== 'game' || !currentGameId) return;

    const gameRef = ref(db, `games/${currentGameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      setScore(data.score);
      setGameStatus(data.status);

      // Check for win condition and update DB
      if (data.status === 'playing') {
        if (data.score >= 100 || data.score <= -100) {
          update(gameRef, { status: 'ended' });
        }
      }
    });

    return () => unsubscribe();
  }, [view, currentGameId]);

  // Input Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && view === 'game' && gameStatus === 'playing') {
        const now = Date.now();
        // Cooldown (10ms) and Anti-Hold check
        if (e.repeat || now - lastPressTime.current < 10) {
            e.preventDefault();
            return;
        }
        lastPressTime.current = now;

        e.preventDefault();
        const scoreRef = ref(db, `games/${currentGameId}/score`);
        runTransaction(scoreRef, (currentScore) => {
          if (currentScore === null) return 0;
          let newScore = currentScore;
          if (myTeam === 'left') newScore -= 1;
          if (myTeam === 'right') newScore += 1;
          
          // Limit score to -100 and 100
          if (newScore < -100) return -100;
          if (newScore > 100) return 100;

          return newScore;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, gameStatus, currentGameId, myTeam]);

  const createGame = (team: 'left' | 'right') => {
    const gamesRef = ref(db, 'games');
    push(gamesRef, {
      score: 0,
      status: 'waiting',
      hostTeam: team,
      createdAt: Date.now()
    }).then((newRef) => {
      setCurrentGameId(newRef.key);
      setMyTeam(team);
      setView('game');
    }).catch((error) => {
      console.error("Error creating game:", error);
      alert("Error creating game! Check console.");
    });
  };

  const joinGame = async (gameId: string, hostTeam: 'left' | 'right') => {
    const mySide = hostTeam === 'left' ? 'right' : 'left';
    
    // Update game status to playing
    const gameRef = ref(db, `games/${gameId}`);
    await update(gameRef, { status: 'playing' });

    setCurrentGameId(gameId);
    setMyTeam(mySide);
    setView('game');
  };

  const leaveGame = () => {
    setView('lobby');
    setCurrentGameId(null);
    setMyTeam(null);
    setScore(0);
  };

  return (
    <div className="container">
      <h1 className="cyber-title">CYBER TUG OF WAR</h1>

      {view === 'lobby' && (
        <div className="lobby-container">
           <div className="create-section">
             <h2>CREATE NEW BATTLE</h2>
             <div className="buttons">
               <button className="btn neons-red" onClick={() => createGame('left')}>HOST AS RED</button>
               <button className="btn neons-blue" onClick={() => createGame('right')}>HOST AS BLUE</button>
             </div>
           </div>

           <div className="games-list">
             <h2>ACTIVE BATTLES ({games.length})</h2>
             {games.length === 0 && <p className="no-games">NO ACTIVE SIGNALS. START A WAR.</p>}
             {games.map(game => (
               <div key={game.id} className="game-card">
                 <div className="game-info">
                   <span className={game.hostTeam === 'left' ? 'text-red' : 'text-blue'}>
                     HOST: {game.hostTeam.toUpperCase()}
                   </span>
                   <span className="vs">VS</span>
                   <span className="text-waiting">WAITING FOR {game.hostTeam === 'left' ? 'BLUE' : 'RED'}...</span>
                 </div>
                 <button 
                   className={`btn ${game.hostTeam === 'left' ? 'neons-blue' : 'neons-red'}`}
                   onClick={() => joinGame(game.id, game.hostTeam)}
                 >
                   JOIN & FIGHT
                 </button>
               </div>
             ))}
           </div>
        </div>
      )}

      {view === 'game' && (
        <div className="game-arena">
          <button className="btn-small neons-gold logout" onClick={leaveGame}>EXIT LOBBY</button>
          
          <div className="status-panel">
             <p>YOU ARE: <span className={myTeam === 'left' ? 'text-red' : 'text-blue'}>{myTeam?.toUpperCase()} TEAM</span></p>
             {gameStatus === 'waiting' && <p className="instruction blink">WAITING FOR OPPONENT...</p>}
             {gameStatus === 'playing' && <p className="instruction">MASH [SPACE] TO PULL!</p>}
          </div>

          <div className="progress-container">
            <div className="progress-bar-bg">
               <div 
                 className="progress-indicator" 
                 style={{ left: `${50 + (score / 2)}%` }} 
               ></div>
               <div className="center-line"></div>
            </div>
            <div className="score-display">
               <span className="text-red">RED</span>
               <span className="score-value">{score}</span>
               <span className="text-blue">BLUE</span>
            </div>
          </div>

          {gameStatus === 'ended' && (
             <div className="win-overlay">
                <h2 className="win-text">{score <= -100 ? 'RED' : 'BLUE'} TEAM WINS!</h2>
                <button className="btn neons-gold" onClick={leaveGame}>RETURN TO LOBBY</button>
             </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
