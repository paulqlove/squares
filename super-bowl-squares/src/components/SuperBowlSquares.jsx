import React, { useState, useMemo, useEffect } from 'react';
import { Shuffle, DollarSign, Share2 } from 'lucide-react';
import { database } from '../firebase';
import { ref, onValue, set, update } from 'firebase/database';
import PropTypes from 'prop-types';

const SuperBowlSquares = () => {
  const [homeTeam, setHomeTeam] = useState('Home Team');
  const [awayTeam, setAwayTeam] = useState('Away Team');
  const [selectedSquares, setSelectedSquares] = useState({});
  const [playerName, setPlayerName] = useState('');
  const [homeNumbers, setHomeNumbers] = useState(Array(10).fill(null));
  const [awayNumbers, setAwayNumbers] = useState(Array(10).fill(null));
  const [isRandomized, setIsRandomized] = useState(false);
  const [pricePerSquare, setPricePerSquare] = useState(5);
  const [scores, setScores] = useState({
    q1: { home: '', away: '' },
    q2: { home: '', away: '' },
    q3: { home: '', away: '' },
    q4: { home: '', away: '' }
  });

  const [gameId, setGameId] = useState(() => {
  const pathParts = window.location.pathname.split('/');
  return pathParts[pathParts.length - 1] || 'default-game';
});

// Firebase real-time sync
  useEffect(() => {
  const gameRef = ref(database, `games/default-game`);

  const unsubscribe = onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      setSelectedSquares(data.squares || {});
      setHomeNumbers(data.homeNumbers || Array(10).fill(null));
      setAwayNumbers(data.awayNumbers || Array(10).fill(null));
      setIsRandomized(data.isRandomized || false);
      setHomeTeam(data.homeTeam || 'Home Team');
      setAwayTeam(data.awayTeam || 'Away Team');
      // setPricePerSquare(data.pricePerSquare || 5);
       if (data.pricePerSquare !== undefined && data.pricePerSquare !== pricePerSquare) {
        setPricePerSquare(data.pricePerSquare);
      }
      setScores({
        q1: { home: '', away: '' },
        q2: { home: '', away: '' },
        q3: { home: '', away: '' },
        q4: { home: '', away: '' },
        ...data.scores // Override default values with Firebase data
      });
    }
  });

  return () => unsubscribe();
}, [gameId,pricePerSquare]);



  const payoutPercentages = {
    q1: 0.20,
    q2: 0.20,
    q3: 0.20,
    q4: 0.40
  };


  const playerColors = useMemo(() => {
    const colorPalette = [
      'bg-blue-200 hover:bg-blue-300',
      'bg-green-200 hover:bg-green-300',
      'bg-yellow-200 hover:bg-yellow-300',
      'bg-red-200 hover:bg-red-300',
      'bg-purple-200 hover:bg-purple-300',
      'bg-orange-200 hover:bg-orange-300',
      'bg-teal-200 hover:bg-teal-300',
      'bg-pink-200 hover:bg-pink-300'
    ];
    
    const uniquePlayers = [...new Set(Object.values(selectedSquares))];
    const playerColorMap = {};
    
    uniquePlayers.forEach((player, index) => {
      playerColorMap[player] = colorPalette[index % colorPalette.length];
    });
    
    return playerColorMap;
  }, [selectedSquares]);

  //change handlePriceChange
  const handlePriceChange = (value) => {
  setPricePerSquare(Number(value));
  
  //  update the price in Firebase
  update(ref(database, `games/${gameId}`), {
    pricePerSquare: Number(value)
  });
};

  // Change handleSquareClick
const handleSquareClick = async (row, col) => {
  if (!playerName) {
    alert('Please enter your name before selecting squares');
    return;
  }
  
  const squareKey = `${row}-${col}`;
  if (selectedSquares[squareKey]) {
    if (selectedSquares[squareKey] !== playerName) {
      alert('This square has already been selected by another player');
      return;
    }
    const newSquares = { ...selectedSquares };
    delete newSquares[squareKey];
    await set(ref(database, `games/${gameId}/squares`), newSquares);
  } else {
    await update(ref(database, `games/${gameId}/squares`), {
      [squareKey]: playerName
    });
  }
};



