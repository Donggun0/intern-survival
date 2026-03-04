import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore';
import DressingGame from './minigames/Dressing';
import ConsentFormGame from './minigames/ConsentForm';
import EMROrderGame from './minigames/EMROrder';
import BloodDrawGame from './minigames/BloodDraw';
import ABGAGame from './minigames/ABGA';
import FoleyCatheterGame from './minigames/FoleyCatheter';
import { AlertTriangle } from 'lucide-react';

const MiniGameModal = () => {
    const { activeMiniGame, endMiniGame, completeDuty, modifyStamina, modifyMental, modifyReputation, time } = useGameStore();
    const [showAngryPatient, setShowAngryPatient] = useState(false);
    const [apologized, setApologized] = useState(false);
    const [patientImage, setPatientImage] = useState("");

    useEffect(() => {
        if (activeMiniGame) {
            setApologized(false);
            setPatientImage(Math.random() > 0.5 ? "patient_old_man_1772546877617.png" : "patient_young_woman_1772546896900.png");
        }
    }, [activeMiniGame?.id]);

    useEffect(() => {
        if (activeMiniGame && !apologized && (activeMiniGame.missedCall || (time - activeMiniGame.createdAt > 40))) {
            setShowAngryPatient(true);
        } else {
            setShowAngryPatient(false);
        }
    }, [activeMiniGame, time, apologized]);

    if (!activeMiniGame) return null;

    const handleComplete = (success) => {
        if (success) {
            if (activeMiniGame.id) completeDuty(activeMiniGame.id);
            modifyStamina(activeMiniGame.type ? -activeMiniGame.type.staminaCost : -10);
        } else {
            // Penalty already applied loosely, but we can do extra
        }
        endMiniGame();
    };

    const handleCancel = () => {
        modifyMental(-2, '작업을 중도 포기했습니다.');
        endMiniGame();
    };

    const renderGameContent = () => {
        const typeId = activeMiniGame.type?.id || activeMiniGame.type;

        switch (typeId) {
            case 'DRESSING':
                return <DressingGame onComplete={handleComplete} />;
            case 'CONSENT':
                return <ConsentFormGame onComplete={handleComplete} />;
            case 'EMR_ORDER':
                return <EMROrderGame onComplete={handleComplete} />;
            case 'BLOOD_DRAW':
                return <BloodDrawGame gameData={activeMiniGame} onComplete={handleComplete} />;
            case 'ABGA':
                return <ABGAGame gameData={activeMiniGame} onComplete={handleComplete} />;
            case 'CT_KEEP':
                return <CTKeepGame onComplete={handleComplete} />;
            case 'CPR':
                return <CPRGame onComplete={handleComplete} />;
            case 'FOLEY_CATHETER':
                return <FoleyCatheterGame onComplete={handleComplete} />;
            default:
                return (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>[{activeMiniGame.type?.name || activeMiniGame.type}]</h3>
                        <p style={{ marginBottom: '20px' }}>아직 상세 구현이 준비되지 않았습니다. 임시로 성공 처리합니다.</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-outline" onClick={handleCancel}>취소</button>
                            <button className="btn btn-primary" onClick={() => handleComplete(true)}>성공 (임시)</button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="overlay-screen" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
            <div className="glass-panel" style={{ margin: 'auto 20px', borderRadius: '15px', overflow: 'hidden', minHeight: '400px', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
                <div style={{ padding: '15px', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{activeMiniGame.patient?.name || 'Emergency'} - {activeMiniGame.type?.name || activeMiniGame.type}</span>
                    <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: 'white', fontWeight: 'bold' }}>축소 (보류)</button>
                </div>

                {showAngryPatient ? (
                    <div style={{ flex: 1, padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <img
                            src={patientImage}
                            alt="Angry Patient"
                            style={{ height: '140px', margin: '0 auto 20px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <h3 style={{ fontSize: '1.4rem', color: '#ef4444', marginBottom: '15px', fontWeight: 'bold' }}>
                            "아니 의사 양반! 부른 지가 언젠데 이제야 와요?!"
                        </h3>
                        <p style={{ marginBottom: '20px', color: '#4b5563', fontSize: '1.1rem' }}>
                            너무 늦게 도착하여 환자와 보호자가 단단히 화가 났습니다. 죄송하다고 사과해야 합니다.
                        </p>
                        <button
                            className="btn btn-danger"
                            onClick={() => {
                                modifyMental(-5, '환자 클레임으로 멘탈이 크게 깎였습니다.');
                                modifyReputation(-5);
                                setShowAngryPatient(false);
                                setApologized(true);
                            }}
                        >
                            도게자 박기 (멘탈 -5, 평판 -5)
                        </button>
                    </div>
                ) : (
                    <div style={{ flex: 1, position: 'relative' }}>
                        {renderGameContent()}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- In-file mini-games for simple ones ---

const CTKeepGame = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);

    const onCompleteRef = useRef(onComplete);
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(p => {
                const next = p + 5;
                if (next >= 100) {
                    clearInterval(interval);
                    if (onCompleteRef.current) onCompleteRef.current(true);
                    return 100;
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ padding: '30px', textAlign: 'center' }}>
            <AlertTriangle size={64} style={{ margin: '0 auto', color: 'var(--warning)', marginBottom: '20px' }} />
            <img src="ct_keep_1772545664550.png" alt="CT Keep" style={{ height: '120px', margin: '0 auto 15px', borderRadius: '15px' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>CT 촬영 대기 중...</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '5px' }}>환자 곁을 떠날 수 없습니다. 주변에서 엄청난 콜이 쏟아질 수 있습니다!</p>
            <p style={{ color: '#ef4444', marginBottom: '20px', fontWeight: 'bold', fontSize: '0.9rem' }}>⚠️ 방사선 보호장비도, 피폭선량계도 없이 맨몸으로 피폭당하는 중...</p>

            <div style={{ width: '100%', height: '20px', backgroundColor: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 1s linear' }}></div>
            </div>
            <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{progress}%</p>
        </div>
    );
};

const CPRGame = ({ onComplete }) => {
    const [presses, setPresses] = useState(0);
    const [lastPressTime, setLastPressTime] = useState(null);
    const [warning, setWarning] = useState("");
    const { modifyMental, modifyReputation } = useGameStore();

    const handlePress = () => {
        const now = Date.now();
        if (lastPressTime) {
            const gap = now - lastPressTime;
            // Guide: 100~120 BPM means ~500ms to 600ms per press.
            if (gap < 450) {
                setWarning("이완이 충분히 안 되고 있잖아! 너무 빨라!");
                modifyMental(-1, 'CPR 압박 속도가 너무 빠릅니다!');
                modifyReputation(-1);
            } else if (gap > 700) {
                setWarning("압박 속도가 너무 느려! 더 빨리!");
                modifyMental(-1, 'CPR 압박 속도가 너무 느립니다!');
                modifyReputation(-1);
            } else {
                setWarning("좋아, 그 페이스 유지해!");
            }
        }
        setLastPressTime(now);

        setPresses(p => {
            if (p + 1 >= 30) {
                setTimeout(() => onComplete(true), 500);
                return p + 1;
            }
            return p + 1;
        });
    };

    return (
        <div style={{ padding: '30px', textAlign: 'center' }}>
            <AlertTriangle size={64} style={{ margin: '0 auto', color: 'var(--danger)', marginBottom: '20px' }} className="vibrating" />
            <img src="cpr_game_1772545649865.png" alt="CPR" style={{ height: '140px', margin: '0 auto 15px', borderRadius: '15px' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'var(--danger)', fontWeight: 'bold' }}>심폐소생술 진행!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>1분당 100~120회 일정한 박자로 가슴을 압박하세요!</p>
            <p style={{ minHeight: '24px', color: warning.includes('좋아') ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold', marginBottom: '20px' }}>{warning}</p>

            <div
                onClick={handlePress}
                style={{
                    width: '150px', height: '150px', margin: '0 auto',
                    backgroundColor: '#ef4444', borderRadius: '50%',
                    color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    fontSize: '2rem', fontWeight: 'bold', cursor: 'pointer',
                    boxShadow: '0 10px 15px rgba(239, 68, 68, 0.5)',
                    userSelect: 'none'
                }}
                onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)'; }}
                onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
                PRESS
            </div>
            <p style={{ marginTop: '20px', fontSize: '1.5rem', fontWeight: 'bold' }}>{presses} / 30 회</p>
        </div>
    );
};

export default MiniGameModal;
