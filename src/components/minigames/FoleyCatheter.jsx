import React, { useState } from 'react';
import useGameStore from '../../store/gameStore';

const FoleyCatheterGame = ({ onComplete }) => {
    const { modifyMental, modifyReputation } = useGameStore();

    const [step, setStep] = useState(0);
    // 0: Start, 1: Gloves on, 2: Catheter partly inserted, 3: Catheter fully inserted (urine visible), 4: Ballooned (success)
    const [urineVisible, setUrineVisible] = useState(false);

    // Sequence of actions: 
    // 1. Wear Sterile Gloves
    // 2. Insert Catheter (Keep pushing until urine shows)
    // 3. Ballooning (Only AFTER urine shows)

    const handleWearGloves = () => {
        if (step === 0) {
            setStep(1);
        }
    };

    const handleInsert = () => {
        if (step === 0) {
            modifyMental(-10, '무균 장갑도 안 끼고 소변줄을 넣다니! (감염 위험, 간호사 경악)');
            alert('무균 장갑을 먼저 껴주세요!');
            return;
        }

        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            setStep(3);
            setUrineVisible(true);
        }
    };

    const handleBalloon = () => {
        if (step < 3) {
            // Fatal mistake: ballooning inside the urethra
            modifyMental(-50, '요도 안에서 펄룬을 터뜨렸습니다! 환자 요도 손상 (혈뇨 콸콸)');
            modifyReputation(-50);
            alert('🚨 [응급] 방광에 닿기도 전에 벌룬을 해서 환자 요도가 파열되었습니다! 혈뇨파티! 평판/멘탈 폭락!');
            onComplete(true); // Game resolves but with massive penalty
        } else if (step === 3) {
            setStep(4);
            setTimeout(() => onComplete(true), 1500);
        }
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#1f2937' }}>
                소변줄(Foley Catheter) 삽입
            </h3>

            {(step >= 2) && (
                <div style={{ width: '100%', height: '150px', backgroundColor: '#fdf2f8', borderRadius: '10px', position: 'relative', overflow: 'hidden', marginBottom: '20px', border: '2px solid #fbcfe8' }}>

                    {/* Catheter Tube */}
                    <div style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '20px',
                        height: step === 2 ? '50%' : '100%',
                        backgroundColor: '#fbbf24',
                        borderRadius: '10px 10px 0 0',
                        transition: 'height 0.5s ease-out'
                    }}></div>

                    {/* Urine Flow Animation */}
                    {urineVisible && (
                        <div style={{
                            position: 'absolute',
                            top: '10%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '10px',
                            height: '80%',
                            backgroundColor: '#fef08a',
                            animation: 'pulse 1s infinite'
                        }}></div>
                    )}

                    {/* Balloon Animation */}
                    {step === 4 && (
                        <div style={{
                            position: 'absolute',
                            top: '20%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#38bdf8',
                            borderRadius: '50%',
                            opacity: 0.8
                        }}></div>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                <button
                    className="btn"
                    style={{ flex: '1 1 45%', padding: '15px', backgroundColor: step >= 1 ? '#d1d5db' : '#3b82f6', color: step >= 1 ? '#9ca3af' : 'white' }}
                    onClick={handleWearGloves}
                    disabled={step >= 1}
                >
                    <img src="sterile_gloves_1772547392717.png" alt="Gloves" style={{ height: '30px', marginBottom: '5px' }} />
                    <br />1. 멸균 장갑 착용
                </button>

                <button
                    className="btn"
                    style={{ flex: '1 1 45%', padding: '15px', backgroundColor: (step >= 3 || step === 0) ? '#d1d5db' : '#10b981', color: (step >= 3 || step === 0) ? '#9ca3af' : 'white' }}
                    onClick={handleInsert}
                    disabled={step >= 3}
                >
                    <img src="foley_catheter_1772547379242.png" alt="Catheter" style={{ height: '30px', marginBottom: '5px' }} />
                    <br />2. 소변줄 밀어넣기
                </button>

                <button
                    className="btn btn-danger"
                    style={{ flex: '1 1 100%', padding: '15px', backgroundColor: step === 4 ? '#d1d5db' : '#ef4444' }}
                    onClick={handleBalloon}
                    disabled={step === 4}
                >
                    <img src="syringe_water_1772547424432.png" alt="Syringe" style={{ height: '30px', marginBottom: '5px' }} />
                    <br />3. Ballooning (증류수 주입)
                </button>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#6b7280', fontWeight: 'bold' }}>
                {step === 0 && "무균 조작이 생명입니다. 장갑부터 끼세요."}
                {step === 1 && "폴리를 삽입하세요."}
                {step === 2 && "계속 밀어 넣으세요. 아직 소변이 안 나옵니다!"}
                {step === 3 && <span style={{ color: '#ca8a04' }}>소변이 나옵니다! 이제 벌룬을 해도 안전합니다.</span>}
                {step === 4 && <span style={{ color: '#16a34a' }}>성공적으로 끝까지 삽입되었습니다!</span>}
            </div>

            {urineVisible && step < 4 && (
                <img src="urine_bag_1772547408015.png" alt="Urine Bag" style={{ position: 'absolute', bottom: '20px', right: '20px', height: '60px', opacity: 0.8, animation: 'bounce 2s infinite' }} />
            )}
        </div>
    );
};

export default FoleyCatheterGame;
