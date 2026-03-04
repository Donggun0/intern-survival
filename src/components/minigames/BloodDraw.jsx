import React, { useState, useEffect } from 'react';
import useGameStore from '../../store/gameStore';
import { ShieldAlert, AlertCircle } from 'lucide-react';

const BloodDrawGame = ({ gameData, onComplete }) => {
    const { modifyMental, modifyReputation } = useGameStore();

    const [step, setStep] = useState(0);
    // 0: Verify Patient
    // 1: Tourniquet & Vein
    // 2: Tube Order

    const [orderPatientMatch, setOrderPatientMatch] = useState(true);
    const [orderName, setOrderName] = useState('');
    const [tourniquetApplied, setTourniquetApplied] = useState(false);

    // Tube Logic
    const TUBE_TYPES = [
        { id: 'BLOOD_CULTURE', name: '바틀(Blood Culture)', color: '#ffffff', order: 1 },
        { id: 'CITRATE', name: '파 (Citrate)', color: '#3b82f6', order: 2 },
        { id: 'SST', name: '노 (SST)', color: '#facc15', order: 3 },
        { id: 'HEPARIN', name: '초 (Heparin)', color: '#22c55e', order: 4 },
        { id: 'EDTA', name: '보 (EDTA)', color: '#9333ea', order: 5 }
    ];

    const [shuffledTubes, setShuffledTubes] = useState([]);
    const [selectedTubes, setSelectedTubes] = useState([]);

    useEffect(() => {
        // 20% chance the nurse put the wrong nameplate
        const isMatch = Math.random() > 0.2;
        setOrderPatientMatch(isMatch);

        if (isMatch) {
            setOrderName(gameData.patient.name);
        } else {
            setOrderName("김아무개"); // Wrong name for order
        }

        setShuffledTubes([...TUBE_TYPES].sort(() => 0.5 - Math.random()));
    }, [gameData]);

    const handleVerify = (action) => {
        if (action === 'proceed') {
            if (!orderPatientMatch) {
                modifyMental(-10, '환자 확인 스킵! 엉뚱한 환자 피를 뽑았습니다. 평판과 멘탈 급감!');
                modifyReputation(-20);
                onComplete(false); // fail minigame
            } else {
                setStep(1);
            }
        } else if (action === 'cancel') {
            if (!orderPatientMatch) {
                // Good job! You caught the mismatch.
                alert("이름표가 잘못된 것을 잡았습니다! 다시 오더를 확인합니다.");
                setStep(1); // proceed with fixing it conceptually
            } else {
                modifyMental(-2, '아무 문제 없는 환자인데 괜히 의심해서 시간을 낭비했습니다.');
                setStep(1);
            }
        }
    };

    const handleVein = () => {
        if (!tourniquetApplied) {
            alert("토니켓(고무줄)을 먼저 묶어서 혈관을 부풀려주세요!");
            modifyMental(-1, '지나가던 수간호사 선생님께 토니켓도 안 묶는다고 혼났습니다.');
            return;
        }
        setStep(2);
    };

    const handleTubeSelect = (tube) => {
        if (selectedTubes.includes(tube)) return;

        const newSelected = [...selectedTubes, tube];
        setSelectedTubes(newSelected);

        // Check if the current selection is correct so far
        const isCorrect = newSelected.every((t, i) => t.order === i + 1);

        if (!isCorrect) {
            alert("순서가 틀렸습니다!! (컬처-파-노-초-보)");
            modifyMental(-3, '진단검사의학과에서 다시 뽑아오라고 전화가 왔습니다.');
            modifyReputation(-5);
            onComplete(false);
            return;
        }

        if (newSelected.length === TUBE_TYPES.length) {
            setTimeout(() => onComplete(true), 500); // Success
        }
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>

            {/* Step 0: Verification */}
            {step === 0 && (
                <div style={{ textAlign: 'center', width: '100%' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--danger)', fontWeight: 'bold' }}>
                        <ShieldAlert style={{ display: 'inline' }} /> 환자 확인 필수!!
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
                        <button className="btn btn-primary" onClick={() => handleVerify('proceed')}>일치함 (채혈시작)</button>
                    </div>
                </div>
            )}

            {/* Step 1: Vein targeting */}
            {step === 1 && (
                <div style={{ textAlign: 'center', width: '100%' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>지혈대(토니켓)를 묶고 혈관을 찾으세요!</h3>

                    <button
                        className={`btn ${tourniquetApplied ? 'btn-success' : 'btn-outline'}`}
                        style={{ marginBottom: '20px', width: '240px', fontWeight: 'bold' }}
                        onClick={() => setTourniquetApplied(true)}
                        disabled={tourniquetApplied}
                    >
                        {tourniquetApplied ? '토니켓 결박 완료 (-)' : '1. 토니켓 묶기 (Click)'}
                    </button>

                    <div style={{
                        width: '240px', height: '180px', backgroundColor: '#fcd34d', margin: '0 auto',
                        borderRadius: '20px', position: 'relative', overflow: 'hidden',
                        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.1)',
                        transition: 'background-color 0.5s',
                        filter: tourniquetApplied ? 'brightness(1)' : 'brightness(0.9)'
                    }}>
                        {/* Fake Veins */}
                        <div style={{ position: 'absolute', top: '20px', left: '10px', width: '220px', height: '12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', transform: 'rotate(12deg)', borderRadius: '10px' }}></div>
                        <div style={{ position: 'absolute', top: '90px', left: '-10px', width: '250px', height: '8px', backgroundColor: 'rgba(59, 130, 246, 0.2)', transform: 'rotate(-8deg)', borderRadius: '10px' }}></div>

                        {/* The Good Vein */}
                        {tourniquetApplied && (
                            <div
                                onClick={handleVein}
                                style={{
                                    position: 'absolute', top: '130px', left: '40px',
                                    width: '160px', height: '18px',
                                    backgroundColor: 'rgba(37, 99, 235, 0.85)', // Dark Blue, pops up after tourniquet
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    boxShadow: '0 0 8px rgba(37, 99, 235, 0.6)',
                                    animation: 'pulse 1.5s infinite'
                                }}
                            >
                                <span style={{ position: 'absolute', width: '100%', textAlign: 'center', top: '-20px', left: '0', fontSize: '0.8rem', color: '#1f2937', fontWeight: 'bold', whiteSpace: 'nowrap' }}>2. 여기다! (찌르기)</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 2: Tubes */}
            {step === 2 && (
                <div style={{ textAlign: 'center', width: '100%' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>검체 튜브 순서 맞추기</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>아주 중요한 족보: 컬처 - 파 - 노 - 초 - 보!</p>

                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginBottom: '20px', minHeight: '80px' }}>
                        {selectedTubes.map((t, idx) => (
                            <div key={idx} style={{ width: '30px', height: '80px', backgroundColor: t.color, border: '1px solid #d1d5db', borderRadius: '0 0 15px 15px', display: 'inline-block' }}></div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        {shuffledTubes.map((tube, idx) => {
                            const isSelected = selectedTubes.includes(tube);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleTubeSelect(tube)}
                                    disabled={isSelected}
                                    style={{
                                        padding: '10px 5px', backgroundColor: tube.color, color: (tube.id === 'BLOOD_CULTURE' || tube.id === 'SST') ? 'black' : 'white',
                                        border: '1px solid #d1d5db', borderRadius: '5px', fontWeight: 'bold', fontSize: '0.8rem', opacity: isSelected ? 0.3 : 1
                                    }}
                                >
                                    {tube.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default BloodDrawGame;
