import React, { useEffect, useRef } from 'react';
import useGameStore from './store/gameStore';
import { HeartPulse, Brain, Trophy, Coffee, Users, Coins } from 'lucide-react';
import DutyList from './components/DutyList';
import PhoneOverlay from './components/PhoneOverlay';
import MiniGameModal from './components/MiniGameModal';
import { generateDuty, generatePhoneCallEvent, generateProfessorRound, generateCPREvent, generateCoworkerRequestEvent } from './utils/dutyGenerator';

const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

function App() {
  const {
    time, stamina, mental, reputation, wallet,
    tick, isResting, toggleRest, useSos, gameOver, gameOverReason, dayComplete,
    activeEvent, triggerEvent, activeMiniGame, duties, addDuty, modifyStamina, modifyMental, modifyWallet,
    isShiftEnding, finishDay
  } = useGameStore();

  const [snackActive, setSnackActive] = React.useState(false);
  const [coinActive, setCoinActive] = React.useState(false);
  const tickRef = useRef(tick);
  tickRef.current = tick;

  // Master game loop
  useEffect(() => {
    // Prepopulate initial duties when game starts
    if (time === 8 * 60 && duties.length === 0) {
      addDuty(generateDuty());
      addDuty(generateDuty('BLOOD_DRAW'));
    }

    const timer = setInterval(() => {
      tickRef.current();

      const currentState = useGameStore.getState();

      // Random Event Spawner
      if (!currentState.activeEvent && !currentState.gameOver && !currentState.dayComplete && !currentState.isShiftEnding) {
        const rand = Math.random();
        const isLunchTime = time >= 12 * 60 && time <= 13 * 60;
        const isCprRunning = currentState.activeMiniGame?.type?.id === 'CPR' || currentState.activeMiniGame?.type === 'CPR';

        // Base probabilities slightly reduced for better pacing
        let callProb = isLunchTime ? 0.03 : 0.05;
        let cprProb = 0.015;
        let profProb = isLunchTime ? 0.02 : 0.01;
        let coworkerProb = isLunchTime ? 0.02 : 0.015;

        // Silence during CPR: CPR focus is intense
        if (isCprRunning) {
          callProb = 0.005; // Almost no calls during CPR
          cprProb = 0;      // No duplicate CPR
          profProb = 0;     // Professor won't disturb during life-saving
          coworkerProb = 0;
        }

        // Silence professor and CPR during CT keep
        const isCtKeepRunning = currentState.activeMiniGame?.type?.id === 'CT_KEEP';
        if (isCtKeepRunning) {
          profProb = 0;
          cprProb = 0; // Prevent CPR when looking at CT keeps
        }

        if (rand < callProb) {
          const newDuty = generateDuty();
          triggerEvent(generatePhoneCallEvent(newDuty));
        } else if (rand > (1 - cprProb) && !isCprRunning && !isCtKeepRunning) {
          triggerEvent(generateCPREvent());
        } else if (rand > (1 - cprProb - profProb) && currentState.activeMiniGame && currentState.activeMiniGame.type?.id !== 'CPR' && !isCtKeepRunning) {
          triggerEvent(generateProfessorRound());
        } else if (rand > (1 - cprProb - profProb - coworkerProb)) {
          triggerEvent(generateCoworkerRequestEvent());
        } else if (rand > 0.940 && !snackActive) {
          setSnackActive(true);
          setTimeout(() => setSnackActive(false), 6000);
        } else if (rand > 0.920 && !coinActive && !currentState.isResting) {
          // Found some money on the ground!
          setCoinActive(true);
          setTimeout(() => setCoinActive(false), 5000);
        }
      }

      // Check forced game over condition: Reputation hits 0
      if (currentState.reputation <= 0 && !currentState.gameOver) {
        useGameStore.setState({ gameOver: true, gameOverReason: '동료와 간호사들에게 완벽히 손절당했습니다. 평판 바닥으로 인한 강제 퇴출입니다.' });
      }

      // Check forced game over condition: Mental hits 0
      if (currentState.mental <= 0 && !currentState.gameOver) {
        useGameStore.setState({ gameOver: true, gameOverReason: '멘탈이 완전히 붕괴되었습니다. 더 이상 버티지 못하고 하얀 가운을 벗어던진 채 병원 문을 박차고 나갔습니다. (도망턴 발생)' });
      }

    }, 500); // 0.5 real second = 1 game minute (Total 5 mins for 10 hours)
    return () => clearInterval(timer);
  }, [triggerEvent, time, duties.length, addDuty, snackActive, coinActive]);

  const handleSnackClick = () => {
    modifyStamina(25);
    modifyMental(10, '달콤한 간식으로 에너지를 충전했습니다!');
    setSnackActive(false);
  };

  const handleCoinClick = () => {
    const amount = 500; // Fixed 500 won
    modifyWallet(amount);
    setCoinActive(false);
  };

  if (gameOver) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#7f1d1d', color: 'white' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>GAME OVER</h1>
        <img src="grade_f_doctor_1772631419798.png" alt="Tired Intern" style={{ height: '200px', marginBottom: '20px', borderRadius: '15px' }} />
        <p style={{ fontSize: '1.2rem', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '10px', maxWidth: '80%' }}>{gameOverReason}</p>
        <button className="btn btn-outline" style={{ borderColor: 'white', color: 'white', marginTop: '30px', padding: '10px 20px', borderRadius: '15px' }} onClick={() => window.location.reload()}>다시 시작</button>
      </div>
    );
  }

  if (dayComplete) {
    const { completedDutiesCount } = useGameStore.getState();
    const totalScore = reputation + (completedDutiesCount * 3); // Slightly more weight to duties

    const getGrade = (score) => {
      if (score >= 150) return { grade: 'S', color: '#fcd34d', label: '전설의 인턴', img: 'grade_s_doctor_1772631371625.png' };
      if (score >= 120) return { grade: 'A', color: '#60a5fa', label: '에이스 인턴', img: 'grade_a_doctor_1772631387677.png' };
      if (score >= 90) return { grade: 'B', color: '#34d399', label: '성실한 인턴', img: 'grade_a_doctor_1772631387677.png' };
      if (score >= 60) return { grade: 'C', color: '#fbbf24', label: '보통의 인턴', img: 'grade_c_doctor_1772631405265.png' };
      if (score >= 30) return { grade: 'D', color: '#f87171', label: '위태로운 인턴', img: 'grade_c_doctor_1772631405265.png' };
      return { grade: 'F', color: '#ef4444', label: '자퇴 권고', img: 'grade_f_doctor_1772631419798.png' };
    };

    const result = getGrade(totalScore);

    return (
      <div className="app-container result-screen" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#064e3b', color: 'white', padding: '20px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '5px' }}>퇴근 성공!</h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '20px', opacity: 0.9 }}>고생하셨습니다. 오늘의 업무 평가입니다.</p>

        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '25px', borderRadius: '25px', textAlign: 'center', color: 'black', backgroundColor: 'rgba(255,255,255,0.98)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
          <img src={result.img} alt="Grade Image" style={{ width: '150px', height: '150px', borderRadius: '50%', marginBottom: '15px', border: `5px solid ${result.color}`, objectFit: 'cover' }} />

          <div style={{ fontSize: '4.5rem', fontWeight: 'bold', color: result.color, lineHeight: '1', marginBottom: '5px' }}>
            {result.grade}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937' }}>
            {result.label}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'left', marginBottom: '15px' }}>
            <div style={{ padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>최종 평판</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{Math.floor(reputation)}점</div>
            </div>
            <div style={{ padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>업무 완수</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#059669' }}>{completedDutiesCount}건</div>
            </div>
            <div style={{ padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>남은 체력</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#dc2626' }}>{Math.floor(stamina)}%</div>
            </div>
            <div style={{ padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>남은 잔액</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#b45309' }}>{wallet.toLocaleString()}원</div>
            </div>
            <div style={{ padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>남은 멘탈</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2563eb' }}>{Math.floor(mental)}%</div>
            </div>
          </div>

          <div style={{ borderTop: '2px dashed #e5e7eb', paddingTop: '10px' }}>
            <span style={{ fontSize: '1rem', color: '#6b7280' }}>총합 점수: </span>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#111827' }}>{Math.floor(totalScore)}점</span>
          </div>
        </div>

        <button className="btn btn-primary" style={{ marginTop: '15px', width: '100%', maxWidth: '300px', padding: '10px 15px', borderRadius: '15px', fontSize: '1.1rem', boxShadow: '0 4px 14px 0 rgba(0,0,0,0.39)' }} onClick={() => window.location.reload()}>새로운 아침 맞이하기</button>
      </div>
    );
  }

  return (
    <div className={`app-container ${isResting ? '' : ''}`} style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.9)), url("hospital_ward_bg_1772544979145.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Top Bar Stats */}
      <div className="top-bar glass-panel">
        <div className="time-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: time >= 18 * 60 ? 'var(--danger)' : 'var(--primary-color)' }}>{formatTime(time)}</span>
          <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>~ 18:00 퇴근</span>
          {time >= 12 * 60 && time < 13 * 60 && <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 'bold' }}>(점심시간)</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div className="stat-row">
            <HeartPulse size={16} className="text-success" />
            <span className="stat-label">체력</span>
            <div className="progress-bar-container">
              <div className={`progress-bar-fill fill-stamina ${isResting && stamina < 100 ? 'recovering' : ''}`} style={{ width: `${stamina}%` }}></div>
            </div>
          </div>

          <div className="stat-row">
            <Brain size={16} className="text-blue-500" />
            <span className="stat-label">멘탈</span>
            <div className="progress-bar-container">
              <div className={`progress-bar-fill fill-mental ${isResting && mental < 100 ? 'recovering' : ''}`} style={{ width: `${mental}%` }}></div>
            </div>
          </div>

          <div className="stat-row">
            <Trophy size={16} className="text-warning" />
            <span className="stat-label">평판</span>
            <div className="progress-bar-container">
              <div className="progress-bar-fill fill-reputation" style={{ width: `${reputation}%` }}></div>
            </div>
          </div>

          <div className="stat-row">
            <Coins size={16} style={{ color: '#b45309' }} />
            <span className="stat-label">지갑</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{wallet.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {/* Main Content Area: Duty List */}
      <div className="main-content">
        <h2 style={{ fontSize: '1.2rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '5px' }}>내 듀티 노트</h2>
        <DutyList />
      </div>

      {/* Bottom Actions */}
      <div className="bottom-actions glass-panel">
        <button
          className={`btn ${isResting ? 'btn-primary' : 'btn-outline'}`}
          onClick={toggleRest}
        >
          <Coffee size={20} />
          {isResting ? '쉬는 중...' : '휴식 / 식사'}
        </button>
        <button
          className="btn btn-danger"
          onClick={() => triggerEvent({ type: 'SOS_MENU' })}
          disabled={duties.length === 0}
          style={{ opacity: duties.length === 0 ? 0.5 : 1, cursor: duties.length === 0 ? 'not-allowed' : 'pointer' }}
        >
          <Users size={20} />
          동기 SOS
        </button>
      </div>

      {/* Floating Snack Interaction */}
      {snackActive && !gameOver && !dayComplete && !activeEvent && (
        <div
          onClick={handleSnackClick}
          className="vibrating"
          style={{
            position: 'absolute',
            top: '30%',
            right: '10%',
            zIndex: 40,
            cursor: 'pointer',
            animation: 'pulse 2s infinite'
          }}
        >
          <img src="snack_coffee_1772546862979.png" alt="Coffee and Snack" style={{ width: '80px', height: '80px', filter: 'drop-shadow(0px 10px 8px rgba(0,0,0,0.3))' }} />
        </div>
      )}

      {/* Floating Coin Interaction */}
      {coinActive && !gameOver && !dayComplete && !activeEvent && (
        <div
          onClick={handleCoinClick}
          className="vibrating"
          style={{
            position: 'absolute',
            top: '50%',
            left: '10%',
            zIndex: 40,
            cursor: 'pointer',
            animation: 'pulse 1s infinite'
          }}
        >
          <img src="korean_coin_won_1772632726173.png" alt="Found Coin" style={{ width: '60px', height: '60px', filter: 'drop-shadow(0px 5px 5px rgba(0,0,0,0.3))' }} />
        </div>
      )}

      {/* Overlays */}
      <MiniGameModal />
      <PhoneOverlay />

      {/* Shift Evaluation Modal */}
      {isShiftEnding && (
        <div className="overlay-screen" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '30px', borderRadius: '25px', textAlign: 'center', backgroundColor: 'white' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--danger)', marginBottom: '15px', fontWeight: 'bold' }}>🕒 18:00 퇴근 시간!</h2>
            <img src="intern_tired_1772544933334.png" alt="Tired" style={{ width: '120px', marginBottom: '20px', borderRadius: '50%' }} />
            <p style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#1f2937' }}>
              공식적인 일과 시간이 끝났습니다.<br />하지만 아직 <strong>{duties.length}개</strong>의 업무가 남았습니다.
            </p>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '25px' }}>
              그냥 퇴근하면 남은 일 하나당 평판이 <strong>15점</strong>씩 깎입니다.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={() => useGameStore.setState({ isShiftEnding: false })}
                style={{ height: '60px', fontSize: '1.1rem' }}
              >
                남은 일 다 하고 가기 (열정!)
              </button>
              <button
                className="btn btn-outline"
                onClick={() => finishDay()}
                style={{ height: '60px', fontSize: '1.1rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
              >
                미안하다, 나 퇴근한다.
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
