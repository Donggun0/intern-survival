import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../../store/gameStore';
import { ShieldAlert, Activity } from 'lucide-react';

const ABGAGame = ({ gameData, onComplete }) => {
    const { modifyMental, modifyReputation } = useGameStore();

    const [step, setStep] = useState(0);
    const [pulseSize, setPulseSize] = useState(30);
    const [failCount, setFailCount] = useState(0);
    const dirRef = useRef(1);

    const [orderPatientMatch, setOrderPatientMatch] = useState(true);
    const [orderName, setOrderName] = useState('');

    useEffect(() => {
        // 20% chance the nurse put the wrong nameplate
        const isMatch = Math.random() > 0.2;
        setOrderPatientMatch(isMatch);

        if (isMatch) {
            setOrderName(gameData.patient.name);
        } else {
            setOrderName("김아무개"); // Wrong name
        }
    }, [gameData]);

    useEffect(() => {
        if (step === 1) {
            const pulseInterval = setInterval(() => {
                setPulseSize(prev => {
                    let next = prev + (15 * dirRef.current);
                    if (next >= 120) { next = 120; dirRef.current = -1; }
                    if (next <= 30) { next = 30; dirRef.current = 1; }
                    return next;
                });
            }, 100); // Fast pulse
            return () => clearInterval(pulseInterval);
        }
    }, [step]);

    const handleVerify = (action) => {
        if (action === 'proceed') {
            if (!orderPatientMatch) {
                modifyMental(-30, '환자 확인 스킵! 엉뚱한 동맥을 찔렀습니다. 평판과 멘탈 급감!');
                modifyReputation(-20);
                onComplete(false); // fail minigame
            } else {
                setStep(1);
            }
        } else if (action === 'cancel') {
            if (!orderPatientMatch) {
                alert("이름표가 잘못된 것을 잡았습니다! 다시 오더를 확인합니다.");
                setStep(1);
            } else {
                modifyMental(-5, '아무 문제 없는 환자인데 다시 확인하느라 시간을 낭비했습니다.');
                setStep(1);
            }
        }
    };

    const handleStab = () => {
        if (failCount >= 3) return; // Locked

        if (pulseSize >= 90) {
            // Hit the pulse exactly when it's big
            setTimeout(() => onComplete(true), 500);
        } else {
            // Missed
            const nextFail = failCount + 1;
            setFailCount(nextFail);

            if (nextFail >= 3) {
                modifyMental(-20, 'ABGA 3회 연속 실패! 환자가 노발대발하여 더 이상 찌를 수 없습니다.');
                modifyReputation(-15);
                alert("더 이상 환자가 채혈을 허락하지 않습니다! 동기 찬스를 사용해서 해결하세요.");
            } else {
                modifyMental(-10, `맥이 약한 곳을 찔러 환자가 비명을 지릅니다!! (${nextFail}/3 실패)`);
                modifyReputation(-5);
            }
        }
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>

            {/* Step 0: Verification */}
            {step === 0 && (
                <div style={{ textAlign: 'center', width: '100%' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--danger)', fontWeight: 'bold' }}>
                        <ShieldAlert style={{ display: 'inline' }} /> 동맥혈 채혈 (ABGA) 전 환자 확인
                    </h3>

                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '30px' }}>
                        <div className="glass-panel" style={{ padding: '15px', flex: 1, backgroundColor: '#f3f4f6' }}>
                            <p style={{ fontWeight: 'bold' }}>오더장 (EMR)</p>
                            <p style={{ fontSize: '1.5rem' }}>{orderName}</p>
                            <p>{gameData.patient.idNumber}</p>
                        </div>
                        <div className="glass-panel" style={{ padding: '15px', flex: 1, backgroundColor: '#fef3c7' }}>
                            <p style={{ fontWeight: 'bold' }}>환자 팔찌</p>
                            <p style={{ fontSize: '1.5rem' }}>{gameData.patient.name}</p>
                            <p>{gameData.patient.idNumber}</p>
                        </div>
                    </div>

                    <p style={{ marginBottom: '15px', fontWeight: 'bold' }}>두 이름이 일치합니까?</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleVerify('cancel')}>불일치! (취소)</button>
                        <button className="btn btn-primary" onClick={() => handleVerify('proceed')}>일치함 (ABGA 시작)</button>
                    </div>
                </div>
            )}

            {/* Step 1: Pulse targeting */}
            {step === 1 && (
                <div style={{ textAlign: 'center', width: '100%' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>요골동맥(Radial Artery) 박동 찾기</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '0.9rem' }}>맥박이 <b>가장 크게 뛸 때 (원이 커질 때)</b> 정확히 찌르세요!</p>

                    <div style={{
                        width: '240px', height: '280px', backgroundColor: '#fcd34d', margin: '0 auto',
                        borderRadius: '120px 120px 20px 20px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center',
                        border: '2px solid #fbbf24', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)',
                        opacity: failCount >= 3 ? 0.5 : 1
                    }}>
                        {/* Wrist crease lines */}
                        <div style={{ position: 'absolute', bottom: '60px', width: '150px', height: '2px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
                        <div style={{ position: 'absolute', bottom: '70px', width: '130px', height: '2px', backgroundColor: 'rgba(0,0,0,0.05)' }}></div>

                        {/* The pulsating circle */}
                        <div
                            style={{
                                width: `${pulseSize}px`, height: `${pulseSize}px`,
                                backgroundColor: pulseSize >= 90 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.4)', // Green if hittable, Red otherwise
                                borderRadius: '50%',
                                position: 'absolute',
                                bottom: '80px', left: '60px',
                                pointerEvents: 'none',
                                transition: 'width 0.1s, height 0.1s, background-color 0.1s',
                                boxShadow: pulseSize >= 90 ? '0 0 15px rgba(34,197,94,0.8)' : '0 0 10px rgba(239,68,68,0.5)'
                            }}
                        >
                            {pulseSize >= 90 && <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold', color: 'white', fontSize: '0.8rem', textShadow: '1px 1px 2px black' }}>지금!</span>}
                        </div>

                        {failCount >= 3 ? (
                            <div style={{ position: 'absolute', top: '40%', fontWeight: 'bold', color: 'red', fontSize: '1.2rem', textAlign: 'center' }}>
                                환자 거부 상태!<br />(동기 찬스 필요)
                            </div>
                        ) : (
                            <button
                                onClick={handleStab}
                                className="btn btn-danger"
                                style={{ zIndex: 10, width: '80px', height: '80px', borderRadius: '50%', display: 'flex', flexDirection: 'column', padding: 0, position: 'absolute', bottom: '10px', right: '10px' }}
                            >
                                <Activity size={24} />
                                찌르기
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ABGAGame;
