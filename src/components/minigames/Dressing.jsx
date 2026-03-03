import React, { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const DressingGame = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    // 0: Remove old dressing
    // 1: Betadine swap (needs 3 wipes)
    // 2: Place new gauze
    // 3: Tape 4 corners

    const [wipes, setWipes] = useState(0);
    const [tapes, setTapes] = useState([false, false, false, false]);
    const [shaking, setShaking] = useState(false);

    const triggerShake = () => {
        setShaking(true);
        setTimeout(() => setShaking(false), 200);
    };

    const handleAction = (action) => {
        switch (step) {
            case 0:
                if (action === 'remove') setStep(1);
                break;
            case 1:
                if (action === 'wipe') {
                    const newWipes = wipes + 1;
                    setWipes(newWipes);
                    if (newWipes >= 3) setStep(2);
                }
                break;
            case 2:
                if (action === 'gauze') setStep(3);
                break;
            case 3:
                if (typeof action === 'number') {
                    const newTapes = [...tapes];
                    newTapes[action] = true;
                    setTapes(newTapes);

                    if (newTapes.every(t => t === true)) {
                        setTimeout(() => onComplete(true), 500); // Success!
                    }
                }
                break;
            default:
                break;
        }

        // Random chance 환자가 아프다고 움직임
        if (Math.random() > 0.7) {
            triggerShake();
        }
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '300px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--text-main)' }}>
                {step === 0 && '기존 드레싱을 떼어내세요'}
                {step === 1 && `베타딘으로 상처를 닦으세요 (${wipes}/3)`}
                {step === 2 && '새 거즈를 올리세요'}
                {step === 3 && '거즈 4방향에 테이프를 붙이세요!'}
            </h3>

            <div
                className={shaking ? 'damage-effect' : ''}
                style={{
                    width: '200px', height: '200px',
                    backgroundColor: '#fcd34d', // 스킨 컬러 토대
                    borderRadius: '10px',
                    position: 'relative',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    border: '2px dashed #fbbf24',
                    transition: 'transform 0.1s',
                    ...(shaking ? { transform: 'translate(5px, 5px)' } : {})
                }}
            >
                {/* The Wound */}
                <div style={{
                    width: '60px', height: '100px',
                    backgroundColor: '#ef4444',
                    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                    opacity: step > 1 ? 0.3 : 1 // 닦고 나면 조금 연해지거나 거즈에 가려짐
                }}></div>

                {/* Step 0: Old Dressing */}
                {step === 0 && (
                    <div
                        onClick={() => handleAction('remove')}
                        style={{
                            position: 'absolute', width: '120px', height: '140px',
                            backgroundColor: '#f3f4f6', border: '1px solid #d1d5db',
                            cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                    >
                        낡은 거즈 (클릭)
                    </div>
                )}

                {/* Step 1: Wiping */}
                {step === 1 && (
                    <button
                        className="btn btn-warning"
                        onClick={() => handleAction('wipe')}
                        style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
                    >
                        베타딘 스왑 (터치)
                    </button>
                )}

                {/* Step 2: New Gauze */}
                {step === 2 && (
                    <div
                        onClick={() => handleAction('gauze')}
                        style={{
                            position: 'absolute', width: '120px', height: '140px',
                            border: '2px dashed #9ca3af', color: '#1f2937', fontWeight: 'bold',
                            cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center',
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                    >
                        📋 새 거즈 덮기
                    </div>
                )}

                {/* Step 3: Taping */}
                {step >= 3 && (
                    <>
                        <div style={{ position: 'absolute', width: '120px', height: '140px', backgroundColor: 'white', border: '1px solid #e5e7eb' }}></div>
                        {/* Top Tape */}
                        <div onClick={() => handleAction(0)} style={{ position: 'absolute', top: '15px', width: '80px', height: '20px', backgroundColor: tapes[0] ? '#e5e7eb' : 'rgba(255,255,255,0.5)', border: tapes[0] ? 'none' : '2px dashed #9ca3af', cursor: 'pointer' }}></div>
                        {/* Bottom Tape */}
                        <div onClick={() => handleAction(1)} style={{ position: 'absolute', bottom: '15px', width: '80px', height: '20px', backgroundColor: tapes[1] ? '#e5e7eb' : 'rgba(255,255,255,0.5)', border: tapes[1] ? 'none' : '2px dashed #9ca3af', cursor: 'pointer' }}></div>
                        {/* Left Tape */}
                        <div onClick={() => handleAction(2)} style={{ position: 'absolute', left: '20px', width: '20px', height: '80px', backgroundColor: tapes[2] ? '#e5e7eb' : 'rgba(255,255,255,0.5)', border: tapes[2] ? 'none' : '2px dashed #9ca3af', cursor: 'pointer' }}></div>
                        {/* Right Tape */}
                        <div onClick={() => handleAction(3)} style={{ position: 'absolute', right: '20px', width: '20px', height: '80px', backgroundColor: tapes[3] ? '#e5e7eb' : 'rgba(255,255,255,0.5)', border: tapes[3] ? 'none' : '2px dashed #9ca3af', cursor: 'pointer' }}></div>
                    </>
                )}
            </div>

            {shaking && <div style={{ color: 'var(--danger)', marginTop: '20px', fontWeight: 'bold' }}><AlertCircle size={16} style={{ display: 'inline' }} /> "아얏! 살살 좀 해요!"</div>}
        </div>
    );
};

export default DressingGame;