// Change handleScoreChange
const handleScoreChange = async (quarter, team, value) => {
    
  setScores(prev => ({
    ...prev,
    [quarter]: {
      ...prev[quarter],
      [team]: value
    }
  }));

  await update(ref(database, `games/${gameId}/scores/${quarter}`), {
    [team]: value
  });
};

    const shuffleNumbers = async () => {
    const totalSquares = Object.keys(selectedSquares).length;
    const emptySquares = 100 - totalSquares;
    
    if (emptySquares > 0) {
      const userConfirmed = window.confirm(
        `There are still ${emptySquares} empty squares remaining. Are you sure you want to assign numbers now? This action cannot be undone.`
      );
      if (!userConfirmed) {
        return;
      }
    }

    const numbers = Array.from({ length: 10 }, (_, i) => i);
    const shuffleArray = (array) => {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    };
    
    const homeNums = shuffleArray([...numbers]);
    const awayNums = shuffleArray([...numbers]);
    
    await update(ref(database, `games/${gameId}`), {
      homeNumbers: homeNums,
      awayNumbers: awayNums,
      isRandomized: true
    });
  };


  
  const createNewGame = async () => {
  const newGameId = Math.random().toString(36).substr(2, 9);
  await set(ref(database, `games/${newGameId}`), {
    createdAt: Date.now(),
    homeTeam: 'Home Team',
    awayTeam: 'Away Team',
    pricePerSquare: 5,
    squares: {},
    homeNumbers: Array(10).fill(null),
    awayNumbers: Array(10).fill(null),
    isRandomized: false,
    scores: {
      q1: { home: '', away: '' },
      q2: { home: '', away: '' },
      q3: { home: '', away: '' },
      q4: { home: '', away: '' }
    }
  });
  
  window.history.pushState({}, '', `/${newGameId}`);
  setGameId(newGameId);
  return newGameId;
};


