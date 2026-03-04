import React, { useEffect, useRef } from 'react';
import useGameStore from './store/gameStore';
import { HeartPulse, Brain, Trophy, Coffee, Users } from 'lucide-react';
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
    time, stamina, mental, reputation,
    tick, isResting, toggleRest, useSos, gameOver, gameOverReason, dayComplete,
    activeEvent, triggerEvent, activeMiniGame, duties, addDuty, modifyStamina, modifyMental
  } = useGameStore();

  const [snackActive, setSnackActive] = React.useState(false);
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
      if (!currentState.activeEvent && !currentState.gameOver && !currentState.dayComplete) {
        const rand = Math.random();
        const isLunchTime = time >= 12 * 60 && time <= 13 * 60;

        // Base probabilities modified by lunch time
        const callProb = isLunchTime ? 0.02 : 0.05; // Less calls during lunch
        const cprProb = 0.012; // Increased to ~1.2% per tick (every ~80 seconds on average)
        const profProb = isLunchTime ? 0.015 : 0.005; // Professor hits harder during lunch
        const coworkerProb = isLunchTime ? 0.02 : 0.01; // Coworkers ask for more help during lunch

        if (rand < callProb) {
          const newDuty = generateDuty();
          triggerEvent(generatePhoneCallEvent(newDuty));
        } else if (rand > (1 - cprProb) && currentState.activeMiniGame?.type?.id !== 'CT_KEEP') {
          triggerEvent(generateCPREvent());
        } else if (rand > (1 - cprProb - profProb) && currentState.activeMiniGame && currentState.activeMiniGame.type?.id !== 'CPR') {
          triggerEvent(generateProfessorRound());
        } else if (rand > (1 - cprProb - profProb - coworkerProb)) {
          triggerEvent(generateCoworkerRequestEvent());
        } else if (rand > 0.950 && !snackActive) {
          setSnackActive(true);
          setTimeout(() => setSnackActive(false), 8000); // Disappears after 8 seconds
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

    }, 1000); // 1 real second = 1 game minute
    return () => clearInterval(timer);
  }, [triggerEvent, time, duties.length, addDuty, snackActive]);

  const handleSnackClick = () => {
    modifyStamina(20);
    modifyMental(10, '달콤한 간식으로 에너지를 충전했습니다!');
    setSnackActive(false);
  };

  if (gameOver) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#7f1d1d', color: 'white' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>GAME OVER</h1>
        <img src="intern_tired_1772544933334.png" alt="Tired Intern" style={{ height: '200px', marginBottom: '20px', filter: 'grayscale(100%)' }} />
        <p style={{ fontSize: '1.2rem', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '10px' }}>{gameOverReason}</p>
        <button className="btn btn-outline" style={{ borderColor: 'white', color: 'white', marginTop: '30px' }} onClick={() => window.location.reload()}>다시 시작</button>
      </div>
    );
  }

  if (dayComplete) {
    const { completedDutiesCount } = useGameStore.getState();
    const totalScore = reputation + (completedDutiesCount * 2);

    const getGrade = (score) => {
      if (score >= 120) return { grade: 'S', color: '#fcd34d', label: '전설의 인턴' };
      if (score >= 100) return { grade: 'A', color: '#60a5fa', label: '에이스 인턴' };
      if (score >= 80) return { grade: 'B', color: '#34d399', label: '성실한 인턴' };
      if (score >= 60) return { grade: 'C', color: '#fbbf24', label: '보통의 인턴' };
      if (score >= 40) return { grade: 'D', color: '#f87171', label: '위태로운 인턴' };
      return { grade: 'F', color: '#ef4444', label: '자퇴 권고' };
    };

    const result = getGrade(totalScore);

    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#065f46', color: 'white' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>퇴근 시간!</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '20px', opacity: 0.9 }}>수고하셨습니다. 오늘의 업무 평가 결과입니다.</p>

        <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '30px', borderRadius: '20px', textAlign: 'center', color: 'black', backgroundColor: 'rgba(255,255,255,0.95)' }}>
          <div style={{ fontSize: '5rem', fontWeight: 'bold', color: result.color, lineHeight: '1', marginBottom: '10px', textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
            {result.grade}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '25px', color: '#1f2937' }}>
            {result.label}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', textAlign: 'left', marginBottom: '25px' }}>
            <div style={{ padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>최종 평판</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{reputation}점</div>
            </div>
            <div style={{ padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>완료한 업무</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#059669' }}>{completedDutiesCount}개</div>
            </div>
            <div style={{ padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>남은 체력</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#dc2626' }}>{stamina}%</div>
            </div>
            <div style={{ padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>남은 멘탈</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2563eb' }}>{mental}%</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>종합 점수: </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>{totalScore}점</span>
          </div>
        </div>

        <button className="btn btn-primary" style={{ marginTop: '30px', padding: '12px 40px', fontSize: '1.1rem' }} onClick={() => window.location.reload()}>새로운 아침 맞이하기</button>
      </div>
    );
  }

  return (
    <div className={`app-container ${isResting ? '' : ''}`} style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.9)), url("hospital_ward_bg_1772544979145.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Top Bar Stats */}
      <div className="top-bar glass-panel">
        <div className="time-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatTime(time)}</span>
          <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>~ 18:00 퇴근</span>
          {time >= 12 * 60 && time < 13 * 60 && <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 'bold' }}>(점심시간)</span>}
        </div>

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

      {/* Overlays */}
      <MiniGameModal />
      <PhoneOverlay />
    </div>
  );
}

export default App;