// const ShareGame = () => (
//   <div className="mb-6 flex flex-col items-center gap-4">
//     <button
//       onClick={createNewGame}
//       className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
//     >
//       <Share2 size={16} />
//       Create New Shareable Game
//     </button>
//     {gameId !== 'default-game' && (
//       <div className="w-full max-w-xl">
//         <p className="text-sm text-gray-600 mb-1">Share this link with others:</p>
//         <input
//           type="text"
//           readOnly
//           value={`${window.location.origin}/${gameId}`}
//           className="border p-2 rounded w-full bg-gray-50"
//           onClick={e => e.target.select()}
//         />
//       </div>
//     )}
//   </div>
// );

  const winners = useMemo(() => {
    const getWinner = (homeScore, awayScore) => {
      if (!homeScore || !awayScore || !isRandomized) return null;
      const homeLastDigit = homeScore % 10;
      const awayLastDigit = awayScore % 10;
      
      const winningSquare = Object.entries(selectedSquares).find(([key]) => {
        const [row, col] = key.split('-').map(Number);
        return awayNumbers[row] === awayLastDigit && homeNumbers[col] === homeLastDigit;
      });
      
      return winningSquare ? winningSquare[1] : 'Empty Square';
    };

    return {
      q1: getWinner(Number(scores.q1.home), Number(scores.q1.away)),
      q2: getWinner(Number(scores.q2.home), Number(scores.q2.away)),
      q3: getWinner(Number(scores.q3.home), Number(scores.q3.away)),
      q4: getWinner(Number(scores.q4.home), Number(scores.q4.away))
    };
  }, [scores, selectedSquares, homeNumbers, awayNumbers, isRandomized]);

  const playerStats = useMemo(() => {
    const stats = {};
    Object.values(selectedSquares).forEach(player => {
      if (!stats[player]) {
        stats[player] = {
          squareCount: 1,
          totalSpent: pricePerSquare
        };
      } else {
        stats[player].squareCount++;
        stats[player].totalSpent = stats[player].squareCount * pricePerSquare;
      }
    });
    return stats;
  }, [selectedSquares, pricePerSquare]);

  const totalPot = useMemo(() => {
    return Object.keys(selectedSquares).length * pricePerSquare;
  }, [selectedSquares, pricePerSquare]);

  const quarterPayouts = useMemo(() => {
    const payouts = {};
    Object.entries(winners).forEach(([quarter, winner]) => {
      if (winner && winner !== 'Empty Square') {
        payouts[quarter] = {
          winner,
          amount: totalPot * payoutPercentages[quarter]
        };
      }
    });
    return payouts;
  }, [winners, totalPot, payoutPercentages]);

  const ScoreInput = ({ quarter, label }) => (
    <div className="flex items-center gap-2 mb-2">
      <span className="w-24">{label}:</span>
      <input
        type="number"
        min="0"
        max="9"
        value={scores[quarter].home}
        onChange={(e) => handleScoreChange(quarter, 'home', e.target.value)}
        className="border p-1 w-16 text-center"
        placeholder="0"
      />
      <span>-</span>
      <input
        type="number"
        min="0"
        max="9"
        value={scores[quarter].away}
        onChange={(e) => handleScoreChange(quarter, 'away', e.target.value)}
        className="border p-1 w-16 text-center"
        placeholder="0"
      />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Gamblers Autonomous Square Game</h2>
      
      <div className="mb-6 flex flex-col items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
          <input
            type="text"
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            className="border p-2 rounded flex-1"
            placeholder="Home Team"
          />
          <input
            type="text"
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            className="border p-2 rounded flex-1"
            placeholder="Away Team"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full max-w-2xl">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="border p-2 rounded w-full sm:w-auto"
            placeholder="Enter your name"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <DollarSign size={16} />
            <input
              type="number"
              value={pricePerSquare}
              // onChange={(e) => setPricePerSquare(Number(e.target.value))}
               onChange={(e) => handlePriceChange(e.target.value)}
              className="border p-2 rounded w-20"
              min="1"
              placeholder="Price"
            />
            <span className="text-sm text-gray-600 whitespace-nowrap">per square</span>
          </div>
          <button 
            onClick={shuffleNumbers}
            disabled={isRandomized}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded text-white w-full sm:w-auto
              ${isRandomized 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            <Shuffle size={16} />
            Randomize Numbers
          </button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="relative">
          <div className="pt-8 pl-8">
            <div className="flex">
              <div className="w-8 h-8 sm:w-12 sm:h-12"></div>
              {homeNumbers.map((num, index) => (
                <div key={`top-${index}`} className="w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 flex items-center justify-center bg-gray-100 text-gray-900 text-sm sm:text-base">
                  {num !== null ? num : ''}
                </div>
              ))}
            </div>
            
            {Array(10).fill(null).map((_, rowIdx) => (
              <div key={`row-${rowIdx}`} className="flex">
                <div className="w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 flex items-center justify-center bg-gray-100 text-gray-900 text-sm sm:text-base">
                  {awayNumbers[rowIdx] !== null ? awayNumbers[rowIdx] : ''}
                </div>
                
                {Array(10).fill(null).map((_, colIdx) => {
                  const squareKey = `${rowIdx}-${colIdx}`;
                  const selectedPlayer = selectedSquares[squareKey];
                  const playerColor = selectedPlayer ? playerColors[selectedPlayer] : '';
                  return (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      className={`w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 text-gray-900 flex items-center justify-center cursor-pointer text-[8px] sm:text-xs p-1 text-center 
                        ${playerColor || 'hover:bg-blue-50'} truncate overflow-hidden whitespace-nowrap`}
                      onClick={() => handleSquareClick(rowIdx, colIdx)}
                    >
                      {selectedPlayer}
                    </div>
                  );
                })}
              </div>
            ))}

            <div className="absolute top-8 left-0 h-full flex items-center">
              <div className="transform -rotate-90 origin-top-left whitespace-nowrap -translate-y-8">
                {awayTeam}
              </div>
            </div>
            <div className="absolute top-0 left-8 w-full text-center">
              {homeTeam}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3">Players</h3>
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="text-xl font-bold mb-2">
                Total Pot: ${totalPot}
              </div>
              <div className="space-y-2">
                {Object.entries(playerStats).map(([player, stats]) => (
                  <div 
                    key={player}
                    className={`p-2 rounded flex justify-between items-center ${playerColors[player] || 'bg-gray-100 text-gray-900'}`}
                  >
                    <span className="font-medium text-gray-900">{player}</span>
                    <div className="text-right">
                      <div className="text-gray-900 font-medium">{stats.squareCount} squares</div>
                      <div className="text-sm text-gray-600">${stats.totalSpent}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3">Score Input</h3>
            <ScoreInput quarter="q1" label="1st Quarter" />
            <ScoreInput quarter="q2" label="2nd Quarter" />
            <ScoreInput quarter="q3" label="3rd Quarter" />
            <ScoreInput quarter="q4" label="Final Score" />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold mb-3">Winners & Payouts</h3>
            <div className="space-y-2">
              {Object.entries(winners).map(([quarter, winner]) => {
                const payout = quarterPayouts[quarter];
                const payoutAmount = payout ? payout.amount : totalPot * payoutPercentages[quarter];
                return (
                  <div key={quarter} className="flex items-center gap-2">
                    <span className="w-24">
                      {quarter === 'q1' ? '1st Quarter' :
                       quarter === 'q2' ? '2nd Quarter' :
                       quarter === 'q3' ? '3rd Quarter' :
                       'Final Score'}:
                    </span>
                    <span className={`px-2 py-1 rounded flex-1 text-gray-900 ${winner ? playerColors[winner] || 'bg-gray-200' : 'bg-gray-200'}`}>
                      {winner || 'Pending'}
                    </span>
                    <span className="text-right min-w-[100px]">
                      ${payoutAmount.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Payouts: 20% for each quarter, 40% for final score
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperBowlSquares;